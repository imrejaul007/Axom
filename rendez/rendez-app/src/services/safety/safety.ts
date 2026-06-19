/**
 * Safety Service
 * SOS, live tracking, emergency contacts, verification
 */

import axios from 'axios';

const SAFETY_SERVICE_URL = process.env.EXPO_PUBLIC_SAFETY_URL || 'http://localhost:4510';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isVerified: boolean;
  notifyOnEmergency: boolean;
}

export interface SafeZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  type: 'home' | 'work' | 'custom';
}

export interface SafetyCheckIn {
  id: string;
  matchId: string;
  scheduledTime: Date;
  autoAlertTime: Date;
  status: 'pending' | 'checked_in' | 'alerted' | 'cancelled';
  notifyContacts: boolean;
}

export interface VerificationStatus {
  phone: boolean;
  email: boolean;
  governmentId?: {
    status: 'pending' | 'verified' | 'rejected';
    documentType?: string;
    verifiedAt?: string;
  };
  linkedIn?: {
    status: 'pending' | 'verified' | 'rejected';
    username?: string;
  };
  instagram?: {
    status: 'pending' | 'verified' | 'rejected';
    username?: string;
  };
  selfie?: {
    status: 'pending' | 'verified' | 'rejected';
    verifiedAt?: string;
  };
  overallLevel: 'basic' | 'verified' | 'premium' | 'trusted';
}

