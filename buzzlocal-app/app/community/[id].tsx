import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/store';

const MOCK_COMMUNITY = {
  id: '1',
  name: 'Koramangala Locals',
  type: 'area' as const,
  description: 'Your go-to community for everything Koramangala! Share local discoveries, get recommendations, find meetup buddies, and stay updated on what\'s happening in the neighborhood.',
  memberCount: 1234,
  creatorId: 'user1',
  admins: ['user1', 'user2'],
  coverImage: null,
  icon: 'location',
  isJoined: true,
  posts: [
    { id: '1', author: 'Sarah', content: 'Just found an amazing new brunch place near 5th Block! Their eggs benedict is incredible 🤤', time: '2h ago', likes: 45, comments: 12 },
    { id: '2', author: 'Mike', content: 'Anyone know if the construction on 100ft road is still going on?', time: '4h ago', likes: 23, comments: 8 },
    { id: '3', author: 'Priya', content: 'Great networking event happening at Workbench this Friday!', time: '6h ago', likes: 67, comments: 15 },
  ],
};

export default function CommunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [community, setCommunity] = useState(MOCK_COMMUNITY);
  const [isJoined, setIsJoined] = useState(MOCK_COMMUNITY.isJoined);

  const handleJoinLeave = () => {
    setIsJoined(!isJoined);
    setCommunity({
      ...community,
      memberCount: isJoined ? community.memberCount - 1 : community.memberCount + 1,
      isJoined: !isJoined,
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'area': return 'location';
      case 'interest': return 'heart';
      case 'apartment': return 'home';
      case 'campus': return 'school';
      default: return 'people';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'area': return COLORS.primary;
      case 'interest': return COLORS.accent;
      case 'apartment': return COLORS.success;
      case 'campus': return COLORS.info;
      default: return COLORS.primary;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{community.name}</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover */}
        <View style={styles.coverContainer}>
          <View style={styles.coverPlaceholder}>
            <View style={[styles.typeIconLarge, { backgroundColor: getTypeColor(community.type) + '20' }]}>
              <Ionicons name={getTypeIcon(community.type) as any} size={40} color={getTypeColor(community.type)} />
            </View>
          </View>
        </View>

        {/* Community Info */}
        <View style={styles.content}>
          <Text style={styles.communityName}>{community.name}</Text>
          <View style={styles.typeRow}>
            <View style={[styles.typeBadge, { backgroundColor: getTypeColor(community.type) + '20' }]}>
              <Ionicons name={getTypeIcon(community.type) as any} size={14} color={getTypeColor(community.type)} />
              <Text style={[styles.typeText, { color: getTypeColor(community.type) }]}>{community.type}</Text>
            </View>
            <Text style={styles.memberCount}>{community.memberCount.toLocaleString()} members</Text>
          </View>
          <Text style={styles.description}>{community.description}</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{community.memberCount}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{community.posts.length}</Text>
              <Text style={styles.statLabel}>Posts Today</Text>
            </View>
          </View>

          {/* Join Button */}
          <Button
            title={isJoined ? 'Joined' : 'Join Community'}
            variant={isJoined ? 'secondary' : 'primary'}
            onPress={handleJoinLeave}
            icon={isJoined ? <Ionicons name="checkmark" size={20} color={COLORS.primary} /> : <Ionicons name="add" size={20} color={COLORS.text} />}
            style={styles.joinButton}
          />

          {/* Posts */}
          <View style={styles.postsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Posts</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            {community.posts.map((post) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.postAvatar}>
                    <Text style={styles.postAvatarText}>{post.author[0]}</Text>
                  </View>
                  <View style={styles.postInfo}>
                    <Text style={styles.postAuthor}>{post.author}</Text>
                    <Text style={styles.postTime}>{post.time}</Text>
                  </View>
                </View>
                <Text style={styles.postContent}>{post.content}</Text>
                <View style={styles.postActions}>
                  <TouchableOpacity style={styles.postAction}>
                    <Ionicons name="heart-outline" size={18} color={COLORS.textMuted} />
                    <Text style={styles.postActionText}>{post.likes}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.postAction}>
                    <Ionicons name="chatbubble-outline" size={18} color={COLORS.textMuted} />
                    <Text style={styles.postActionText}>{post.comments}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.bottomPadding} />
        </View>
      </ScrollView>

      {/* Create Post FAB */}
      {isJoined && (
        <TouchableOpacity style={styles.fab} onPress={() => router.push('/create')}>
          <Ionicons name="create" size={24} color={COLORS.text} />
        </TouchableOpacity>
      )}
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginHorizontal: SPACING.sm,
  },
  menuButton: {
    padding: SPACING.xs,
  },
  coverContainer: {
    height: 180,
  },
  coverPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: SPACING.md,
  },
  communityName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.md,
  },
  typeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  memberCount: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },
  description: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  joinButton: {
    marginBottom: SPACING.lg,
  },
  postsSection: {
    marginTop: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  seeAll: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  postCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAvatarText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  postInfo: {
    marginLeft: SPACING.sm,
  },
  postAuthor: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  postTime: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  postContent: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  postActions: {
    flexDirection: 'row',
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  postActionText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  bottomPadding: {
    height: 100,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.lg,
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
