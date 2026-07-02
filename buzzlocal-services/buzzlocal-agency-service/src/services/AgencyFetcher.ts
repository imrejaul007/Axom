import axios from 'axios';
import { AgencyAlert, AgencySource } from '../models/AgencyModels';
import { NotificationService } from './NotificationService';

const logger = {
  info: (msg: string) => console.log(`[AgencyFetcher] ${msg}`),
  error: (msg: string, meta?: any) => console.error(`[AgencyFetcher] ERROR: ${msg}`, meta),
  warn: (msg: string) => console.warn(`[AgencyFetcher] WARN: ${msg}`),
};

export class AgencyFetcher {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async initialize(): Promise<void> {
    // Create default sources
    const defaultSources = [
      { name: 'BBMP', type: 'bbmp', priority: 1, isActive: true },
      { name: 'BMRC Metro', type: 'metro', priority: 2, isActive: true },
      { name: 'Traffic Police', type: 'traffic', priority: 3, isActive: true },
      { name: 'IMD Weather', type: 'weather', priority: 1, isActive: true },
      { name: 'BESCOM', type: 'bescom', priority: 2, isActive: true },
      { name: 'BWSSB', type: 'bwssb', priority: 2, isActive: true },
      { name: 'Fire Department', type: 'fire', priority: 4, isActive: true },
      { name: 'Police', type: 'police', priority: 4, isActive: true }
    ];

    for (const source of defaultSources) {
      await AgencySource.findOneAndUpdate(
        { type: source.type },
        source,
        { upsert: true }
      );
    }

    logger.info('Agency sources initialized');
  }

  async fetchMetroUpdates(): Promise<void> {
    try {
      const metroApiUrl = process.env.METRO_API_URL || 'http://api.metrorbl.in';
      // In production, fetch from actual API
      // For demo, create sample alerts

      const sampleAlerts = [
        {
          sourceId: 'metro-delay-1',
          title: 'Purple Line Delay',
          description: 'Minor delay due to technical issue. Expected clearance: 10 mins.',
          station: 'Majestic',
          line: 'Purple Line',
          priority: 'medium'
        }
      ];

      for (const alert of sampleAlerts) {
        const existing = await AgencyAlert.findOne({
          source: 'metro',
          sourceId: alert.sourceId
        });

        if (!existing) {
          const newAlert = new AgencyAlert({
            source: 'metro',
            sourceId: alert.sourceId,
            title: alert.title,
            description: alert.description,
            type: 'delay',
            priority: alert.priority as 'low' | 'medium' | 'high' | 'critical',
            location: { address: alert.station },
            affectedAreas: [alert.station],
            isActive: true,
            verified: true
          });

          await newAlert.save();
          await this.notificationService.sendAgencyAlert(newAlert);
        }
      }

      await AgencySource.findOneAndUpdate(
        { type: 'metro' },
        { lastFetch: new Date() }
      );
    } catch (error) {
      logger.error('Failed to fetch metro updates', { error: String(error) });
    }
  }

  async fetchWeatherAlerts(): Promise<void> {
    try {
      // In production, fetch from IMD API
      // For demo, check for active weather alerts

      const imdApiKey = process.env.IMD_API_KEY;
      if (!imdApiKey) {
        logger.warn('IMD API key not configured');
        return;
      }

      // Sample weather alert
      const sampleAlert = {
        sourceId: 'weather-rain-1',
        title: 'Heavy Rain Warning',
        description: 'Heavy rainfall expected in Bengaluru Urban district. Orange alert issued.',
        severity: 'high',
        areas: ['Bengaluru Urban', 'Bengaluru Rural', 'Kolar'],
        endTime: new Date(Date.now() + 12 * 60 * 60 * 1000)
      };

      const existing = await AgencyAlert.findOne({
        source: 'weather',
        sourceId: sampleAlert.sourceId
      });

      if (!existing) {
        const newAlert = new AgencyAlert({
          source: 'weather',
          sourceId: sampleAlert.sourceId,
          title: sampleAlert.title,
          description: sampleAlert.description,
          type: 'weather_warning',
          priority: sampleAlert.severity as 'low' | 'medium' | 'high' | 'critical',
          affectedAreas: sampleAlert.areas,
          endTime: sampleAlert.endTime,
          isActive: true,
          verified: true
        });

        await newAlert.save();
        await this.notificationService.sendAgencyAlert(newAlert);
      }

      await AgencySource.findOneAndUpdate(
        { type: 'weather' },
        { lastFetch: new Date() }
      );
    } catch (error) {
      logger.error('Failed to fetch weather alerts', { error: String(error) });
    }
  }

  async fetchBESCOMUpdates(): Promise<void> {
    try {
      const bescomApiKey = process.env.BESCOM_API_KEY;
      if (!bescomApiKey) {
        logger.warn('BESCOM API key not configured');
        return;
      }

      // Sample BESCOM alert
      const sampleAlert = {
        sourceId: 'bescom-outage-1',
        title: 'Scheduled Maintenance',
        description: 'Power shutdown in HSR Layout for maintenance. 9 AM - 5 PM.',
        location: { address: 'HSR Layout', area: 'HSR' },
        areas: ['HSR Layout', 'HSR Sector 1', 'HSR Sector 2'],
        priority: 'medium'
      };

      const existing = await AgencyAlert.findOne({
        source: 'bescom',
        sourceId: sampleAlert.sourceId
      });

      if (!existing) {
        const newAlert = new AgencyAlert({
          source: 'bescom',
          sourceId: sampleAlert.sourceId,
          title: sampleAlert.title,
          description: sampleAlert.description,
          type: 'power_outage',
          priority: sampleAlert.priority as 'low' | 'medium' | 'high' | 'critical',
          location: sampleAlert.location,
          affectedAreas: sampleAlert.areas,
          isActive: true,
          verified: true
        });

        await newAlert.save();
        await this.notificationService.sendAgencyAlert(newAlert);
      }

      await AgencySource.findOneAndUpdate(
        { type: 'bescom' },
        { lastFetch: new Date() }
      );
    } catch (error) {
      logger.error('Failed to fetch BESCOM updates', { error: String(error) });
    }
  }

  async clearExpiredAlerts(): Promise<void> {
    const now = new Date();
    await AgencyAlert.updateMany(
      {
        isActive: true,
        $or: [
          { endTime: { $lt: now } },
          { expiresAt: { $lt: now } }
        ]
      },
      {
        isActive: false
      }
    );
  }
}
