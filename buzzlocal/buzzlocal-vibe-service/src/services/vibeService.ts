import { VibeAreaModel, IVibeArea, AreaMood, CheckIn, ICheckIn } from '../models/index.js';
import axios from 'axios';

interface Location {
  latitude: number;
  longitude: number;
}

interface VibeAreaData {
  id: string;
  name: string;
  center: Location;
  radius: number;
  mood: AreaMood;
  crowdLevel: 1 | 2 | 3 | 4 | 5;
  trending: boolean;
  activeUsers: number;
  bestTimeToVisit?: string;
  prediction?: string;
}

interface CheckInData {
  userId: string;
  location: Location;
  placeId?: string;
  placeName?: string;
  source: 'qr' | 'manual' | 'auto';
}

export class VibeService {
  /**
   * Get nearby vibe areas
   */
  async getNearbyAreas(
    location: Location,
    radius: number = 5000
  ): Promise<VibeAreaData[]> {
    // Query for areas within radius
    // In production, use geospatial queries
    const areas = await VibeAreaModel.find({
      'center.latitude': {
        $gte: location.latitude - (radius / 111000),
        $lte: location.latitude + (radius / 111000),
      },
      'center.longitude': {
        $gte: location.longitude - (radius / (111000 * Math.cos(location.latitude * Math.PI / 180))),
        $lte: location.longitude + (radius / (111000 * Math.cos(location.latitude * Math.PI / 180))),
      },
    }).lean();

    return areas.map((area) => this.transformArea(area));
  }

  /**
   * Get single area by ID
   */
  async getArea(areaId: string): Promise<VibeAreaData | null> {
    const area = await VibeAreaModel.findById(areaId).lean();
    if (!area) return null;
    return this.transformArea(area);
  }

