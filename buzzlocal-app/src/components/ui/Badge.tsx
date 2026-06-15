import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';
import { BadgeRarity } from '@/types';

interface BadgeProps {
  label: string;
  rarity?: BadgeRarity;
  size?: 'small' | 'medium';
  icon?: string;
  style?: ViewStyle;
  onPress?: () => void;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  rarity = 'common',
  size = 'medium',
  icon,
  style,
  onPress,
}) => {
  const getColors = () => {
    switch (rarity) {
      case 'legendary':
        return { bg: '#FFD70020', text: '#FFD700', border: '#FFD700' };
      case 'epic':
        return { bg: '#9333EA20', text: '#9333EA', border: '#9333EA' };
      case 'rare':
        return { bg: '#3B82F620', text: '#3B82F6', border: '#3B82F6' };
      default:
        return { bg: COLORS.surfaceLight, text: COLORS.textSecondary, border: COLORS.border };
    }
  };

  const colors = getColors();

  const content = (
    <View
      style={[
        styles.badge,
        size === 'small' && styles.badgeSmall,
        { backgroundColor: colors.bg, borderColor: colors.border },
        style,
      ]}
    >
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text
        style={[
          styles.label,
          size === 'small' && styles.labelSmall,
          { color: colors.text },
        ]}
      >
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  badgeSmall: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
  },
  icon: {
    fontSize: FONT_SIZE.sm,
    marginRight: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  labelSmall: {
    fontSize: 9,
  },
});
