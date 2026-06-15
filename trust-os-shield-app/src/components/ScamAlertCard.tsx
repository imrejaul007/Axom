import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ScamAlertCardProps {
  type: 'sms' | 'call' | 'link' | 'email';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: string;
  sender?: string;
  onDismiss?: () => void;
  onReport?: () => void;
  onDetails?: () => void;
}

/**
 * ScamAlertCard - Displays scam/fraud alerts to users
 */
export const ScamAlertCard: React.FC<ScamAlertCardProps> = ({
  type,
  severity,
  title,
  description,
  timestamp,
  sender,
  onDismiss,
  onReport,
  onDetails,
}) => {
  const getTypeIcon = () => {
    switch (type) {
      case 'sms':
        return 'chatbubble';
      case 'call':
        return 'call';
      case 'link':
        return 'link';
      case 'email':
        return 'mail';
      default:
        return 'alert-circle';
    }
  };

  const getSeverityConfig = () => {
    switch (severity) {
      case 'high':
        return {
          color: '#EF4444',
          bgColor: '#FEE2E2',
          label: 'High Risk',
          icon: 'alert-circle',
        };
      case 'medium':
        return {
          color: '#F59E0B',
          bgColor: '#FEF3C7',
          label: 'Medium Risk',
          icon: 'warning',
        };
      case 'low':
        return {
          color: '#3B82F6',
          bgColor: '#DBEAFE',
          label: 'Low Risk',
          icon: 'information-circle',
        };
    }
  };

  const severityConfig = getSeverityConfig();

  return (
    <View style={[styles.container, { borderLeftColor: severityConfig.color }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.typeIconContainer, { backgroundColor: severityConfig.bgColor }]}>
          <Ionicons name={getTypeIcon() as any} size={20} color={severityConfig.color} />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.timestamp}>{timestamp}</Text>
            {sender && <Text style={styles.sender}>• {sender}</Text>}
          </View>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: severityConfig.bgColor }]}>
          <Ionicons name={severityConfig.icon as any} size={12} color={severityConfig.color} />
          <Text style={[styles.severityText, { color: severityConfig.color }]}>
            {severityConfig.label}
          </Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description}>{description}</Text>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onDetails}
          activeOpacity={0.7}
        >
          <Ionicons name="information-circle-outline" size={18} color="#6366F1" />
          <Text style={styles.actionText}>Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.reportButton]}
          onPress={onReport}
          activeOpacity={0.7}
        >
          <Ionicons name="flag-outline" size={18} color="#EF4444" />
          <Text style={[styles.actionText, { color: '#EF4444' }]}>Report</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={onDismiss}
          activeOpacity={0.7}
        >
          <Ionicons name="close-circle-outline" size={18} color="#6B7280" />
          <Text style={styles.actionText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  typeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#6B7280',
  },
  sender: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reportButton: {
    marginLeft: 'auto',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6366F1',
  },
});

export default ScamAlertCard;
