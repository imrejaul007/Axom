import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

const askService = axios.create({
  baseURL: `${API_BASE_URL}/api/ask`,
  timeout: 30000,
});

export interface AskQuery {
  query: string;
  location?: {
    lat: number;
    lng: number;
    area?: string;
  };
  conversationId?: string;
  context?: {
    previousQuery?: string;
  };
}

export interface AskResponse {
  success: boolean;
  queryId: string;
  conversationId: string;
  response: {
    answer: string;
    sources: Array<{
      type: string;
      name?: string;
      badge?: string;
      confidence?: number;
    }>;
    suggestedFollowUps: string[];
    aiAnswerId: string;
  };
  category: string;
}

export interface Answer {
  _id: string;
  userId: string;
  userTrustLevel: string;
  userTrustScore: number;
  content: string;
  type: 'ai' | 'expert' | 'community' | 'verified';
  helpful: number;
  notHelpful: number;
  createdAt: Date;
}

export const askApi = {
  submitQuery: async (data: AskQuery): Promise<AskResponse> => {
    const response = await askService.post('/query', data);
    return response.data;
  },

  submitAnswer: async (queryId: string, content: string): Promise<{ success: boolean; answerId: string }> => {
    const response = await askService.post('/answer', { queryId, content });
    return response.data;
  },

  markHelpful: async (answerId: string): Promise<{ success: boolean; helpful: number }> => {
    const response = await askService.post('/mark-helpful', { answerId });
    return response.data;
  },

  getAnswers: async (queryId: string): Promise<{ success: boolean; answers: Answer[]; total: number }> => {
    const response = await askService.get(`/query/${queryId}/answers`);
    return response.data;
  },

  getHistory: async (limit = 20): Promise<{ success: boolean; queries: unknown[] }> => {
    const response = await askService.get('/history', { params: { limit } });
    return response.data;
  },

  followUp: async (queryId: string, followUpQuery: string): Promise<AskResponse> => {
    const response = await askService.post('/followup', { queryId, followUpQuery });
    return response.data;
  },

  getTrending: async (limit = 10): Promise<{ success: boolean; trending: unknown[] }> => {
    const response = await askService.get('/trending', { params: { limit } });
    return response.data;
  },
};

export default askApi;
