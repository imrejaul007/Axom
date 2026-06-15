import axios from 'axios';

const SOCIETY_SERVICE_URL = process.env.EXPO_PUBLIC_SOCIETY_SERVICE_URL || 'http://localhost:4019';

const societyService = axios.create({
  baseURL: `${SOCIETY_SERVICE_URL}/api/societies`,
  timeout: 10000,
});

export interface Society {
  id: string;
  name: string;
  type: 'apartment' | 'gated' | 'layout' | 'campus' | 'society';
  address: {
    street: string;
    area: string;
    city: string;
    pincode: string;
  };
  location: { lat: number; lng: number };
  memberCount: number;
  facilities: Array<{
    name: string;
    description: string;
    capacity: number;
    available: boolean;
  }>;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'normal' | 'important' | 'urgent';
  authorId: string;
  authorRole: string;
  isPinned: boolean;
  createdAt: Date;
}

export interface Visitor {
  id: string;
  visitorName: string;
  purpose: string;
  expectedDate: Date;
  flatNumber: string;
  status: 'pending' | 'approved' | 'rejected' | 'arrived' | 'left';
}

export interface Classified {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  condition: string;
  images: string[];
  status: 'active' | 'sold' | 'reserved';
  sellerId: string;
  createdAt: Date;
}

export interface MaintenanceRequest {
  id: string;
  title: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'resolved';
  createdAt: Date;
}

export const societyApi = {
  getSocieties: async (params?: {
    type?: string;
    area?: string;
    search?: string;
  }): Promise<{ success: boolean; societies: Society[] }> => {
    const response = await societyService.get('/', { params });
    return response.data;
  },

  getSociety: async (societyId: string): Promise<{ success: boolean; society: Society }> => {
    const response = await societyService.get(`/${societyId}`);
    return response.data;
  },

  joinSociety: async (societyId: string, data?: {
    flat?: string;
    wing?: string;
    inviteCode?: string;
  }): Promise<{ success: boolean; message: string }> => {
    const response = await societyService.post(`/${societyId}/join`, data);
    return response.data;
  },

  getAnnouncements: async (societyId: string, limit = 20): Promise<{
    success: boolean;
    announcements: Announcement[];
  }> => {
    const response = await societyService.get(`/${societyId}/announcements`, { params: { limit } });
    return response.data;
  },

  createAnnouncement: async (societyId: string, data: {
    title: string;
    content: string;
    priority?: 'normal' | 'important' | 'urgent';
  }): Promise<{ success: boolean; announcement: Announcement }> => {
    const response = await societyService.post(`/${societyId}/announcements`, data);
    return response.data;
  },

  getVisitors: async (societyId: string, params?: {
    date?: string;
    status?: string;
  }): Promise<{ success: boolean; visitors: Visitor[] }> => {
    const response = await societyService.get(`/${societyId}/visitors`, { params });
    return response.data;
  },

  addVisitor: async (societyId: string, data: {
    visitorName: string;
    visitorPhone?: string;
    purpose: string;
    expectedDate: string;
    expectedTime?: string;
    flatNumber: string;
  }): Promise<{ success: boolean; visitor: Visitor }> => {
    const response = await societyService.post(`/${societyId}/visitors`, data);
    return response.data;
  },

  updateVisitorStatus: async (societyId: string, visitorId: string, status: string): Promise<{
    success: boolean;
    visitor: Visitor;
  }> => {
    const response = await societyService.put(`/${societyId}/visitors/${visitorId}`, { status });
    return response.data;
  },

  getClassifieds: async (societyId: string, params?: {
    category?: string;
    status?: string;
  }): Promise<{ success: boolean; classifieds: Classified[] }> => {
    const response = await societyService.get(`/${societyId}/classifieds`, { params });
    return response.data;
  },

  createClassified: async (societyId: string, data: {
    title: string;
    description: string;
    category: string;
    price: number;
    condition: string;
    images: string[];
  }): Promise<{ success: boolean; classified: Classified }> => {
    const response = await societyService.post(`/${societyId}/classifieds`, data);
    return response.data;
  },

  getMaintenance: async (societyId: string, status?: string): Promise<{
    success: boolean;
    requests: MaintenanceRequest[];
  }> => {
    const response = await societyService.get(`/${societyId}/maintenance`, { params: { status } });
    return response.data;
  },

  createMaintenanceRequest: async (societyId: string, data: {
    category: string;
    title: string;
    description: string;
    location?: string;
    priority?: string;
  }): Promise<{ success: boolean; request: MaintenanceRequest }> => {
    const response = await societyService.post(`/${societyId}/maintenance`, data);
    return response.data;
  },

  getMembers: async (societyId: string): Promise<{
    success: boolean;
    members: Array<{
      userId: string;
      role: string;
      flat?: string;
      joinedAt: Date;
    }>;
  }> => {
    const response = await societyService.get(`/${societyId}/members`);
    return response.data;
  },
};

export default societyApi;
