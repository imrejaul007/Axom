import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, FONT_SIZE } from '@/constants/theme';

interface AvatarProps {
  uri?: string;
  name: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: ViewStyle | ImageStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 'medium',
  style,
}) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return 32;
      case 'large':
        return 56;
      case 'xlarge':
        return 80;
      default:
        return 44;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return FONT_SIZE.xs;
      case 'large':
        return FONT_SIZE.xxl;
      case 'xlarge':
        return FONT_SIZE.xxxl;
      default:
        return FONT_SIZE.md;
    }
  };

  const sizeValue = getSize();
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colors = [
    COLORS.primary,
    COLORS.accent,
    COLORS.success,
    COLORS.info,
    '#9333EA',
    '#EC4899',
  ];
  const backgroundColor = colors[name.length % colors.length];

  if (uri) {
    const imageStyle = {
      width: sizeValue,
      height: sizeValue,
      borderRadius: sizeValue / 2,
    };
    return (
      <Image
        source={{ uri }}
        style={[styles.avatar, imageStyle, style as unknown]}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatar,
        styles.placeholder,
        {
          width: sizeValue,
          height: sizeValue,
          borderRadius: sizeValue / 2,
          backgroundColor,
        },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize: getFontSize() }]}>
        {initials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    overflow: 'hidden',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: COLORS.text,
    fontWeight: '600',
  },
});
