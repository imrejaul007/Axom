/**
 * Feed Components - PostCard and AICard components
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { Avatar } from '@/components/ui';
import { Post, PostAuthor } from '@/types';

export interface PostCardProps {
  post: Post;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  onPress?: () => void;
}

export function PostCard({ post, onLike, onComment, onShare, onSave, onPress }: PostCardProps) {
  const author = post.author;

  return (
    <TouchableOpacity style={styles.postCard} onPress={onPress} activeOpacity={0.9}>
      {/* Author Header */}
      <View style={styles.postHeader}>
        <Avatar uri={author.avatar} name={author.displayName} size="md" />
        <View style={styles.authorInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.authorName}>{author.displayName}</Text>
            {author.isCreator && (
              <View style={styles.creatorBadge}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />
              </View>
            )}
          </View>
          <Text style={styles.authorMeta}>
            {author.reputationLevel} • {post.location?.area || 'Bangalore'}
          </Text>
        </View>
        {post.coinReward && (
          <View style={styles.coinReward}>
            <Text style={styles.coinText}>+{post.coinReward}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <Text style={styles.postContent}>{post.content}</Text>

      {/* Media */}
      {post.media && post.media.length > 0 && (
        <View style={styles.mediaContainer}>
          <Image source={{ uri: post.media[0].url }} style={styles.mediaImage} />
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
            <Text key={index} style={styles.tag}>#{tag}</Text>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionButton} onPress={onLike}>
          <Ionicons name={post.isLiked ? 'heart' : 'heart-outline'} size={22} color={post.isLiked ? COLORS.error : COLORS.textMuted} />
          <Text style={styles.actionCount}>{post.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onComment}>
          <Ionicons name="chatbubble-outline" size={20} color={COLORS.textMuted} />
          <Text style={styles.actionCount}>{post.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onShare}>
          <Ionicons name="share-outline" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onSave}>
          <Ionicons name={post.isSaved ? 'bookmark' : 'bookmark-outline'} size={20} color={post.isSaved ? COLORS.warning : COLORS.textMuted} />
          <Text style={styles.actionCount}>{post.saves || 0}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export interface AICardProps {
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
  onPress?: () => void;
}

export function AICard({ type, title, description, action, actionText, icon, color = COLORS.primary, onPress }: AICardProps) {
  const gradientMap: Record<string, readonly [string, string]> = {
    recommendation: [COLORS.primary, '#8B5CF6'] as const,
    insight: [COLORS.success, '#059669'] as const,
    alert: [COLORS.warning, '#D97706'] as const,
    trending: [COLORS.error, '#DC2626'] as const,
  };

  const iconMap: Record<string, string> = {
    recommendation: 'bulb',
    insight: 'information-circle',
    alert: 'warning',
    trending: 'trending-up',
  };

  const gradient = gradientMap[type] || gradientMap.recommendation;
  const iconName = icon || iconMap[type] || 'chatbubbles';

  return (
    <TouchableOpacity style={styles.aiCard} onPress={onPress} activeOpacity={0.9}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.aiCardGradient}>
        <View style={styles.aiCardContent}>
          <View style={styles.aiCardIcon}>
            <Ionicons name={iconName as any} size={24} color="#fff" />
          </View>
          <View style={styles.aiCardText}>
            <Text style={styles.aiCardTitle}>{title}</Text>
            <Text style={styles.aiCardDescription}>{description}</Text>
          </View>
        </View>
        {(action || actionText) && (
          <View style={styles.aiCardAction}>
            <Text style={styles.aiCardActionText}>{action?.label || actionText}</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  authorInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  creatorBadge: {
    marginLeft: 4,
  },
  authorMeta: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  coinReward: {
    backgroundColor: COLORS.coinGold + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  coinText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.coinGold,
  },
  postContent: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  mediaContainer: {
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.md,
  },
  mediaCount: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  mediaCountText: {
    color: '#fff',
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.sm,
  },
  tag: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    marginRight: SPACING.sm,
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
    marginTop: SPACING.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  actionCount: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  aiCard: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  aiCardGradient: {
    padding: SPACING.md,
  },
  aiCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  aiCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  aiCardText: {
    flex: 1,
  },
  aiCardTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  aiCardDescription: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  aiCardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  aiCardActionText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: '#fff',
    marginRight: 4,
  },
});

export default { PostCard, AICard };