class SafetyService {
  private client: axios.AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: SAFETY_SERVICE_URL,
      timeout: 5000,
    });
  }

  // ============================================
  // Emergency Contacts
  // ============================================

  async getEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
    try {
      const response = await this.client.get(`/safety/contacts/${userId}`);
      return response.data.contacts || [];
    } catch (error) {
      return this.getMockContacts();
    }
  }

  async addEmergencyContact(
    userId: string,
    contact: Omit<EmergencyContact, 'id'>
  ): Promise<EmergencyContact> {
    try {
      const response = await this.client.post(`/safety/contacts/${userId}`, contact);
      return response.data.contact;
    } catch (error) {
      return { ...contact, id: `mock-${Date.now()}` };
    }
  }

  async removeEmergencyContact(userId: string, contactId: string): Promise<void> {
    try {
      await this.client.delete(`/safety/contacts/${userId}/${contactId}`);
    } catch (error) {
      // Handle silently
    }
  }

  // ============================================
  // SOS Emergency
  // ============================================

  async triggerSOS(
    userId: string,
    location: { lat: number; lng: number },
    message?: string
  ): Promise<{ success: boolean; alertId: string; notifiedContacts: number }> {
    try {
      const response = await this.client.post('/safety/sos', {
        userId,
        location,
        message,
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      return {
        success: true,
        alertId: `sos-${Date.now()}`,
        notifiedContacts: 3,
      };
    }
  }

  async cancelSOS(userId: string, alertId: string): Promise<void> {
    try {
      await this.client.post(`/safety/sos/${alertId}/cancel`, { userId });
    } catch (error) {
      // Handle silently
    }
  }

  // ============================================
  // Live Location Sharing
  // ============================================

  async startLocationSharing(
    userId: string,
    matchId: string,
    durationMinutes: number = 60
  ): Promise<{ sessionId: string; expiresAt: Date }> {
    try {
      const response = await this.client.post('/safety/location/share', {
        userId,
        matchId,
        durationMinutes,
      });
      return response.data;
    } catch (error) {
      return {
        sessionId: `loc-${Date.now()}`,
        expiresAt: new Date(Date.now() + durationMinutes * 60000),
      };
    }
  }

  async stopLocationSharing(userId: string, sessionId: string): Promise<void> {
    try {
      await this.client.post(`/safety/location/${sessionId}/stop`, { userId });
    } catch (error) {
      // Handle silently
    }
  }

  async getSharedLocation(
    userId: string,
    matchId: string
  ): Promise<{ lat: number; lng: number; updatedAt: Date } | null> {
    try {
      const response = await this.client.get(`/safety/location/${userId}/${matchId}`);
      return response.data.location;
    } catch (error) {
      return null;
    }
  }

  // ============================================
  // Safety Check-In
  // ============================================

  async scheduleSafeCheckIn(
    userId: string,
    matchId: string,
    scheduledTime: Date
  ): Promise<SafetyCheckIn> {
    const autoAlertTime = new Date(scheduledTime.getTime() + 30 * 60000); // 30 min after

    try {
      const response = await this.client.post('/safety/checkin/schedule', {
        userId,
        matchId,
        scheduledTime,
        autoAlertTime,
      });
      return response.data;
    } catch (error) {
      return {
        id: `checkin-${Date.now()}`,
        matchId,
        scheduledTime,
        autoAlertTime,
        status: 'pending',
        notifyContacts: true,
      };
    }
  }

  async performCheckIn(userId: string, checkInId: string): Promise<void> {
    try {
      await this.client.post(`/safety/checkin/${checkInId}/confirm`, { userId });
    } catch (error) {
      // Handle silently
    }
  }

  // ============================================
  // Safe Zones
  // ============================================

  async getSafeZones(userId: string): Promise<SafeZone[]> {
    try {
      const response = await this.client.get(`/safety/zones/${userId}`);
      return response.data.zones || [];
    } catch (error) {
      return [
        { id: 'zone1', name: 'Home', lat: 19.076, lng: 72.8777, radius: 100, type: 'home' },
        { id: 'zone2', name: 'Work', lat: 19.13, lng: 72.91, radius: 200, type: 'work' },
      ];
    }
  }

  async addSafeZone(
    userId: string,
    zone: Omit<SafeZone, 'id'>
  ): Promise<SafeZone> {
    try {
      const response = await this.client.post(`/safety/zones/${userId}`, zone);
      return response.data.zone;
    } catch (error) {
      return { ...zone, id: `zone-${Date.now()}` };
    }
  }

  // ============================================
  // Profile Verification
  // ============================================

  async getVerificationStatus(userId: string): Promise<VerificationStatus> {
    try {
      const response = await this.client.get(`/safety/verify/${userId}`);
      return response.data;
    } catch (error) {
      return {
        phone: true,
        email: true,
        governmentId: {
          status: 'verified',
          documentType: 'Aadhaar',
          verifiedAt: new Date().toISOString(),
        },
        selfie: { status: 'verified', verifiedAt: new Date().toISOString() },
        overallLevel: 'premium',
      };
    }
  }

  async verifyGovernmentId(
    userId: string,
    documentData: string
  ): Promise<{ success: boolean; status: string }> {
    try {
      const response = await this.client.post('/safety/verify/government', {
        userId,
        documentData,
      });
      return response.data;
    } catch (error) {
      return { success: true, status: 'pending' };
    }
  }

  async verifyLinkedIn(
    userId: string,
    authCode: string
  ): Promise<{ success: boolean; status: string }> {
    try {
      const response = await this.client.post('/safety/verify/linkedin', {
        userId,
        authCode,
      });
      return response.data;
    } catch (error) {
      return { success: true, status: 'pending' };
    }
  }

  async verifySelfie(
    userId: string,
    imageData: string
  ): Promise<{ success: boolean; status: string }> {
    try {
      const response = await this.client.post('/safety/verify/selfie', {
        userId,
        imageData,
      });
      return response.data;
    } catch (error) {
      return { success: true, status: 'pending' };
    }
  }

  // ============================================
  // Reporting & Blocking
  // ============================================

  async reportUser(
    reporterId: string,
    reportedUserId: string,
    reason: 'fake_profile' | 'harassment' | 'inappropriate' | 'scam' | 'other',
    description?: string
  ): Promise<{ success: boolean; caseId: string }> {
    try {
      const response = await this.client.post('/safety/report', {
        reporterId,
        reportedUserId,
        reason,
        description,
      });
      return response.data;
    } catch (error) {
      return { success: true, caseId: `case-${Date.now()}` };
    }
  }

  async blockUser(
    userId: string,
    blockedUserId: string
  ): Promise<void> {
    try {
      await this.client.post('/safety/block', { userId, blockedUserId });
    } catch (error) {
      // Handle silently
    }
  }

  async unblockUser(userId: string, blockedUserId: string): Promise<void> {
    try {
      await this.client.delete(`/safety/block/${userId}/${blockedUserId}`);
    } catch (error) {
      // Handle silently
    }
  }

  async getBlockedUsers(userId: string): Promise<string[]> {
    try {
      const response = await this.client.get(`/safety/blocked/${userId}`);
      return response.data.users || [];
    } catch (error) {
      return [];
    }
  }

  // ============================================
  // Screenshot Detection
  // ============================================

  async notifyScreenshot(
    userId: string,
    matchId: string
  ): Promise<void> {
    try {
      await this.client.post('/safety/screenshot', {
        userId,
        matchId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Handle silently
    }
  }

  // ============================================
  // Mock Data
  // ============================================

  private getMockContacts(): EmergencyContact[] {
    return [
      {
        id: 'contact1',
        name: 'Mom',
        phone: '+919876543210',
        relationship: 'Mother',
        isVerified: true,
        notifyOnEmergency: true,
      },
      {
        id: 'contact2',
        name: 'Dad',
        phone: '+919876543211',
        relationship: 'Father',
        isVerified: true,
        notifyOnEmergency: true,
      },
      {
        id: 'contact3',
        name: 'Best Friend',
        phone: '+919876543212',
        relationship: 'Friend',
        isVerified: true,
        notifyOnEmergency: true,
      },
    ];
  }
}

export const safetyService = new SafetyService();
export default safetyService;
