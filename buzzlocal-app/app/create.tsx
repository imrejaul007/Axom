import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { Button } from '@/components/ui';
import { useAuthStore, useFeedStore } from '@/store';
import { Post, PostType } from '@/types';

const POST_TYPES = [
  { id: 'general' as PostType, label: 'Post', icon: 'document-text', color: COLORS.primary },
  { id: 'event' as PostType, label: 'Event', icon: 'calendar', color: COLORS.accent },
  { id: 'alert' as PostType, label: 'Alert', icon: 'warning', color: COLORS.error },
  { id: 'place' as PostType, label: 'Place', icon: 'location', color: COLORS.success },
  { id: 'deal' as PostType, label: 'Deal', icon: 'pricetag', color: COLORS.coinGold },
  { id: 'poll' as PostType, label: 'Poll', icon: 'bar-chart', color: COLORS.info },
];

const COIN_REWARDS: Record<string, number> = {
  general: 20,
  event: 50,
  alert: 40,
  place: 30,
  deal: 25,
  poll: 15,
  review: 20,
};

const POPULAR_TAGS = ['Food', 'Nightlife', 'Events', 'Tech', 'Fitness', 'Fashion', 'Music', 'Travel'];

export default function CreatePostScreen() {
  const router = useRouter();
  const { user, updateCoinBalance } = useAuthStore();
  const { addPost } = useFeedStore();

  const [selectedType, setSelectedType] = useState<PostType>('general');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handlePost = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please write something to post');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newPost: Post = {
        id: 'post_' + Date.now(),
        type: selectedType,
        authorId: user?.id || 'anonymous',
        author: {
          id: user?.id || 'anonymous',
          username: user?.username || 'user',
          displayName: user?.displayName || 'Anonymous',
          avatar: user?.avatar || undefined,
          reputation: user?.reputation || 0,
          reputationLevel: user?.reputationLevel || 'Explorer',
          coinBalance: 0,
          interests: [],
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          createdAt: new Date().toISOString(),
          isCreator: false,
          isLiked: false,
        },
        content: content.trim(),
        location: location ? { latitude: 0, longitude: 0, area: location } : undefined,
        tags: selectedTags,
        coinReward: COIN_REWARDS[selectedType],
        likes: 0,
        comments: 0,
        saves: 0,
        shares: 0,
        isLiked: false,
        createdAt: new Date().toISOString(),
      };

      // Add to feed
      addPost(newPost);

      // Update coin balance
      updateCoinBalance(COIN_REWARDS[selectedType] ?? 0);

      Alert.alert(
        'Posted!',
        `You earned ${COIN_REWARDS[selectedType]} ReZ Coins!`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <Button
          title="Post"
          onPress={handlePost}
          loading={isLoading}
          disabled={!content.trim()}
          size="small"
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Post Type Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeSelector}
        >
          {POST_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeChip,
                selectedType === type.id && { backgroundColor: type.color + '20', borderColor: type.color },
              ]}
              onPress={() => setSelectedType(type.id)}
            >
              <Ionicons
                name={type.icon as any}
                size={18}
                color={selectedType === type.id ? type.color : COLORS.textMuted}
              />
              <Text
                style={[
                  styles.typeLabel,
                  selectedType === type.id && { color: type.color },
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Content Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder={`Share what's happening ${selectedType === 'alert' ? 'or warn others about something' : 'around you'}...`}
            placeholderTextColor={COLORS.textMuted}
            multiline
            maxLength={500}
            value={content}
            onChangeText={setContent}
          />
          <Text style={styles.charCount}>{content.length}/500</Text>
        </View>

        {/* Location */}
        <TouchableOpacity style={styles.locationInput}>
          <Ionicons name="location-outline" size={20} color={COLORS.primary} />
          <Text style={styles.locationText}>
            {location || 'Add location'}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* Tags */}
        <View style={styles.tagsSection}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagsContainer}>
            {POPULAR_TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagChip,
                  selectedTags.includes(tag) && styles.tagChipSelected,
                ]}
                onPress={() => toggleTag(tag)}
              >
                <Text
                  style={[
                    styles.tagText,
                    selectedTags.includes(tag) && styles.tagTextSelected,
                  ]}
                >
                  #{tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Add Media */}
        <TouchableOpacity style={styles.addMedia}>
          <Ionicons name="image-outline" size={24} color={COLORS.textSecondary} />
          <Text style={styles.addMediaText}>Add photos or videos</Text>
        </TouchableOpacity>

        {/* Coin Reward Preview */}
        <View style={styles.rewardPreview}>
          <View style={styles.rewardInfo}>
            <Ionicons name="gift" size={20} color={COLORS.coinGold} />
            <Text style={styles.rewardText}>
              You'll earn {COIN_REWARDS[selectedType]} ReZ Coins for posting
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  content: {
    flex: 1,
  },
  typeSelector: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: SPACING.sm,
  },
  typeLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginLeft: SPACING.xs,
    fontWeight: '500',
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    minHeight: 150,
  },
  textInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
  },
  locationText: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  tagsSection: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  tagChipSelected: {
    backgroundColor: COLORS.primary + '20',
  },
  tagText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  tagTextSelected: {
    color: COLORS.primary,
  },
  addMedia: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  addMediaText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  rewardPreview: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  rewardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.coinGold + '10',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  rewardText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.coinGold,
    fontWeight: '500',
    marginLeft: SPACING.sm,
  },
});
