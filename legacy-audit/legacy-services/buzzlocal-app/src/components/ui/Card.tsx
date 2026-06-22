import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOW } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'medium',
  style,
}) => {
  const getCardStyle = (): ViewStyle[] => {
    const styles: ViewStyle[] = [baseStyles.card];

    switch (variant) {
      case 'elevated':
        styles.push(baseStyles.cardElevated, SHADOW.md);
        break;
      case 'outlined':
        styles.push(baseStyles.cardOutlined);
        break;
      default:
        styles.push(baseStyles.cardDefault, SHADOW.sm);
    }

    switch (padding) {
      case 'none':
        break;
      case 'small':
        styles.push(baseStyles.paddingSmall);
        break;
      case 'large':
        styles.push(baseStyles.paddingLarge);
        break;
      default:
        styles.push(baseStyles.paddingMedium);
    }

    return styles;
  };

  return <View style={[...getCardStyle(), style]}>{children}</View>;
};

const baseStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
  },
  cardDefault: {
    backgroundColor: COLORS.surface,
  },
  cardElevated: {
    backgroundColor: COLORS.surfaceElevated,
  },
  cardOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paddingSmall: {
    padding: SPACING.sm,
  },
  paddingMedium: {
    padding: SPACING.md,
  },
  paddingLarge: {
    padding: SPACING.lg,
  },
});
