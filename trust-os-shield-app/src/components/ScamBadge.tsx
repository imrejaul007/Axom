import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ScamBadgeProps {
  status: 'verified-safe' | 'suspicious' | 'dangerous' | 'unknown';
  label?: string;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
}

/**
 * ScamBadge - Quick status indicator for contacts/numbers
 */
export const ScamBadge: React.FC<ScamBadgeProps> = ({
  status,
  label,
  size = 'medium',
  onPress,
}) => {
  const getConfig = () => {
    switch (status) {
      case 'verified-safe':
        return {
          color: '#10B981',
          bgColor: '#ECFDF5',
          icon: 'checkmark-circle',
          defaultLabel: 'Safe',
        };
      case 'suspicious':
        return {
          color: '#F59E0B',
          bgColor: '#FEF3C7',
          icon: 'warning',
          defaultLabel: 'Suspicious',
        };
      case 'dangerous':
        return {
          color: '#EF4444',
          bgColor: '#FEE2E2',
          icon: 'alert-circle',
          defaultLabel: 'Dangerous',
        };
      case 'unknown':
      default:
        return {
          color: '#6B7280',
          bgColor: '#F3F4F6',
          icon: 'help-circle',
          defaultLabel: 'Unknown',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: 6,
          paddingVertical: 2,
          fontSize: 10,
          iconSize: 10,
        };
      case 'large':
        return {
          paddingHorizontal: 12,
          paddingVertical: 6,
          fontSize: 14,
          iconSize: 16,
        };
      default:
        return {
          paddingHorizontal: 8,
          paddingVertical: 4,
          fontSize: 12,
          iconSize: 12,
        };
    }
  };

  const config = getConfig();
  const sizeStyles = getSizeStyles();

  const content = (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.bgColor,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
        },
      ]}
    >
      <Ionicons name={config.icon as any} size={sizeStyles.iconSize} color={config.color} />
      <Text
        style={[
          styles.label,
          {
            color: config.color,
            fontSize: sizeStyles.fontSize,
          },
        ]}
      >
        {label || config.defaultLabel}
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
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    gap: 4,
  },
  label: {
    fontWeight: '600',
  },
});

export default ScamBadge;
