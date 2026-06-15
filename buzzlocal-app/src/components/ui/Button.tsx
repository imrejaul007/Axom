import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}) => {
  const getButtonStyle = (): ViewStyle[] => {
    const styles: ViewStyle[] = [baseStyles.button];

    // Size
    switch (size) {
      case 'small':
        styles.push(baseStyles.buttonSmall);
        break;
      case 'large':
        styles.push(baseStyles.buttonLarge);
        break;
      default:
        styles.push(baseStyles.buttonMedium);
    }

    // Variant
    switch (variant) {
      case 'secondary':
        styles.push(baseStyles.buttonSecondary);
        break;
      case 'ghost':
        styles.push(baseStyles.buttonGhost);
        break;
      default:
        styles.push(baseStyles.buttonPrimary);
    }

    if (disabled) {
      styles.push(baseStyles.buttonDisabled);
    }

    return styles;
  };

  const getTextStyle = (): TextStyle[] => {
    const styles: TextStyle[] = [baseStyles.buttonText];

    switch (size) {
      case 'small':
        styles.push(baseStyles.textSmall);
        break;
      case 'large':
        styles.push(baseStyles.textLarge);
        break;
      default:
        styles.push(baseStyles.textMedium);
    }

    switch (variant) {
      case 'secondary':
        styles.push(baseStyles.textSecondary);
        break;
      case 'ghost':
        styles.push(baseStyles.textGhost);
        break;
      default:
        styles.push(baseStyles.textPrimary);
    }

    if (disabled) {
      styles.push(baseStyles.textDisabled);
    }

    return styles;
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? COLORS.text : COLORS.primary}
          size="small"
        />
      ) : (
        <View style={baseStyles.content}>
          {icon && iconPosition === 'left' && (
            <View style={baseStyles.iconLeft}>{icon}</View>
          )}
          <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <View style={baseStyles.iconRight}>{icon}</View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const baseStyles = StyleSheet.create({
  button: {
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonSmall: {
    height: 36,
    paddingHorizontal: SPACING.md,
  },
  buttonMedium: {
    height: 48,
    paddingHorizontal: SPACING.lg,
  },
  buttonLarge: {
    height: 56,
    paddingHorizontal: SPACING.xl,
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '600',
  },
  textSmall: {
    fontSize: FONT_SIZE.sm,
  },
  textMedium: {
    fontSize: FONT_SIZE.lg,
  },
  textLarge: {
    fontSize: FONT_SIZE.xl,
  },
  textPrimary: {
    color: COLORS.text,
  },
  textSecondary: {
    color: COLORS.primary,
  },
  textGhost: {
    color: COLORS.textSecondary,
  },
  textDisabled: {
    color: COLORS.textMuted,
  },
  iconLeft: {
    marginRight: SPACING.sm,
  },
  iconRight: {
    marginLeft: SPACING.sm,
  },
});
