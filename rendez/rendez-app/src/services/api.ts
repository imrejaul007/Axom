import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../store/authStore';
import type {
  AuthVerifyResponse,
  ProfileResponse,
  ProfileDetailResponse,
  MatchResponse,
  MessagesListResponse,
  MessageResponse,
  GiftCatalogItem,
  GiftResponse,
  VoucherResponse,
  MeetupSuggestResponse,
  MeetupBookResponse,
  MeetupStatusResponse,
  WalletBalanceResponse,
  WalletGiftResponse,
  ReferralCodeResponse,
  MessageRequestsResponse,
  ExperienceCredit,
  PhotoUploadResponse,
  PlanResponse,
  PlanDetailResponse,
  PlanApplicantResponse,
  PlanFeedResponse,
} from '../types/api';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
if (!BASE_URL) throw new Error('[Rendez] EXPO_PUBLIC_API_URL is not configured');

export const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('rendez_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// RD-H-06 FIX: Attempt token refresh on 401 before logging out.
// If refresh succeeds, retry the original request with the new token.
// Only logs out if refresh also fails.
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('rendez_refresh_token');
        if (!refreshToken) throw new Error('No refresh token');
        const res = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { headers: { Authorization: `Bearer ${refreshToken}` } },
        );
        const newToken = res.data?.token;
        if (!newToken) throw new Error('No token in refresh response');
        await SecureStore.setItemAsync('rendez_token', newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        onTokenRefreshed(newToken);
        isRefreshing = false;
        return api(originalRequest);
      } catch {
        isRefreshing = false;
        await useAuthStore.getState().logout();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);

// ─── R2-M3: Typed request/response interfaces ─────────────────────────────────

interface CreateProfileRequest {
  name: string;
  age: number;
  city: string;
  gender: string;
  interestedIn: string[];
  intent?: string;
  bio?: string;
}

interface DiscoveryParams {
  city?: string;
  gender?: string;
  ageMin?: number;
  ageMax?: number;
}

// RZ-GIFT-01 FIX: SendGiftRequest was sending {catalogId, recipientProfileId} but the
// backend at rendez-backend/src/routes/gift.ts expects {receiverId, matchId, giftType,
// amountPaise, rezCatalogItemId}. All gift sends were returning 400. Aligned to backend.
interface SendGiftRequest {
  receiverId: string;
  matchId: string;
  giftType: 'COIN' | 'MERCHANT_VOUCHER' | 'CUSTOM';
  amountPaise: number;
  rezCatalogItemId?: string;
  message?: string;
}

interface MeetupBookRequest {
  merchantId: string;
  date: string;
  partySize: number;
}

interface MeetupCheckinRequest {
  bookingId: string;
  merchantId: string;
}

interface CreatePlanRequest {
  category: string;
  title: string;
  merchantName: string;
  merchantId?: string;
  rezBookingRef?: string;
  scheduledAt: string;
  city: string;
  genderPreference: string;
  ageMin: number;
  ageMax: number;
  vibe?: string;
  verifiedOnly: boolean;
  experienceCreditId?: string;
}

interface PlanFeedParams {
  city?: string;
  status?: string;
}

interface PlanConfirmResponse {
  confirmed: boolean;
  coinsCredited: boolean;
}

// Auth
export const authAPI = {
  verifyRezToken: (rezToken: string) =>
    api.post<AuthVerifyResponse>('/auth/verify', {}, { headers: { Authorization: `Bearer ${rezToken}` } }),
};

// Profile
export const profileAPI = {
  create:    (data: CreateProfileRequest)  => api.post<ProfileResponse>('/profile', data),
  getMe:     ()              => api.get<ProfileResponse>('/profile/me'),
  update:    (data: Partial<CreateProfileRequest>)  => api.patch<ProfileResponse>('/profile/me', data),
  getById:   (id: string)    => api.get<ProfileDetailResponse>(`/profile/${id}`),
};

// Referral
export const referralAPI = {
  getMyCode: ()              => api.get<ReferralCodeResponse>('/referral/my-code'),
  applyCode: (code: string)  => api.post('/referral/apply', { code }),
};

// Discovery
export const discoverAPI = {
  getFeed: (params?: DiscoveryParams) => api.get<ProfileResponse[]>('/discover', { params }),
};

