// User types
export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  reputation: number;
  reputationLevel: ReputationLevel;
  coinBalance: number;
  interests: string[];
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: string;
  isCreator: boolean;
}

export type ReputationLevel =
  | 'Explorer'
  | 'Local Guide'
  | 'Trendsetter'
  | 'City Influencer'
  | 'Verified Creator';

// Post types
export type PostType = 'general' | 'event' | 'alert' | 'place' | 'deal' | 'poll';

export interface Media {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
}

export interface Location {
  id?: string;
  latitude: number;
  longitude: number;
  address?: string;
  area?: string;
  city?: string;
}

export interface Post {
  id: string;
  type: PostType;
  authorId: string;
  author: User;
  content: string;
  media?: Media[];
  location?: Location;
  tags: string[];
  coinReward: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  isLiked?: boolean;
  isSaved?: boolean;
  createdAt: string;
  // Event specific
  eventDate?: string;
  eventTime?: string;
  // Poll specific
  pollOptions?: PollOption[];
  // Alert specific
  alertCategory?: AlertCategory;
  alertSeverity?: 'low' | 'medium' | 'high';
  // Deal specific
  dealDiscount?: number;
  dealExpiry?: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export type AlertCategory =
  | 'traffic'
  | 'weather'
  | 'safety'
  | 'construction'
  | 'event'
  | 'utilities'
  | 'other';

// Event types
export interface Event {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  location: Location;
  startDate: string;
  endDate?: string;
  category: string;
  ticketPrice?: number;
  attendees: number;
  interested: number;
  creator: User;
  posts: Post[];
}

// Community types
export type CommunityType = 'area' | 'interest' | 'apartment' | 'campus';

export interface Community {
  id: string;
  name: string;
  type: CommunityType;
  description: string;
  coverImage?: string;
  memberCount: number;
  location?: Location;
  isJoined?: boolean;
}

// Gamification types
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  earnedAt?: string;
  progress?: number;
  maxProgress?: number;
}

export type StreakType = 'login' | 'posting' | 'exploring' | 'events';

export interface Streak {
  type: StreakType;
  current: number;
  best: number;
  lastActivity: string;
  isActive: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  user: User;
  score: number;
  change: number; // rank change from previous period
}

// Vibe Map types
export type AreaMood = 'chill' | 'busy' | 'party' | 'family';

export interface VibeArea {
  id: string;
  name: string;
  center: Location;
  radius: number;
  mood: AreaMood;
  crowdLevel: 1 | 2 | 3 | 4 | 5;
  trending: boolean;
  activeUsers: number;
}

export interface VibePin {
  id: string;
  type: 'event' | 'place' | 'offer' | 'alert' | 'user';
  location: Location;
  title: string;
  subtitle?: string;
  data: Event | Post | unknown;
}

// Wallet types
export interface Transaction {
  id: string;
  type: 'earn' | 'spend';
  amount: number;
  description: string;
  relatedId?: string;
  relatedType?: 'post' | 'reward' | 'purchase' | 'refund';
  createdAt: string;
}

// Search types
export interface SearchResult {
  type: 'post' | 'user' | 'event' | 'place' | 'community';
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  distance?: number;
  data: Post | User | Event | Community;
}

// Feed types
export interface FeedItem {
  type: 'post' | 'ai_card';
  data: Post | AICard;
  timestamp: string;
}

export interface AICard {
  id: string;
  type: 'trending' | 'alert' | 'recommendation' | 'insight';
  title: string;
  description: string;
  actionText?: string;
  actionData?;
  icon: string;
  priority: 'low' | 'medium' | 'high';
}

// Notification types
export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'system' | 'event' | 'alert';
  title: string;
  body: string;
  data?;
  isRead: boolean;
  createdAt: string;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?;
}
