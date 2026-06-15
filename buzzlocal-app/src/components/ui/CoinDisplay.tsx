import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';

interface CoinDisplayProps {
  amount: number;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  style?: ViewStyle;
}

export const CoinDisplay: React.FC<CoinDisplayProps> = ({
  amount,
  size = 'medium',
  showIcon = true,
  style,
}) => {
  const formatAmount = (value: number): string => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return FONT_SIZE.sm;
      case 'large':
        return FONT_SIZE.xxxl;
      default:
        return FONT_SIZE.xl;
    }
  };

  return (
    <View style={[styles.container, style]}>
      {showIcon && (
        <Ionicons
          name="logo-usd"
          size={getFontSize()}
          color={COLORS.coinGold}
          style={styles.icon}
        />
      )}
      <Text style={[styles.amount, { fontSize: getFontSize() }]}>
        {formatAmount(amount)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: SPACING.xs,
  },
  amount: {
    color: COLORS.coinGold,
    fontWeight: '700',
  },
});
