/**
 * UI Components - Reusable UI components
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput as RNTextInput } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';

// TextInput
export { RNTextInput as TextInput };

// Avatar Component
interface AvatarProps {
  uri?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'large' | 'xlarge' | 'small' | 'medium';
}

export function Avatar({ uri, name, size = 'md' }: AvatarProps) {
  const getInitials = (n: string) => {
    return n.split(' ').map((w) => w[0]).join('').toUpperCase().substring(0, 2);
  };

  const sizeMap: Record<string, number> = {
    sm: 32, md: 44, lg: 64,
    small: 32, medium: 44, large: 64, xlarge: 96
  };
  const fontSizeMap: Record<string, number> = {
    sm: 12, md: 16, lg: 24,
    small: 12, medium: 16, large: 24, xlarge: 32
  };

  const avatarSize = sizeMap[size] || 44;
  const fontSize = fontSizeMap[size] || 16;

  return (
    <View style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
      <Text style={[styles.avatarText, { fontSize }]}>
        {uri ? '👤' : getInitials(name || 'U')}
      </Text>
    </View>
  );
}

// Coin Display Component
interface CoinDisplayProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg' | 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

export function CoinDisplay({ amount, size = 'md', showIcon = true }: CoinDisplayProps) {
  const sizeMap: Record<string, number> = { sm: 12, md: 14, lg: 18, small: 12, medium: 14, large: 18 };

  return (
    <View style={styles.coinDisplay}>
      {showIcon && <Text style={styles.coinIcon}>🪙</Text>}
      <Text style={[styles.coinAmount, { fontSize: sizeMap[size] || 14 }]}>{amount.toLocaleString()}</Text>
    </View>
  );
}

// Button Component
interface ButtonProps {
  title?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'large' | 'small' | 'medium';
  style?;
}

export function Button({ title, onPress, variant = 'primary', disabled, loading, icon, size = 'md', style }: ButtonProps) {
  const getStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.buttonSecondary;
      case 'outline':
        return styles.buttonOutline;
      case 'ghost':
        return styles.buttonGhost;
      default:
        return styles.buttonPrimary;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, getStyle(), disabled && styles.buttonDisabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <View style={styles.buttonContent}>
          {icon && <View style={styles.buttonIcon}>{icon}</View>}
          {title && <Text style={styles.buttonText}>{title}</Text>}
        </View>
      )}
    </TouchableOpacity>
  );
}

// Card Component
interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
}

export function Card({ children, onPress }: CardProps) {
  if (onPress) {
    return (
      <TouchableOpacity style={styles.card} onPress={onPress}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={styles.card}>{children}</View>;
}

// Chip Component
interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

// Input Component
interface InputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  multiline?: boolean;
}

export function Input({ placeholder, value, onChangeText, secureTextEntry, multiline }: InputProps) {
  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
      />
    </View>
  );
}

// Loading Spinner
export function Spinner({ size = 'large' }: { size?: 'small' | 'large' }) {
  return (
    <View style={styles.spinnerContainer}>
      <ActivityIndicator size={size} color={COLORS.primary} />
    </View>
  );
}

// Empty State
interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
}

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message && <Text style={styles.emptyMessage}>{message}</Text>}
    </View>
  );
}

// Badge
interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info';
  rarity?: string;
  size?: string;
  style?;
}

export function Badge({ label, variant = 'info', rarity, size, style }: BadgeProps) {
  const getColor = () => {
    switch (variant) {
      case 'success':
        return COLORS.success;
      case 'warning':
        return COLORS.warning;
      case 'error':
        return COLORS.error;
      default:
        return COLORS.info;
    }
  };

  return (
    <View style={[styles.badge, { backgroundColor: getColor() + '20' }, style]}>
      <Text style={[styles.badgeText, { color: getColor() }]}>{label}</Text>
    </View>
  );
}

// Interest Chip (from interests.tsx)
interface InterestChipProps {
  label: string;
  icon?: string;
  selected?: boolean;
  onPress?: () => void;
  style?;
}

export function InterestChip({ label, selected, onPress, style }: InterestChipProps) {
  return (
    <TouchableOpacity
      style={[styles.interestChip, selected && styles.interestChipSelected, style]}
      onPress={onPress}
    >
      <Text style={[styles.interestChipText, selected && styles.interestChipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const { TextInput } = require('react-native');

const styles = StyleSheet.create({
  button: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
  },
  buttonSecondary: {
    backgroundColor: COLORS.surface,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  chip: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.full,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
  },
  chipTextSelected: {
    color: '#fff',
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  spinnerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyMessage: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  interestChip: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  interestChipSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  interestChipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
  },
  interestChipTextSelected: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonIcon: {
    marginRight: 4,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  avatar: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '600',
  },
  coinDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coinIcon: {
    fontSize: 14,
  },
  coinAmount: {
    color: COLORS.coinGold,
    fontWeight: '600',
  },
});
