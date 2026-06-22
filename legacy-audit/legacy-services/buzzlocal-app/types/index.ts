/**
 * BuzzLocal Shared Types
 */

// User Types
export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  trustScore: number;
  verified: boolean;
  area: string;
  createdAt: Date;
  coinBalance?: number;
  reputation?: number;
  reputationLevel?: string;
}

// Safety Types
export interface SOSAlert {
  id: string;
  userId: string;
  type: 'panic' | 'medical' | 'safety' | 'fake_call';
  status: 'active' | 'resolved' | 'cancelled';
  location: { lat: number; lng: number };
  timestamp: Date;
}

export interface TrustedContact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  notified: boolean;
}

export interface SafeZone {
  id: string;
  name: string;
  type: 'police' | 'hospital' | 'fire' | 'shelter' | 'women_shelter';
  location: { lat: number; lng: number };
  address: string;
  distance?: number;
  phone?: string;
  isOpen: boolean;
}

export interface SafetyAlert {
  id: string;
  type: 'safety' | 'weather' | 'crime' | 'traffic' | 'emergency';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  timestamp: Date;
  verified: boolean;
  source: string;
}

// Crisis Types
export interface CrisisZone {
  id: string;
  type: 'flood' | 'fire' | 'earthquake' | 'medical' | 'accident' | 'evacuation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: { lat: number; lng: number };
  resources: string[];
  shelters: Shelter[];
}

export interface Shelter {
  id: string;
  name: string;
  capacity: number;
  current: number;
  location: { lat: number; lng: number };
}

export interface CrisisResource {
  id: string;
  name: string;
  type: 'medical' | 'food' | 'shelter' | 'transport' | 'rescue' | 'communication';
  available: number;
  location: string;
}

export interface Volunteer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  skills: string[];
  availability: string;
  hasVehicle: boolean;
  hasBoat: boolean;
  status: 'active' | 'inactive';
}

// Place Types
export interface Place {
  id: string;
  name: string;
  type: string;
  category: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  address: string;
  distance: string;
  location: { lat: number; lng: number };
  hours: string;
  phone?: string;
  features: string[];
  vibes: string[];
  trending: boolean;
  safeArea: boolean;
  images: string[];
}

// Service Types
export interface ServiceProvider {
  id: string;
  name: string;
  phone: string;
  category: string;
  subcategory?: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  available: boolean;
  services: Service[];
  workingHours: { start: string; end: string };
  area: string;
  coinsAccepted: boolean;
}

export interface Service {
  name: string;
  price: number;
  unit: string;
  description?: string;
}

export interface Booking {
  id: string;
  providerId: string;
  providerName: string;
  service: { name: string; price: number };
  scheduledAt: Date;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  address: string;
  notes?: string;
}

// Marketplace Types
export interface Listing {
  id: string;
  title: string;
  description: string;
  price: string;
  category: string;
  condition: 'new' | 'like_new' | 'good' | 'fair';
  images: string[];
  sellerId: string;
  sellerName: string;
  sellerRating: number;
  views: number;
  messages: number;
  status: 'active' | 'sold' | 'pending';
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  image?: string;
  timestamp: Date;
  read: boolean;
}

// Ask Buzz Types
export interface AskConversation {
  id: string;
  messages: AskMessage[];
  category: string;
  createdAt: Date;
}

export interface AskMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { title: string; type: string; url?: string }[];
  timestamp: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Location Types
export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface Area {
  id: string;
  name: string;
  city: string;
  density: number;
  safetyScore: number;
}

// Community Types
export interface Community {
  id: string;
  name: string;
  type: CommunityType;
  description: string;
  coverImage?: string;
  memberCount: number;
  isPrivate: boolean;
  rules?: string[];
  adminIds: string[];
  createdAt: Date;
}

export type CommunityType = 'apartment' | 'society' | 'neighborhood' | 'interest' | 'marketplace' | 'events';

// Feed Types
export interface PostAuthor {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  reputation: number;
  reputationLevel: string;
  coinBalance?: number;
  interests?: string[];
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  createdAt?: string;
  isCreator?: boolean;
  isLiked?: boolean;
}

export interface PostMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
}

export interface PostLocation {
  latitude: number;
  longitude: number;
  area: string;
}

export interface Post {
  id: string;
  authorId: string;
  author: PostAuthor;
  content: string;
  type: PostType;
  media?: PostMedia[];
  location?: PostLocation;
  tags?: string[];
  coinReward?: number;
  likes: number;
  comments: number;
  saves?: number;
  shares: number;
  isLiked: boolean;
  isSaved?: boolean;
  createdAt: string;
  eventDate?: string;
  eventTime?: string;
  alertCategory?: string;
  alertSeverity?: string;
}

export type PostType = 'general' | 'alert' | 'event' | 'recommendation' | 'question' | 'review' | 'lost_found' | 'service' | 'place' | 'deal' | 'poll';

// Event Types
export interface Event {
  id: string;
  title: string;
  description: string;
  type: string;
  location: string;
  locationDetails?: string;
  startDate: Date;
  endDate?: Date;
  organizerId: string;
  organizerName: string;
  attendeeCount: number;
  maxAttendees?: number;
  isRsvped: boolean;
  price?: number;
  image?: string;
  tags?: string[];
}

// Offer Types
export interface Offer {
  id: string;
  merchantId: string;
  merchantName: string;
  title: string;
  description?: string;
  type: OfferType;
  value: number;
  unit: 'percent' | 'flat';
  minOrder?: number;
  maxDiscount?: number;
  validFrom: Date;
  validUntil: Date;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  code?: string;
}

export type OfferType = 'discount' | 'bogo' | 'cashback' | 'freebie';

// Persona Types
export interface Persona {
  id: string;
  userId: string;
  type: 'student' | 'professional' | 'homemaker' | 'senior' | 'explorer' | 'foodie' | 'shopper';
  traits: string[];
  interests: string[];
  neighborhoods: string[];
  spendingHabits: SpendingHabit[];
  activeHours: { start: number; end: number };
  trustScore: number;
  lastUpdated: Date;
}

export interface SpendingHabit {
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'rarely';
  avgAmount: number;
}

// Feed Types
export interface FeedItem {
  id: string;
  type: 'post' | 'ai_card' | 'alert' | 'event' | 'offer' | 'recommendation';
  authorId?: string;
  authorName?: string;
  authorAvatar?: string;
  content: string;
  images?: string[];
  location?: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  createdAt: Date;
  timestamp?: string | Date;
  data?: Post | AICard;
}

export interface PostFeedItem extends FeedItem {
  type: 'post';
  data: Post;
}

export interface AICardFeedItem extends FeedItem {
  type: 'ai_card';
  data: AICard;
}

export interface AICard {
  id: string;
  type: 'recommendation' | 'insight' | 'alert' | 'trending';
  title: string;
  description: string;
  action?: {
    label: string;
    route: string;
  };
  actionText?: string;
  icon?: string;
  color?: string;
  data?: Record<string, unknown>;
  priority?: 'high' | 'medium' | 'low';
}

// UI Component Props
export interface AvatarProps {
  uri?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'large' | 'xlarge' | 'small' | 'medium';
}

export interface Transaction {
  id: string;
  type: 'earn' | 'spend' | 'bonus' | 'refund';
  amount: number;
  description: string;
  createdAt: string;
}

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface CoinDisplayProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export type NotificationType = 'engagement' | 'system' | 'event' | 'offer' | 'safety' | 'social';
