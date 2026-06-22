import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { AICard as AICardType } from '@/types';

interface AICardProps {
  card: AICardType;
  onPress?: () => void;
  onDismiss?: () => void;
}

export const AICard: React.FC<AICardProps> = ({ card, onPress, onDismiss }) => {
  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    switch (card.type) {
      case 'trending':
        return 'trending-up';
      case 'alert':
        return 'warning';
      case 'recommendation':
        return 'bulb';
      case 'insight':
        return 'analytics';
      default:
        return 'information-circle';
    }
  };

  const getGradientColors = (): [string, string] => {
    switch (card.priority) {
      case 'high':
        return ['#EF444420', '#EF444410'];
      case 'medium':
        return ['#F59E0B20', '#F59E0B10'];
      default:
        return ['#3B82F620', '#3B82F610'];
    }
  };

  const getBorderColor = () => {
    switch (card.priority) {
      case 'high':
        return COLORS.error;
      case 'medium':
        return COLORS.warning;
      default:
        return COLORS.info;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, { borderColor: getBorderColor() }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={getIconName()}
              size={20}
              color={getBorderColor()}
            />
          </View>
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={10} color={COLORS.primary} />
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
          {onDismiss && (
            <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
              <Ionicons name="close" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.title}>{card.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {card.description}
        </Text>

        {card.actionText && (
          <View style={styles.action}>
            <Text style={[styles.actionText, { color: getBorderColor() }]}>
              {card.actionText}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={14}
              color={getBorderColor()}
            />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  gradient: {
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    marginLeft: SPACING.sm,
  },
  aiBadgeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 2,
  },
  dismissButton: {
    marginLeft: 'auto',
    padding: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  actionText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
});
