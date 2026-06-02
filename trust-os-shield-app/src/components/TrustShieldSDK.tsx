import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface TrustShieldSDKProps {
  protectionLevel: 'basic' | 'premium' | 'enterprise';
  activeFeatures: string[];
  onFeaturePress?: (feature: string) => void;
}

/**
 * TrustShieldSDK - Core protection component
 * Provides real-time fraud protection and scam detection
 */
export const TrustShieldSDK: React.FC<TrustShieldSDKProps> = ({
  protectionLevel,
  activeFeatures,
  onFeaturePress,
}) => {
  const getLevelColor = () => {
    switch (protectionLevel) {
      case 'enterprise':
        return '#8B5CF6';
      case 'premium':
        return '#6366F1';
      default:
        return '#10B981';
    }
  };

  const getFeatureIcon = (feature: string) => {
    const iconMap: Record<string, string> = {
      'scam-protection': 'shield-checkmark',
      'breach-monitoring': 'server',
      'dark-web': 'globe',
      'call-screening': 'call',
      'sms-filtering': 'document-text',
      'identity-theft': 'finger-print',
    };
    return iconMap[feature] || 'shield';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.shieldContainer}>
          <Ionicons name="shield-checkmark" size={32} color={getLevelColor()} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>TrustOS Shield</Text>
          <Text style={[styles.level, { color: getLevelColor() }]}>
            {protectionLevel.charAt(0).toUpperCase() + protectionLevel.slice(1)} Protection
          </Text>
        </View>
      </View>

      <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>Active Protection</Text>
        <View style={styles.featuresGrid}>
          {activeFeatures.map((feature, index) => (
            <TouchableOpacity
              key={index}
              style={styles.featureItem}
              onPress={() => onFeaturePress?.(feature)}
              activeOpacity={0.7}
            >
              <View style={[styles.featureIcon, { backgroundColor: `${getLevelColor()}15` }]}>
                <Ionicons
                  name={getFeatureIcon(feature) as any}
                  size={20}
                  color={getLevelColor()}
                />
              </View>
              <Text style={styles.featureName}>
                {feature.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.upgradeButton} activeOpacity={0.8}>
        <Ionicons name="arrow-up-circle" size={20} color="#FFFFFF" />
        <Text style={styles.upgradeText}>Upgrade Protection</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  shieldContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  level: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureItem: {
    alignItems: 'center',
    width: 80,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#4B5563',
    textAlign: 'center',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  upgradeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default TrustShieldSDK;
