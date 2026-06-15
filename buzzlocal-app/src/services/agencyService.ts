import axios from 'axios';

const AGENCY_SERVICE_URL = process.env.EXPO_PUBLIC_AGENCY_SERVICE_URL || 'http://localhost:4018';

const agencyService = axios.create({
  baseURL: `${AGENCY_SERVICE_URL}/api/alerts`,
  timeout: 10000,
});

export interface AgencyAlert {
  id: string;
  source: 'bbmp' | 'metro' | 'traffic' | 'weather' | 'bescom' | 'bwssb' | 'fire' | 'police';
  title: string;
  description: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  location?: {
    lat: number;
    lng: number;
    address: string;
    area?: string;
  };
  affectedAreas: string[];
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
}

export interface AgencySource {
  name: string;
  type: string;
  description: string;
  icon: string;
}

export interface UserSubscription {
  sources: string[];
  areas: string[];
  notifyOn: {
    low: boolean;
    medium: boolean;
    high: boolean;
    critical: boolean;
  };
}

export const agencyApi = {
  getPublicAlerts: async (params: {
    source?: string;
    area?: string;
    priority?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; alerts: AgencyAlert[]; total: number }> => {
    const response = await agencyService.get('/public', { params });
    return response.data;
  },

  getSources: async (): Promise<{ success: boolean; sources: AgencySource[] }> => {
    const response = await agencyService.get('/sources');
    return response.data;
  },

  getMetroStatus: async (): Promise<{
    success: boolean;
    status: 'normal' | 'delays';
    alerts: AgencyAlert[];
  }> => {
    const response = await agencyService.get('/metro');
    return response.data;
  },

  getWeatherAlerts: async (): Promise<{ success: boolean; alerts: AgencyAlert[] }> => {
    const response = await agencyService.get('/weather');
    return response.data;
  },

  getTrafficAlerts: async (): Promise<{ success: boolean; alerts: AgencyAlert[] }> => {
    const response = await agencyService.get('/traffic');
    return response.data;
  },

  getPowerUpdates: async (): Promise<{ success: boolean; alerts: AgencyAlert[] }> => {
    const response = await agencyService.get('/power');
    return response.data;
  },

  subscribe: async (subscription: {
    sources: string[];
    areas: string[];
    notifyOn?: UserSubscription['notifyOn'];
  }): Promise<{ success: boolean; subscription: UserSubscription }> => {
    const response = await agencyService.post('/subscribe', subscription);
    return response.data;
  },

  getSubscription: async (): Promise<{ success: boolean; subscription: UserSubscription }> => {
    const response = await agencyService.get('/subscription');
    return response.data;
  },

  getAlertDetail: async (alertId: string): Promise<{ success: boolean; alert: AgencyAlert }> => {
    const response = await agencyService.get(`/${alertId}`);
    return response.data;
  },
};

export default agencyApi;
