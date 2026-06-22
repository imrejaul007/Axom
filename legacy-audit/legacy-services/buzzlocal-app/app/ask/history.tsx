/**
 * Ask History - View past conversations with Ask Buzz (Premium UI)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

interface Conversation {
  id: string;
  preview: string;
  messageCount: number;
  category: string;
  createdAt: Date;
}

const MOCK_HISTORY: Conversation[] = [
  {
    id: '1',
    preview: 'Best biryani places near Koramangala?',
    messageCount: 8,
    category: 'Food & Dining',
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: '2',
    preview: 'How safe is Indiranagar for night travel?',
    messageCount: 5,
    category: 'Safety',
    createdAt: new Date(Date.now() - 86400000 * 2),
  },
  {
    id: '3',
    preview: 'Affordable gyms near HSR Layout',
    messageCount: 6,
    category: 'Fitness',
    createdAt: new Date(Date.now() - 86400000 * 3),
  },
  {
    id: '4',
    preview: 'Events happening this weekend',
    messageCount: 4,
    category: 'Events',
    createdAt: new Date(Date.now() - 86400000 * 5),
  },
  {
    id: '5',
    preview: 'Best furniture shops in Bangalore',
    messageCount: 7,
    category: 'Shopping',
    createdAt: new Date(Date.now() - 86400000 * 7),
  },
  {
    id: '6',
    preview: 'Doctors open on Sunday near me',
    messageCount: 3,
    category: 'Healthcare',
    createdAt: new Date(Date.now() - 86400000 * 10),
  },
];

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; gradient: readonly [string, string] }> = {
  'Food & Dining': { icon: 'restaurant', color: '#EF4444', gradient: ['#EF4444', '#DC2626'] as const },
  'Safety': { icon: 'shield-checkmark', color: '#10B981', gradient: ['#10B981', '#059669'] as const },
  'Fitness': { icon: 'fitness', color: '#F59E0B', gradient: ['#F59E0B', '#D97706'] as const },
  'Events': { icon: 'calendar', color: '#8B5CF6', gradient: ['#8B5CF6', '#7C3AED'] as const },
  'Shopping': { icon: 'cart', color: '#3B82F6', gradient: ['#3B82F6', '#2563EB'] as const },
  'Healthcare': { icon: 'medical', color: '#EC4899', gradient: ['#EC4899', '#DB2777'] as const },
  'default': { icon: 'chatbubbles', color: '#6B7280', gradient: ['#6B7280', '#4B5563'] as const },
};

export default function AskHistoryScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_HISTORY);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Conversation', 'Are you sure you want to delete this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setConversations((prev) => prev.filter((c) => c.id !== id));
        },
      },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All History',
      'This will delete all your conversation history with Ask Buzz.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => setConversations([]),
        },
      ]
    );
  };

  const handleContinue = (conversation: Conversation) => {
    router.push(`/ask/chat/${conversation.id}`);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const config = CATEGORY_CONFIG[item.category] ?? { icon: 'chatbubbles', color: '#6B7280', gradient: ['#6B7280', '#4B5563'] as const };

    return (
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() => handleContinue(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardContent}>
          <View style={styles.conversationIcon}>
            <LinearGradient colors={config.gradient} style={styles.iconGradient}>
              <Ionicons name={config.icon as any} size={20} color="#fff" />
            </LinearGradient>
          </View>
          <View style={styles.conversationInfo}>
            <View style={styles.conversationHeader}>
              <View style={[styles.categoryBadge, { backgroundColor: config.color + '20' }]}>
                <Text style={[styles.categoryText, { color: config.color }]}>{item.category}</Text>
              </View>
              <Text style={styles.conversationDate}>{formatDate(item.createdAt)}</Text>
            </View>
            <Text style={styles.conversationPreview} numberOfLines={2}>
              {item.preview}
            </Text>
            <View style={styles.conversationFooter}>
              <View style={styles.messageCount}>
                <Ionicons name="chatbubbles" size={12} color={COLORS.textMuted} />
                <Text style={styles.messageCountText}>{item.messageCount} messages</Text>
              </View>
              <View style={styles.continueHint}>
                <Text style={styles.continueHintText}>Continue</Text>
                <Ionicons name="arrow-forward" size={12} color={COLORS.primary} />
              </View>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
        >
          <View style={styles.deleteButtonInner}>
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Ask History</Text>
          <Text style={styles.headerSubtitle}>{conversations.length} conversations</Text>
        </View>
        {conversations.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
            <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.clearButtonGradient}>
              <Ionicons name="trash" size={16} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* History List */}
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.emptyIcon}>
                <Ionicons name="chatbubbles-outline" size={48} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.emptyTitle}>No History Yet</Text>
            <Text style={styles.emptyText}>
              Your conversations with Ask Buzz will appear here.
            </Text>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => router.push('/ask/chat/new')}
            >
              <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.startButtonGradient}>
                <Ionicons name="chatbubbles" size={20} color="#fff" />
                <Text style={styles.startButtonText}>Start a Conversation</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        }
      />

      {/* New Chat Button */}
      {conversations.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.newChatButton}
            onPress={() => router.push('/ask/chat/new')}
          >
            <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.newChatButtonGradient}>
              <Ionicons name="add" size={24} color="#fff" />
              <Text style={styles.newChatButtonText}>New Conversation</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  clearButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  clearButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  conversationCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: SPACING.md,
  },
  conversationIcon: {
    marginRight: SPACING.md,
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  categoryBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  categoryText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  conversationDate: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  conversationPreview: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  messageCountText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  continueHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  continueHintText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: '600',
  },
  deleteButton: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  deleteButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyIconContainer: {
    marginBottom: SPACING.lg,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  startButton: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  startButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: '#fff',
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  newChatButton: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  newChatButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  newChatButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: '#fff',
  },
});
