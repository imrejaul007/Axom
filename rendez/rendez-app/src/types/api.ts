/**
 * Typed API response contracts.
 * RD-H-09 FIX: All API responses are explicitly typed so TypeScript can catch
 * mismatched response shapes at compile time.
 */

export interface ProfileResponse {
  id: string;
  name: string;
  age: number;
  city: string;
  gender: string;
  bio?: string;
  photos: string[];
  intent?: 'DATING' | 'FRIENDSHIP' | 'NETWORKING';
  isVerified: boolean;
  profileScore: number;
  meetupCount: number;
  responseRate: number;
  createdAt: string;
}

export interface TrustSignals {
  trustLevel: 'UNVERIFIED' | 'VERIFIED' | 'BRONZE' | 'SILVER' | 'GOLD';
  trustLevelLabel: string;
  responseLabel: 'SLUGGISH' | 'SLOW' | 'RESPONSIVE' | 'QUICK' | 'LIKELY_TO_REPLY';
  responsePercent: number;
  activeLabel: 'ACTIVE_TODAY' | 'ACTIVE_THIS_WEEK' | 'ACTIVE_THIS_MONTH' | 'INACTIVE';
  lastActiveAt: string | null;
  profileCompleteness: number;
}

export interface ProfileDetailResponse extends ProfileResponse {
  interestedIn: string[];
  rezSpendScore: number;
  lastActiveAt: string | null;
  trustSignals: TrustSignals;
}

export interface AuthVerifyResponse {
  token: string | null;
  hasProfile: boolean;
  profile?: ProfileResponse;
}

export interface MatchResponse {
  id: string;
  users: [ProfileResponse, ProfileResponse];
  status: string;
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount?: number;
  createdAt: string;
}

export interface MessageResponse {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface MessagesListResponse {
  messages: MessageResponse[];
  state: 'MATCHED' | 'LOCKED' | 'AWAITING_REPLY' | 'GIFT_PENDING' | 'FREE_MSG_SENT';
}

export interface GiftCatalogItem {
  id: string;
  name: string;
  amount_paise: number;
  merchant_name: string;
  merchant_id: string;
  image_url?: string;
  category: string;
}

export interface GiftResponse {
  id: string;
  senderId: string;
  receiverId: string;
  matchId: string;
  giftType: 'COIN' | 'MERCHANT_VOUCHER' | 'CUSTOM';
  amountPaise: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'REDEEMED' | 'EXPIRED';
  message?: string;
  qrCodeUrl?: string;
  createdAt: string;
}

export interface VoucherResponse {
  qr_code_url: string;
  merchant_name: string;
  valid_until: string;
  status: 'ACTIVE' | 'REDEEMED' | 'EXPIRED';
}

export interface MeetupSuggestResponse {
  merchants: Array<{
    merchant_id: string;
    name: string;
    category: string;
    address: string;
    distance_km: number;
    rating: number;
    rendez_verified?: boolean;
  }>;
}

export interface MeetupBookResponse {
  booking_id: string;
  scheduled_at: string;
}

export interface MeetupStatusResponse {
  booking_id: string;
  bothCheckedIn: boolean;
  alreadyCheckedIn: boolean;
  partnerCheckedIn: boolean;
  reward?: {
    status: 'PENDING' | 'TRIGGERED' | 'FAILED';
    coins?: number;
  };
}

export interface WalletBalanceResponse {
  coins: number;
  lastUpdated: string;
}

export interface WalletGiftResponse {
  id: string;
  sender: { id: string; name: string; photo?: string };
  match: { id: string };
  giftType: 'COIN' | 'MERCHANT_VOUCHER';
  amountPaise: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'REDEEMED' | 'EXPIRED';
  qrCodeUrl?: string;
  createdAt: string;
}

export interface ReferralCodeResponse {
  code: string;
  shareUrl: string;
  referralCount: number;
}

export interface MessageRequest {
  id: string;
  fromProfileId: string;
  fromName: string;
  fromPhoto?: string;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
}

export interface MessageRequestsResponse {
  requests: MessageRequest[];
  hasMore: boolean;
}

export interface PlanResponse {
  id: string;
  title: string;
  category: string;
  city: string;
  merchantName: string;
  merchantId?: string;
  scheduledAt: string;
  expiresAt: string;
  capacity: number;
  status: 'OPEN' | 'FILLED' | 'CANCELLED' | 'COMPLETED' | 'EXPIRED';
  vibe?: string;
  verifiedOnly: boolean;
  organizer: { id: string; name: string; phone: string; isVerified: boolean };
  applicantCount: number;
  confirmedCount: number;
  isSponsored?: boolean;
  sponsorPerAttendeeCoins?: number;
  sponsorBudgetCoins?: number;
  createdAt: string;
}

export interface PlanDetailResponse extends PlanResponse {
  sponsorSpentCoins?: number;
  description?: string;
  genderPreference?: string;
  ageMin?: number;
  ageMax?: number;
  applications?: PlanApplicantResponse[];
}

export interface PlanApplicantResponse {
  id: string;
  profileId: string;
  name: string;
  age: number;
  city: string;
  bio?: string;
  photos: string[];
  intent?: string;
  isVerified: boolean;
  profileScore: number;
  note?: string;
  appliedAt: string;
}

export interface PlanFeedResponse {
  plans: PlanResponse[];
  nextCursor?: string;
}

export interface ExperienceCredit {
  id: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD';
  type: string;
  label: string;
  expiresAt: string;
  used: boolean;
  redeemedAt?: string;
}

export interface PhotoUploadResponse {
  url: string;
  publicId: string;
}
