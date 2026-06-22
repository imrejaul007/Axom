import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { Post } from '@/types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PostCardProps {
  post: Post;
  onPress?: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  onUserPress?: () => void;
  onLocationPress?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onPress,
  onLike,
  onComment,
  onSave,
  onShare,
  onUserPress,
  onLocationPress,
}) => {
  const getPostTypeIcon = () => {
    switch (post.type) {
      case 'event':
        return '🎉';
      case 'alert':
        return '⚠️';
      case 'place':
        return '📍';
      case 'deal':
        return '🏷️';
      case 'poll':
        return '📊';
      default:
        return '📝';
    }
  };

  const getPostTypeColor = () => {
    switch (post.type) {
      case 'event':
        return COLORS.accent;
      case 'alert':
        return COLORS.error;
      case 'deal':
        return COLORS.coinGold;
      default:
        return COLORS.primary;
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.userInfo} onPress={onUserPress}>
          <Avatar
            uri={post.author.avatar}
            name={post.author.displayName}
            size="medium"
          />
          <View style={styles.userDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{post.author.displayName}</Text>
              {post.author.reputationLevel !== 'Explorer' && (
                <Badge
                  label={post.author.reputationLevel}
                  size="small"
                  rarity={
                    post.author.reputationLevel === 'Verified Creator'
                      ? 'legendary'
                      : 'common'
                  }
                  style={styles.reputationBadge}
                />
              )}
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.timestamp}>{formatTimeAgo(post.createdAt)}</Text>
              {post.location?.area && (
                <>
                  <Text style={styles.dot}>•</Text>
                  <TouchableOpacity onPress={onLocationPress}>
                    <Text style={styles.location}>{post.location.area}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>
        <View style={[styles.typeIndicator, { backgroundColor: getPostTypeColor() }]}>
          <Text style={styles.typeIcon}>{getPostTypeIcon()}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.text} numberOfLines={3}>
          {post.content}
        </Text>

        {/* Media */}
        {post.media && post.media.length > 0 && (
          <View style={styles.mediaContainer}>
            {post.media[0].type === 'image' && (
              <Image
                source={{ uri: post.media[0].url }}
                style={styles.mediaImage}
                resizeMode="cover"
              />
            )}
            {post.media.length > 1 && (
              <View style={styles.mediaCount}>
                <Text style={styles.mediaCountText}>+{post.media.length - 1}</Text>
              </View>
            )}
          </View>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {post.tags.slice(0, 3).map((tag, index) => (
              <Text key={index} style={styles.tag}>
                #{tag}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.actionLeft}>
          <TouchableOpacity style={styles.actionButton} onPress={onLike}>
            <Ionicons
              name={post.isLiked ? 'heart' : 'heart-outline'}
              size={22}
              color={post.isLiked ? COLORS.error : COLORS.textSecondary}
            />
            <Text style={styles.actionCount}>{post.likes}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={onComment}>
            <Ionicons
              name="chatbubble-outline"
              size={20}
              color={COLORS.textSecondary}
            />
            <Text style={styles.actionCount}>{post.comments}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={onShare}>
            <Ionicons
              name="share-outline"
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={onSave}>
            <Ionicons
              name={post.isSaved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={post.isSaved ? COLORS.coinGold : COLORS.textSecondary}
            />
            <Text style={styles.actionCount}>{post.saves}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.coinReward}>
          <Ionicons name="logo-usd" size={14} color={COLORS.coinGold} />
          <Text style={styles.coinAmount}>+{post.coinReward}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    marginLeft: SPACING.sm,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  reputationBadge: {
    marginLeft: SPACING.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timestamp: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },
  dot: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginHorizontal: SPACING.xs,
  },
  location: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
  },
  typeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIcon: {
    fontSize: 16,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  text: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    lineHeight: 22,
  },
  mediaContainer: {
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.sm,
  },
  mediaCount: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.overlay,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  mediaCountText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
  },
  tag: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    marginRight: SPACING.sm,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  actionCount: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  coinReward: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD70020',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  coinAmount: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.coinGold,
    fontWeight: '600',
    marginLeft: 2,
  },
});
