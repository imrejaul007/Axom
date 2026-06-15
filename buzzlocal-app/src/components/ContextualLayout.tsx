/**
 * Contextual Layout - Dynamic UI based on persona + context
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePersona, useHeroSection } from '../hooks/usePersona';

const colors = {
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceLight: '#252540',
  primary: '#6366F1',
  accent: '#F97316',
  accentGreen: '#10B981',
  accentGold: '#FFD700',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
};

interface ContextualHeroProps {
  onAction?: () => void;
  style?: ViewStyle;
}

export function ContextualHero({ onAction, style }: ContextualHeroProps) {
  const heroSection = useHeroSection();

  const heroContent: Record<string, { icon: string; title: string; subtitle: string; color: string }> = {
    safety_status: {
      icon: 'shield-checkmark',
      title: 'Area Safe',
      subtitle: 'All clear in your area',
      color: colors.accentGreen,
    },
    discover: {
      icon: 'compass',
      title: 'Explore Nearby',
      subtitle: 'Discover what\'s happening',
      color: colors.primary,
    },
    food_discovery: {
      icon: 'restaurant',
      title: 'Hungry?',
      subtitle: 'Best spots nearby',
      color: colors.accent,
    },
    events_today: {
      icon: 'calendar',
      title: 'What\'s On',
      subtitle: 'Events near you',
      color: colors.accentGold,
    },
    deals_alert: {
      icon: 'pricetag',
      title: 'Hot Deals',
      subtitle: 'Limited time offers',
      color: colors.accent,
    },
  };

  const content = heroContent[heroSection] || heroContent.discover;

  return (
    <TouchableOpacity
      style={[styles.heroCard, { borderLeftColor: content.color }, style]}
      onPress={onAction}
      activeOpacity={0.8}
    >
      <View style={[styles.heroIcon, { backgroundColor: content.color + '20' }]}>
        <Ionicons name={content.icon as any} size={24} color={content.color} />
      </View>
      <View style={styles.heroContent}>
        <Text style={styles.heroTitle}>{content.title}</Text>
        <Text style={styles.heroSubtitle}>{content.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

interface ContextualQuickActionsProps {
  onAction?: (action: string) => void;
}

export function ContextualQuickActions({ onAction }: ContextualQuickActionsProps) {
  const { surface } = usePersona();

  const actionIcons: Record<string, { icon: string; label: string; color: string }> = {
    ask: { icon: 'chatbubble-ellipses', label: 'Ask', color: colors.primary },
    explore: { icon: 'compass', label: 'Explore', color: colors.accentGreen },
    checkin: { icon: 'location', label: 'Check In', color: colors.accent },
    scan_deals: { icon: 'qr-code', label: 'Scan Deals', color: colors.accentGold },
    nearby_offers: { icon: 'pricetag', label: 'Nearby', color: colors.accent },
    wishlist: { icon: 'heart', label: 'Wishlist', color: '#EF4444' },
    sos: { icon: 'alert-circle', label: 'SOS', color: '#EF4444' },
  };

  const actions = surface.uiOverrides.quickActions.slice(0, 4);

  return (
    <View style={styles.quickActions}>
      {actions.map((action) => {
        const config = actionIcons[action] || actionIcons.ask;
        return (
          <TouchableOpacity
            key={action}
            style={styles.quickAction}
            onPress={() => onAction?.(action)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: config.color + '20' }]}>
              <Ionicons name={config.icon as any} size={20} color={config.color} />
            </View>
            <Text style={styles.quickActionLabel}>{config.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

interface ContextualAlertProps {
  type: 'safety' | 'offer' | 'event' | 'community';
  title: string;
  subtitle: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function ContextualAlert({ type, title, subtitle, onPress, style }: ContextualAlertProps) {
  const { persona, timeContext } = usePersona();

  // Only show safety alerts at night
  if (type === 'safety' && !['night', 'late_night'].includes(timeContext)) {
    return null;
  }

  const alertColors: Record<string, string> = {
    safety: colors.accentGreen,
    offer: colors.accent,
    event: colors.primary,
    community: colors.accentGold,
  };

  const alertIcons: Record<string, string> = {
    safety: 'shield-checkmark',
    offer: 'pricetag',
    event: 'calendar',
    community: 'people',
  };

  const color = alertColors[type] || colors.primary;
  const icon = alertIcons[type] || 'information-circle';

  return (
    <TouchableOpacity
      style={[styles.alertCard, { borderLeftColor: color }, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.alertIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <View style={styles.alertContent}>
        <Text style={styles.alertTitle}>{title}</Text>
        <Text style={styles.alertSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ feature, children, fallback = null }: FeatureGateProps) {
  const { surface } = usePersona();

  // Check if feature should be shown
  const showFeature =
    surface.topFeatures.includes(feature) ||
    !surface.hiddenFeatures.includes(feature);

  if (!showFeature) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  // Hero
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    gap: 16,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },

  // Alert
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    gap: 12,
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  alertSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
