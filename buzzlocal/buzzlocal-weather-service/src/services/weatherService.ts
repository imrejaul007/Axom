import logger from './utils/logger';

import axios from 'axios';
import { WeatherObservation, LocationWeatherInsight } from '../models/index.js';

const OPENWEATHER_API_KEY = process.env.OPENWEATHERMAP_API_KEY;
const OPENWEATHER_BASE = 'https://api.openweathermap.org/data/2.5';

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  visibility: number;
  clouds: number;
  condition: string;
  conditionMain: string;
  rain?: { '1h': number; '3h': number };
  snow?: { '1h': number; '3h': number };
  city: string;
  country: string;
}

export interface WeatherInsight {
  type: 'traffic' | 'outdoor' | 'shopping' | 'dining' | 'events';
  score: number;
  message: string;
  suggestions: string[];
}

export class WeatherService {
  private cache: Map<string, { data: WeatherData; timestamp: number }> = new Map();
  private cacheTimeout = 10 * 60 * 1000; // 10 minutes

  /**
   * Get current weather from OpenWeatherMap
   */
  async getCurrentWeather(lat: number, lng: number): Promise<WeatherData | null> {
    const cacheKey = `${lat.toFixed(2)}_${lng.toFixed(2)}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    if (!OPENWEATHER_API_KEY) {
      logger.warn('OpenWeatherMap API key not configured');
      return null;
    }

    try {
      const response = await axios.get(`${OPENWEATHER_BASE}/weather`, {
        params: {
          lat,
          lon: lng,
          appid: OPENWEATHER_API_KEY,
          units: 'metric',
        },
      });

      const data = response.data;
      const weather: WeatherData = {
        temperature: data.main.temp,
        feelsLike: data.main.feels_like,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed * 3.6, // m/s to km/h
        pressure: data.main.pressure,
        visibility: data.visibility / 1000,
        clouds: data.clouds.all,
        condition: data.weather[0].description,
        conditionMain: data.weather[0].main,
        rain: data.rain,
        snow: data.snow,
        city: data.name,
        country: data.sys.country,
      };

      this.cache.set(cacheKey, { data: weather, timestamp: Date.now() });

      // Store in database
      await this.storeObservation(lat, lng, weather);

      return weather;
    } catch (error) {
      logger.error('Failed to fetch weather:', error);
      return null;
    }
  }

  /**
   * Store weather observation in database
   */
  private async storeObservation(lat: number, lng: number, weather: WeatherData): Promise<void> {
    try {
      const observation = new WeatherObservation({
        location: {
          latitude: lat,
          longitude: lng,
        },
        temperature: weather.temperature,
        feelsLike: weather.feelsLike,
        humidity: weather.humidity,
        windSpeed: weather.windSpeed,
        pressure: weather.pressure,
        visibility: weather.visibility,
        clouds: weather.clouds,
        condition: weather.condition,
        conditionMain: weather.conditionMain,
        rain: weather.rain,
        snow: weather.snow,
        source: 'api',
      });

      await observation.save();
    } catch (error) {
      logger.error('Failed to store observation:', error);
    }
  }

  /**
   * Get weather insights for a location
   */
  async getInsights(lat: number, lng: number, area: string, city: string): Promise<WeatherInsight[]> {
    // Get current weather
    const weather = await this.getCurrentWeather(lat, lng);
    if (!weather) return this.getDefaultInsights();

    return this.generateInsights(weather);
  }

  /**
   * Generate insights based on weather
   */
  private generateInsights(weather: WeatherData): WeatherInsight[] {
    const insights: WeatherInsight[] = [];

    // Outdoor activities
    if (weather.conditionMain === 'Clear' && weather.temperature >= 20 && weather.temperature <= 30) {
      insights.push({
        type: 'outdoor',
        score: 90,
        message: 'Perfect weather for outdoor activities!',
        suggestions: ['Go for a walk', 'Visit a park', 'Outdoor sports'],
      });
    } else if (weather.conditionMain === 'Rain' || weather.conditionMain === 'Thunderstorm') {
      insights.push({
        type: 'outdoor',
        score: 20,
        message: 'Not ideal for outdoor activities',
        suggestions: ['Indoor activities', 'Visit a cafe', 'Movie time'],
      });
    }

    // Traffic
    if (weather.rain?.['1h'] > 5 || weather.clouds > 80) {
      insights.push({
        type: 'traffic',
        score: 40,
        message: 'Weather may affect traffic conditions',
        suggestions: ['Leave early', 'Use public transport', 'Plan alternate routes'],
      });
    } else {
      insights.push({
        type: 'traffic',
        score: 85,
        message: 'Good driving conditions',
        suggestions: ['Normal commute', 'Good time for delivery'],
      });
    }

    // Dining
    if (weather.temperature > 28) {
      insights.push({
        type: 'dining',
        score: 70,
        message: 'Hot weather - people prefer cold drinks & AC',
        suggestions: ['Ice cream shops', 'Cold beverages', 'AC restaurants'],
      });
    } else if (weather.rain?.['1h'] > 2) {
      insights.push({
        type: 'dining',
        score: 80,
        message: 'Rainy day = cozy dining',
        suggestions: ['Hot food', 'Soup restaurants', 'Indoor dining'],
      });
    }

    // Shopping
    if (weather.rain?.['1h'] > 3 || weather.conditionMain === 'Thunderstorm') {
      insights.push({
        type: 'shopping',
        score: 90,
        message: 'Indoor shopping is popular today',
        suggestions: ['Mall visits', 'Window shopping', 'Online orders'],
      });
    }

    // Events
    if (weather.conditionMain === 'Clear' && weather.temperature < 30) {
      insights.push({
        type: 'events',
        score: 95,
        message: 'Great weather for outdoor events!',
        suggestions: ['Outdoor concerts', 'Food festivals', 'Markets'],
      });
    }

    return insights;
  }

  /**
   * Get default insights
   */
  private getDefaultInsights(): WeatherInsight[] {
    return [
      {
        type: 'outdoor',
        score: 75,
        message: 'Moderate conditions for outdoor activities',
        suggestions: ['Check local forecast', 'Plan accordingly'],
      },
      {
        type: 'dining',
        score: 70,
        message: 'Good conditions for dining',
        suggestions: ['Check local restaurants'],
      },
    ];
  }

  /**
   * Get weather history for an area
   */
  async getWeatherHistory(city: string, hours: number = 24): Promise<unknown[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    return WeatherObservation.find({
      'location.city': city,
      createdAt: { $gte: since },
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
  }

  /**
   * Get weather statistics for an area
   */
  async getWeatherStats(city: string): Promise<unknown> {
    const stats = await WeatherObservation.aggregate([
      { $match: { 'location.city': city } },
      {
        $group: {
          _id: null,
          avgTemperature: { $avg: '$temperature' },
          avgHumidity: { $avg: '$humidity' },
          avgWindSpeed: { $avg: '$windSpeed' },
          totalObservations: { $sum: 1 },
          conditions: { $push: '$conditionMain' },
        },
      },
    ]);

    if (stats.length === 0) {
      return null;
    }

    const dominantCondition = this.getMostFrequent(stats[0].conditions);

    return {
      avgTemperature: Math.round(stats[0].avgTemperature * 10) / 10,
      avgHumidity: Math.round(stats[0].avgHumidity),
      avgWindSpeed: Math.round(stats[0].avgWindSpeed),
      totalObservations: stats[0].totalObservations,
      dominantCondition,
    };
  }

  private getMostFrequent(arr: string[]): string {
    const counts: Record<string, number> = {};
    arr.forEach((item) => {
      counts[item] = (counts[item] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }
}

export const weatherService = new WeatherService();
