import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert as RNAlert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type AlertSeverity = 'critical' | 'warning' | 'info';

interface BreachAlert {
  id: string;
  type: 'breach' | 'scam' | 'leak' | 'fraud';
  severity: AlertSeverity;
  title: string;
  description: string;
  source?: string;
  date: string;
  affectedData?: string[];
  isResolved: boolean;
}

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<BreachAlert[]>([
    {
      id: '1',
      type: 'breach',
      severity: 'critical',
      title: 'Data Breach Detected',
      description: 'Your email was found in a data breach from a popular service.',
      source: 'DarkWeb Monitor',
      date: '2 days ago',
      affectedData: ['Email', 'Password hash'],
      isResolved: false,
    },
    {
      id: '2',
      type: 'scam',
      severity: 'warning',
      title: 'Phishing Attempt Blocked',
      description: 'We blocked a phishing email attempting to impersonate your bank.',
      date: '5 days ago',
      isResolved: true,
    },
    {
      id: '3',
      type: 'leak',
      severity: 'warning',
      title: 'Personal Info Exposed',
      description: 'Your phone number was found in a leaked database.',
      source: 'DarkWeb Monitor',
      date: '1 week ago',
      affectedData: ['Phone number'],
      isResolved: false,
    },
    {
      id: '4',
      type: 'fraud',
      severity: 'info',
      title: 'Suspicious Activity',
      description: 'Unusual login attempt detected from new device.',
      date: '2 weeks ago',
      isResolved: true,
    },
  ]);
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      // Simulate API call - replace with actual API integration
      // const response = await api.get('/alerts');
      // setAlerts(response.data);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  const getFilteredAlerts = () => {
    switch (filter) {
      case 'unresolved':
        return alerts.filter(a => !a.isResolved);
      case 'resolved':
        return alerts.filter(a => a.isResolved);
      default:
        return alerts;
    }
  };

  const getSeverityConfig = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return {
          color: '#EF4444',
          bgColor: '#FEE2E2',
          icon: 'alert-circle',
          label: 'Critical',
        };
      case 'warning':
        return {
          color: '#F59E0B',
          bgColor: '#FEF3C7',
          icon: 'warning',
          label: 'Warning',
        };
      case 'info':
        return {
          color: '#3B82F6',
          bgColor: '#DBEAFE',
          icon: 'information-circle',
          label: 'Info',
        };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'breach':
        return 'shield-broken';
      case 'scam':
        return 'call-outline';
      case 'leak':
        return 'cloud-offline';
      case 'fraud':
        return 'fingerprint';
      default:
        return 'alert-circle';
    }
  };

  const handleAlertAction = (alert: BreachAlert) => {
    if (alert.isResolved) return;

    RNAlert.alert(
      alert.title,
      `What would you like to do with this ${alert.type} alert?`,
      [
        { text: 'View Details', onPress: () => handleViewDetails(alert) },
        { text: 'Mark Resolved', onPress: () => handleResolve(alert.id) },
        { text: 'Dismiss', style: 'cancel' },
      ]
    );
  };

  const handleViewDetails = (alert: BreachAlert) => {
    const details = `
Type: ${alert.type.toUpperCase()}
Severity: ${getSeverityConfig(alert.severity).label}
Date Detected: ${alert.date}
${alert.source ? `Source: ${alert.source}` : ''}
${alert.affectedData ? `\nAffected Data:\n${alert.affectedData.map(d => `• ${d}`).join('\n')}` : ''}
${alert.description}
    `.trim();

    RNAlert.alert('Alert Details', details);
  };

  const handleResolve = (alertId: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, isResolved: true } : alert
      )
    );
    RNAlert.alert('Resolved', 'Alert has been marked as resolved.');
  };

  const handleMarkAllResolved = () => {
    RNAlert.alert(
      'Mark All Resolved',
      'Are you sure you want to mark all alerts as resolved?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resolve All',
          onPress: () => {
            setAlerts(prev => prev.map(alert => ({ ...alert, isResolved: true })));
          },
        },
      ]
    );
  };

  const renderAlertCard = (alert: BreachAlert) => {
    const severityConfig = getSeverityConfig(alert.severity);

    return (
      <TouchableOpacity
        key={alert.id}
        style={[styles.alertCard, alert.isResolved && styles.alertCardResolved]}
        onPress={() => handleAlertAction(alert)}
        activeOpacity={alert.isResolved ? 1 : 0.7}
      >
        <View style={styles.alertHeader}>
          <View style={[styles.alertIconContainer, { backgroundColor: severityConfig.bgColor }]}>
            <Ionicons
              name={getTypeIcon(alert.type) as any}
              size={24}
              color={severityConfig.color}
            />
          </View>
          <View style={styles.alertHeaderContent}>
            <View style={styles.alertTitleRow}>
              <Text style={[styles.alertTitle, alert.isResolved && styles.textResolved]}>
                {alert.title}
              </Text>
              {alert.isResolved && (
                <View style={styles.resolvedBadge}>
                  <Ionicons name="checkmark" size={12} color="#10B981" />
                  <Text style={styles.resolvedText}>Resolved</Text>
                </View>
              )}
            </View>
            <Text style={[styles.alertDate, alert.isResolved && styles.textResolved]}>
              {alert.date}
            </Text>
          </View>
          <View style={[styles.severityBadge, { backgroundColor: severityConfig.bgColor }]}>
            <Ionicons name={severityConfig.icon as any} size={14} color={severityConfig.color} />
            <Text style={[styles.severityText, { color: severityConfig.color }]}>
              {severityConfig.label}
            </Text>
          </View>
        </View>

        <Text style={[styles.alertDescription, alert.isResolved && styles.textResolved]}>
          {alert.description}
        </Text>

        {alert.affectedData && alert.affectedData.length > 0 && !alert.isResolved && (
          <View style={styles.affectedDataContainer}>
            <Text style={styles.affectedDataLabel}>Affected Data:</Text>
            <View style={styles.affectedDataTags}>
              {alert.affectedData.map((data, index) => (
                <View key={index} style={styles.affectedDataTag}>
                  <Text style={styles.affectedDataTagText}>{data}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {alert.source && (
          <View style={styles.sourceContainer}>
            <Ionicons name="globe-outline" size={14} color="#6B7280" />
            <Text style={styles.sourceText}>{alert.source}</Text>
          </View>
        )}

        {!alert.isResolved && (
          <View style={styles.alertActions}>
            <TouchableOpacity
              style={styles.resolveButton}
              onPress={() => handleResolve(alert.id)}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
              <Text style={styles.resolveButtonText}>Mark Resolved</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const unresolvedCount = alerts.filter(a => !a.isResolved).length;
  const filteredAlerts = getFilteredAlerts();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Alerts</Text>
          {unresolvedCount > 0 && (
            <Text style={styles.subtitle}>
              {unresolvedCount} unresolved alert{unresolvedCount > 1 ? 's' : ''}
            </Text>
          )}
        </View>
        {unresolvedCount > 0 && (
          <TouchableOpacity style={styles.resolveAllButton} onPress={handleMarkAllResolved}>
            <Text style={styles.resolveAllText}>Resolve All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'unresolved', 'resolved'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
            {f === 'unresolved' && unresolvedCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{unresolvedCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Alerts List */}
      <ScrollView
        style={styles.alertsList}
        contentContainerStyle={styles.alertsListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map(alert => renderAlertCard(alert))
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            </View>
            <Text style={styles.emptyTitle}>All Clear!</Text>
            <Text style={styles.emptyDescription}>
              {filter === 'all'
                ? 'No alerts at this time.'
                : filter === 'unresolved'
                ? 'No unresolved alerts. Great job!'
                : 'No resolved alerts yet.'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Quick Actions Footer */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="scan-outline" size={24} color="#6366F1" />
          <Text style={styles.quickActionText}>Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="shield-checkmark-outline" size={24} color="#6366F1" />
          <Text style={styles.quickActionText}>Protect</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="refresh-outline" size={24} color="#6366F1" />
          <Text style={styles.quickActionText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
    fontWeight: '500',
  },
  resolveAllButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resolveAllText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#6366F1',
  },
  filterBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  alertsList: {
    flex: 1,
  },
  alertsListContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  alertCardResolved: {
    opacity: 0.7,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alertIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertHeaderContent: {
    flex: 1,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  alertDate: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
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
    fontSize: 12,
    fontWeight: '600',
  },
  alertDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  textResolved: {
    color: '#9CA3AF',
  },
  affectedDataContainer: {
    marginBottom: 12,
  },
  affectedDataLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  affectedDataTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  affectedDataTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  affectedDataTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#EF4444',
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sourceText: {
    fontSize: 13,
    color: '#6B7280',
  },
  alertActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    marginTop: 4,
  },
  resolveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resolveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  resolvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  resolvedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 20,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6366F1',
    marginTop: 4,
  },
});
