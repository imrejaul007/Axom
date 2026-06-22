import axios from 'axios';

const SAFETY_SERVICE_URL = process.env.EXPO_PUBLIC_SAFETY_SERVICE_URL || 'http://localhost:4017';

const safetyService = axios.create({
  baseURL: `${SAFETY_SERVICE_URL}/api/safety`,
  timeout: 10000,
});

export interface SafetyAlert {
  id: string;
  type: 'suspicious' | 'road' | 'crime' | 'hazard' | 'traffic' | 'infrastructure' | 'women_safety' | 'emergency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    area: string;
  };
  credibility: number;
  status: 'active' | 'verified' | 'resolved' | 'false';
  confirmedBy: string[];
  disputedBy: string[];
  createdAt: Date;
}

export interface AreaSafety {
  areaId: string;
  name: string;
  location: { lat: number; lng: number };
  safetyLevel: 'safe' | 'moderate' | 'caution' | 'unsafe';
  score: number;
  activeAlerts: number;
}

export interface TrustedCircleMember {
  userId: string;
  name: string;
  phone: string;
  relationship: string;
  notifyOn: 'always' | 'emergency_only';
}

export const safetyApi = {
  getHeatmap: async (): Promise<{
    success: boolean;
    areas: AreaSafety[];
    alerts: SafetyAlert[];
  }> => {
    const response = await safetyService.get('/heatmap');
    return response.data;
  },

  getAlerts: async (params: {
    area?: string;
    type?: string;
    severity?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; alerts: SafetyAlert[]; total: number }> => {
    const response = await safetyService.get('/alerts', { params });
    return response.data;
  },

  submitAlert: async (data: {
    type: SafetyAlert['type'];
    severity?: SafetyAlert['severity'];
    title: string;
    description: string;
    location: { lat: number; lng: number; address: string; area: string };
    evidence?: string[];
    images?: string[];
  }): Promise<{ success: boolean; alertId: string; credibility: number }> => {
    const response = await safetyService.post('/alert', data);
    return response.data;
  },

  verifyAlert: async (data: {
    alertId: string;
    vote: 'confirm' | 'dispute';
    comment?: string;
  }): Promise<{
    success: boolean;
    credibility: number;
    confirmations: number;
    disputes: number;
  }> => {
    const response = await safetyService.post('/verify', data);
    return response.data;
  },

  triggerSOS: async (data: {
    location: { lat: number; lng: number; area: string };
    type?: string;
    message?: string;
  }): Promise<{ success: boolean; alertId: string; notifiedContacts: number }> => {
    const response = await safetyService.post('/sos', data);
    return response.data;
  },

  getSafeRoute: async (params: {
    fromLat: number;
    fromLng: number;
    toLat: number;
    toLng: number;
  }): Promise<{
    success: boolean;
    route: {
      waypoints: Array<{ lat: number; lng: number }>;
      safetyScore: number;
      estimatedTime: string;
      safeStops: string[];
    };
  }> => {
    const response = await safetyService.get('/safe-route', { params });
    return response.data;
  },

  getCircle: async (): Promise<{ success: boolean; circle: TrustedCircleMember[] }> => {
    const response = await safetyService.get('/circle');
    return response.data;
  },

  addToCircle: async (member: {
    userId: string;
    name: string;
    phone: string;
    relationship?: string;
    notifyOn?: 'always' | 'emergency_only';
  }): Promise<{ success: boolean }> => {
    const response = await safetyService.post('/circle', member);
    return response.data;
  },

  removeFromCircle: async (memberId: string): Promise<{ success: boolean }> => {
    const response = await safetyService.delete(`/circle/${memberId}`);
    return response.data;
  },

  getProfile: async (): Promise<{
    success: boolean;
    profile: {
      womenModeEnabled: boolean;
      shareLocationWith: string;
      autoCheckIn: boolean;
      checkInInterval: number;
    };
  }> => {
    const response = await safetyService.get('/profile');
    return response.data;
  },

  updateProfile: async (updates: Record<string, unknown>): Promise<{ success: boolean }> => {
    const response = await safetyService.put('/profile', updates);
    return response.data;
  },

  getEmergencyContacts: async (): Promise<{
    success: boolean;
    contacts: Array<{
      type: string;
      name: string;
      phone: string;
      distance: string;
    }>;
  }> => {
    const response = await safetyService.get('/emergency-contacts');
    return response.data;
  },
};

export default safetyApi;
