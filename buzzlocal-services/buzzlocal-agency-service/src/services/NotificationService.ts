import axios from 'axios';

export class NotificationService {
  private notificationServiceUrl: string;

  constructor() {
    this.notificationServiceUrl = process.env.REZ_NOTIFICATIONS_SERVICE_URL || 'http://localhost:4011';
  }

  async sendAgencyAlert(alert: any): Promise<void> {
    try {
      const priority = alert.priority === 'critical' ? 'high' : 'normal';

      await axios.post(`${this.notificationServiceUrl}/api/notifications/send-broadcast`, {
        type: 'agency_alert',
        source: alert.source,
        title: alert.title,
        body: alert.description.substring(0, 100),
        data: {
          alertId: alert._id,
          source: alert.source,
          priority: alert.priority,
          location: alert.location,
          affectedAreas: alert.affectedAreas
        },
        filters: {
          areas: alert.affectedAreas || [],
          sources: [alert.source]
        },
        priority
      }, {
        headers: {
          'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
        }
      });
    } catch (error) {
      console.error('Failed to send agency notification:', error);
    }
  }
}