// Matches
export const matchAPI = {
  like: (profileId: string) => api.post(`/matches/likes/${profileId}`),
  getAll: () => api.get<MatchResponse[]>('/matches'),
  unmatch: (matchId: string) => api.delete(`/matches/${matchId}`),
};

// Messaging
export const messagingAPI = {
  getMessages: (matchId: string, cursor?: string) =>
    api.get<MessagesListResponse>(`/matches/${matchId}/messages`, { params: { cursor } }),
  send: (matchId: string, content: string) =>
    api.post<MessageResponse>(`/matches/${matchId}/messages`, { content }),
  getState: (matchId: string) => api.get(`/matches/${matchId}/state`),
};

// Gifts
export const giftAPI = {
  getCatalog: (city?: string) => api.get<GiftCatalogItem[]>('/gifts/catalog', { params: { city } }),
  send: (data: SendGiftRequest) => api.post<GiftResponse>('/gifts/send', data),
  accept: (giftId: string) => api.post<GiftResponse>(`/gifts/${giftId}/accept`),
  reject: (giftId: string) => api.post<GiftResponse>(`/gifts/${giftId}/reject`),
  getVoucher: (giftId: string) => api.get<VoucherResponse>(`/gifts/${giftId}/voucher`),
};

// Meetup
export const meetupAPI = {
  suggest: (matchId: string) => api.post<MeetupSuggestResponse>('/meetup/suggest', { matchId }),
  book: (data: MeetupBookRequest) => api.post<MeetupBookResponse>('/meetup/book', data),
  checkin: (matchId: string, data: MeetupCheckinRequest) => api.post<MeetupStatusResponse>(`/meetup/${matchId}/checkin`, data),
  getStatus: (matchId: string) => api.get<MeetupStatusResponse>(`/meetup/${matchId}/status`),
};

// Safety
export const safetyAPI = {
  report: (profileId: string, reason: string, detail?: string) =>
    api.post(`/users/${profileId}/report`, { reason, detail }),
  block: (profileId: string) => api.post(`/users/${profileId}/block`),
};

// Wallet
export const walletAPI = {
  getBalance: () => api.get<WalletBalanceResponse>('/wallet/balance'),
  getReceivedGifts: (status?: string) => api.get<WalletGiftResponse[]>('/wallet/gifts', { params: { status } }),
  getSentGifts: () => api.get<WalletGiftResponse[]>('/wallet/gifts/sent'),
};

// Upload
export const uploadAPI = {
  uploadPhoto: (formData: FormData) =>
    api.post<PhotoUploadResponse>('/upload/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deletePhoto: (index: number) => api.delete(`/upload/photo/${index}`),
};

// Message Requests
export const requestAPI = {
  getInbox:  ()                        => api.get<MessageRequestsResponse>('/requests'),
  accept:    (requestId: string)       => api.post(`/requests/${requestId}/accept`),
  decline:   (requestId: string)       => api.post(`/requests/${requestId}/decline`),
};

// Experience Credits
export const experienceCreditAPI = {
  getAll:       () => api.get<{ credits: ExperienceCredit[] }>('/experience-credits'),
  getAvailable: () => api.get<{ credits: ExperienceCredit[] }>('/experience-credits/available'),
};

// Plans
export const planAPI = {
  create:        (data: CreatePlanRequest)       => api.post<PlanResponse>('/plans', data),
  getFeed:       (params?: PlanFeedParams)       => api.get<PlanFeedResponse>('/plans/feed', { params }),
  getMine:       ()                                       => api.get<{ organized: PlanResponse[]; applied: PlanResponse[] }>('/plans/mine'),
  getDetail:     (planId: string)                         => api.get<PlanDetailResponse>(`/plans/${planId}`),
  apply:         (planId: string, note?: string)          => api.post(`/plans/${planId}/apply`, { note }),
  withdraw:      (planId: string)                         => api.delete(`/plans/${planId}/apply`),
  getApplicants: (planId: string)                         => api.get<PlanApplicantResponse[]>(`/plans/${planId}/applications`),
  select:        (planId: string, applicantId: string)    => api.post(`/plans/${planId}/select/${applicantId}`),
  reselect:      (planId: string, applicantId: string)    => api.post(`/plans/${planId}/reselect/${applicantId}`),
  confirm:       (planId: string)                         => api.post<PlanConfirmResponse>(`/plans/${planId}/confirm`),
  cancel:        (planId: string)                         => api.post(`/plans/${planId}/cancel`),
};
