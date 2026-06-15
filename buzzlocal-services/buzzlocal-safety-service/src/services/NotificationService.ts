import axios from 'axios';

export class NotificationService {
  private notificationServiceUrl: string;

  constructor() {
    this.notificationServiceUrl = process.env.REZ_NOTIFICATIONS_SERVICE_URL || 'http://localhost:4011';
  }

  async sendAlertNotification(alert: any): Promise<void> {
    try {
      await axios.post(`${this.notificationServiceUrl}/api/notifications/send`, {
        type: 'safety_alert',
        title: alert.title,
        body: `${alert.type}: ${alert.description.substring(0, 100)}`,
        data: {
          alertId: alert._id,
          type: alert.type,
          severity: alert.severity,
          location: alert.location,
          credibility: alert.credibility
        },
        filters: {
          area: alert.location.area,
          distance: 5000 // 5km radius
        }
      }, {
        headers: {
          'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
        }
      });
    } catch (error) {
      console.error('Failed to send alert notification:', error);
    }
  }

  async sendSOSNotification(userId: string, data: any): Promise<void> {
    try {
      await axios.post(`${this.notificationServiceUrl}/api/notifications/send`, {
        type: 'sos',
        userId,
        title: 'Emergency SOS',
        body: 'A trusted contact has triggered SOS. Tap to help.',
        data: {
          alertId: data.alertId,
          location: data.location,
          triggeredBy: data.triggeredBy
        },
        priority: 'high'
      }, {
        headers: {
          'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
        }
      });
    } catch (error) {
      console.error('Failed to send SOS notification:', error);
    }
  }

  async sendSafetyCheckInReminder(userId: string, checkInId: string): Promise<void> {
    try {
      await axios.post(`${this.notificationServiceUrl}/api/notifications/send`, {
        type: 'safety_reminder',
        userId,
        title: 'Safety Check-in Reminder',
        body: "Don't forget to check in safe!",
        data: {
          checkInId
        },
        priority: 'normal'
      }, {
        headers: {
          'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN
        }
      });
    } catch (error) {
      console.error('Failed to send reminder:', error);
    }
  }
}