  /**
   * Get crowd heatmap data
   */
  async getCrowdHeatmap(location: Location, radius: number = 5000): Promise<{
    areas: { lat: number; lng: number; intensity: number }[];
    lastUpdated: string;
  }> {
    // Get active check-ins in the area
    const checkins = await CheckIn.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude],
          },
          distanceField: 'distance',
          maxDistance: radius,
          spherical: true,
        },
      },
      {
        $match: {
          checkInTime: {
            $gte: new Date(Date.now() - 30 * 60 * 1000), // Last 30 mins
          },
        },
      },
      {
        $group: {
          _id: {
            lat: { $round: ['$location.latitude', 3] },
            lng: { $round: ['$location.longitude', 3] },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const areas = checkins.map((c) => ({
      lat: c._id.lat,
      lng: c._id.lng,
      intensity: Math.min(c.count / 10, 1), // Normalize to 0-1
    }));

    return {
      areas,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Check in to a location
   */
  async checkIn(data: CheckInData): Promise<ICheckIn & { coinReward: number }> {
    // Check for existing active check-in
    const existingCheckin = await CheckIn.findOne({
      userId: data.userId,
      checkOutTime: { $exists: false },
    });

    if (existingCheckin) {
      // Auto checkout previous
      existingCheckin.checkOutTime = new Date();
      existingCheckin.duration = Math.round(
        (existingCheckin.checkOutTime.getTime() - existingCheckin.checkInTime.getTime()) / 60000
      );
      await existingCheckin.save();
    }

    // Create new check-in
    const checkIn = new CheckIn({
      userId: data.userId,
      location: data.location,
      placeId: data.placeId,
      placeName: data.placeName,
      source: data.source,
    });
    await checkIn.save();

    // Award coins for check-in
    const coinReward = 10; // 10 coins per check-in
    this.awardCoins(data.userId, coinReward, 'check_in', checkIn._id.toString())
      .catch(console.error);

    return checkIn as ICheckIn & { coinReward: number };
  }

  /**
   * Check out from current location
   */
  async checkOut(userId: string): Promise<{ duration: number; coinsEarned: number }> {
    const checkIn = await CheckIn.findOne({
      userId,
      checkOutTime: { $exists: false },
    });

    if (!checkIn) {
      throw new Error('No active check-in found');
    }

    checkIn.checkOutTime = new Date();
    checkIn.duration = Math.round(
      (checkIn.checkOutTime.getTime() - checkIn.checkInTime.getTime()) / 60000
    );
    await checkIn.save();

    // Bonus coins for staying longer
    const bonusCoins = checkIn.duration > 30 ? Math.floor(checkIn.duration / 30) * 5 : 0;
    if (bonusCoins > 0) {
      await this.awardCoins(userId, bonusCoins, 'extended_checkout', checkIn._id.toString())
        .catch(console.error);
    }

    return {
      duration: checkIn.duration,
      coinsEarned: bonusCoins,
    };
  }

  /**
   * Get user's current check-in
   */
  async getCurrentCheckIn(userId: string): Promise<ICheckIn | null> {
    return CheckIn.findOne({
      userId,
      checkOutTime: { $exists: false },
    }).lean();
  }

  /**
   * Get user's check-in history
   */
  async getCheckInHistory(userId: string, limit: number = 20): Promise<ICheckIn[]> {
    return CheckIn.find({ userId })
      .sort({ checkInTime: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Get area mood prediction
   */
  async getMoodPrediction(areaId: string): Promise<{
    current: AreaMood;
    prediction: string;
    bestTime: string;
    confidence: number;
  }> {
    const area = await VibeAreaModel.findById(areaId);
    if (!area) {
      throw new Error('Area not found');
    }

    const hour = new Date().getHours();

    // Predict mood based on time and crowd level
    let prediction: string;
    let confidence = 0.7;

    if (hour >= 22 || hour < 4) {
      prediction = area.crowdLevel >= 3 ? 'party' : 'chill';
    } else if (hour >= 6 && hour < 12) {
      prediction = 'chill';
    } else if (hour >= 12 && hour < 17) {
      prediction = 'busy';
    } else if (hour >= 17 && hour < 22) {
      prediction = area.crowdLevel >= 4 ? 'party' : 'family';
    } else {
      prediction = area.mood;
    }

    // Find best time to visit - STATISTICAL: random selection for display, not security critical
    const bestHour = area.peakHours.length > 0
      ? area.peakHours[Math.floor(Math.random() * area.peakHours.length)]
      : 12;

    return {
      current: area.mood,
      prediction,
      bestTime: `${bestHour}:00 - ${bestHour + 2}:00`,
      confidence,
    };
  }

  /**
   * Update area stats (called periodically or on events)
   */
  async updateAreaStats(areaId: string, data: {
    crowdLevel?: 1 | 2 | 3 | 4 | 5;
    activeUsers?: number;
    trending?: boolean;
  }): Promise<void> {
    await VibeAreaModel.findByIdAndUpdate(areaId, data);
  }

  /**
   * Create or update a vibe area
   */
  async upsertArea(data: {
    name: string;
    center: Location;
    radius?: number;
  }): Promise<IVibeArea> {
    const area = await VibeAreaModel.findOneAndUpdate(
      { name: data.name },
      {
        $set: {
          center: data.center,
          radius: data.radius || 1000,
        },
        $setOnInsert: {
          mood: 'chill',
          crowdLevel: 1,
          trending: false,
          activeUsers: 0,
        },
      },
      { upsert: true, new: true }
    );

    return area;
  }

  /**
   * Award coins to user
   */
  private async awardCoins(
    userId: string,
    amount: number,
    reason: string,
    relatedId?: string
  ): Promise<void> {
    try {
      await axios.post(
        `${process.env.WALLET_SERVICE_URL || 'http://localhost:4002'}/wallet/earn`,
        {
          userId,
          amount,
          reason,
          relatedId,
          source: 'buzzlocal_vibe',
        }
      );
    } catch (error) {
      console.error('Failed to award coins:', error);
    }
  }

  /**
   * Transform area for API response
   */
  private transformArea(area): VibeAreaData {
    return {
      id: area._id.toString(),
      name: area.name,
      center: area.center,
      radius: area.radius,
      mood: area.mood,
      crowdLevel: area.crowdLevel,
      trending: area.trending,
      activeUsers: area.activeUsers,
      bestTimeToVisit: this.getBestTime(area.peakHours),
    };
  }

  private getBestTime(peakHours: number[]): string {
    if (!peakHours || peakHours.length === 0) {
      return '10:00 - 14:00';
    }
    const hour = peakHours[0];
    return `${hour}:00 - ${hour + 3}:00`;
  }
}

export const vibeService = new VibeService();
