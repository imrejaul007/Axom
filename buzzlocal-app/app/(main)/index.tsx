import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { Avatar, CoinDisplay } from '@/components/ui';
import { PostCard, AICard } from '@/components/feed';
import { useAuthStore, useFeedStore } from '@/store';
import { Post, AICard as AICardType } from '@/types';

interface FeedListItem {
  type: 'post' | 'ai_card';
  data: Post | AICardType;
  timestamp: string;
}

const MOCK_POSTS: Post[] = [
  {
    id: '1',
    type: 'general',
    authorId: 'u1',
    author: {
      id: 'u1',
      username: 'foodie_sarah',
      displayName: 'Sarah Chen',
      avatar: 'https://i.pravatar.cc/150?img=1',
      reputation: 1250,
      reputationLevel: 'Local Guide',
      coinBalance: 0,
      interests: ['food', 'nightlife'],
      followersCount: 234,
      followingCount: 89,
      postsCount: 45,
      createdAt: '2026-05-10T10:00:00Z',
      isCreator: true,
    },
    content: 'Just discovered this hidden gem in Koramangala! The brunch here is absolutely fire 🔥 Best eggs benedict in Bangalore hands down.',
    media: [{ id: 'm1', type: 'image', url: 'https://picsum.photos/400/300?random=1' }],
    location: { latitude: 12.9352, longitude: 77.6245, area: 'Koramangala' },
    tags: ['Food', 'Brunch', 'Bangalore', 'HiddenGems'],
    coinReward: 25,
    likes: 234,
    comments: 45,
    saves: 89,
    shares: 12,
    isLiked: false,
    isSaved: false,
    createdAt: '2026-05-12T08:30:00Z',
  },
  {
    id: '2',
    type: 'event',
    authorId: 'u2',
    author: {
      id: 'u2',
      username: 'techmeetup_bglr',
      displayName: 'Bangalore Tech Meetup',
      reputation: 3400,
      reputationLevel: 'City Influencer',
      coinBalance: 0,
      interests: ['tech', 'startups'],
      followersCount: 1500,
      followingCount: 200,
      postsCount: 89,
      createdAt: '2026-04-01T00:00:00Z',
      isCreator: true,
    },
    content: '🚀 Weekly Tech Networking Night! Join us for great conversations, lightning talks, and networking with fellow tech enthusiasts. Free pizza & drinks!',
    media: [{ id: 'm2', type: 'image', url: 'https://picsum.photos/400/300?random=2' }],
    location: { latitude: 12.9716, longitude: 77.5946, area: 'MG Road' },
    tags: ['Tech', 'Networking', 'Startup', 'Event'],
    coinReward: 50,
    likes: 456,
    comments: 78,
    saves: 234,
    shares: 89,
    isLiked: true,
    isSaved: false,
    createdAt: '2026-05-12T07:00:00Z',
    eventDate: '2026-05-15',
    eventTime: '18:00',
  },
  {
    id: '3',
    type: 'alert',
    authorId: 'u3',
    author: {
      id: 'u3',
      username: 'local_alerts',
      displayName: 'Local Alerts Bot',
      reputation: 5000,
      reputationLevel: 'Verified Creator',
      coinBalance: 0,
      interests: ['events'],
      followersCount: 5000,
      followingCount: 0,
      postsCount: 1234,
      createdAt: '2026-01-01T00:00:00Z',
      isCreator: true,
    },
    content: '⚠️ TRAFFIC ALERT: Heavy traffic on Outer Ring Road due to road maintenance. Expected delay: 30-45 mins. Alternative routes via Sarjapur Road recommended.',
    location: { latitude: 12.9326, longitude: 77.6847, area: 'ORR' },
    tags: ['Traffic', 'Alert', 'Commute'],
    coinReward: 0,
    likes: 89,
    comments: 23,
    saves: 456,
    shares: 234,
    isLiked: false,
    isSaved: true,
    createdAt: '2026-05-12T09:15:00Z',
    alertCategory: 'traffic',
    alertSeverity: 'high',
  },
];

const MOCK_AI_CARDS: AICardType[] = [
  {
    id: 'ai1',
    type: 'trending',
    title: 'Koramangala is trending tonight',
    description: 'High activity detected. 47 people checked in recently. Best time to go: now!',
    actionText: 'See what\'s happening',
    icon: '🔥',
    priority: 'medium',
  },
  {
    id: 'ai2',
    type: 'alert',
    title: 'Rain expected in 30 mins',
    description: 'Weather alert: Light rain expected near Indiranagar. Indoor spots recommended.',
    actionText: 'Find indoor spots',
    icon: '🌧️',
    priority: 'high',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, coinBalance } = useAuthStore();
  const { feed, setFeed, isRefreshing, setRefreshing } = useFeedStore();
  const [feedItems, setFeedItems] = useState<FeedListItem[]>([]);

  useEffect(() => {
    // Load mock data
    const items: FeedListItem[] = [
      ...MOCK_AI_CARDS.map((card) => ({ type: 'ai_card' as const, data: card, timestamp: new Date().toISOString() })),
      ...MOCK_POSTS.map((post) => ({ type: 'post' as const, data: post, timestamp: post.createdAt })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setFeedItems(items);
    setFeed(items as any);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const handleLike = (postId: string) => {
    setFeedItems((prev) =>
      prev.map((item) => {
        if (item.type === 'post') {
          const post = item.data as Post;
          if (post.id === postId) {
            return {
              ...item,
              data: {
                ...post,
                isLiked: !post.isLiked,
                likes: post.isLiked ? post.likes - 1 : post.likes + 1,
              },
            };
          }
        }
        return item;
      })
    );
  };

  const handleSave = (postId: string) => {
    setFeedItems((prev) =>
      prev.map((item) => {
        if (item.type === 'post') {
          const post = item.data as Post;
          if (post.id === postId) {
            return {
              ...item,
              data: {
                ...post,
                isSaved: !post.isSaved,
                saves: post.isSaved ? (post.saves || 1) - 1 : (post.saves || 0) + 1,
              },
            };
          }
        }
        return item;
      })
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.displayName || 'Explorer'}! 👋</Text>
          <Text style={styles.subtitle}>What's happening near you</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/search')}>
          <View style={styles.coinContainer}>
            <CoinDisplay amount={coinBalance || 0} size="medium" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Feed */}
      <ScrollView
        style={styles.feed}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {feedItems.map((item, index) => (
          <View key={`${item.type}-${index}`}>
            {item.type === 'ai_card' ? (
              <AICard
                {...(item.data as AICardType)}
                onPress={() => console.log('AI Card pressed')}
              />
            ) : (
              <PostCard
                post={item.data as Post}
                onLike={() => handleLike((item.data as Post).id)}
                onSave={() => handleSave((item.data as Post).id)}
                onComment={() => router.push(`/post/${(item.data as Post).id}`)}
              />
            )}
          </View>
        ))}
        <View style={styles.feedEnd} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  greeting: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  coinContainer: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  feed: {
    flex: 1,
  },
  feedEnd: {
    height: 100,
  },
});
