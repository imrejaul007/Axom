import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Alert as RNAlert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SettingRowProps {
  icon: string;
  iconColor?: string;
  iconBgColor?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  iconColor = '#6366F1',
  iconBgColor = '#EEF2FF',
  title,
  subtitle,
  onPress,
  rightElement,
  showChevron = true,
}) => (
  <TouchableOpacity
    style={styles.settingRow}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={[styles.settingIconContainer, { backgroundColor: iconBgColor }]}>
      <Ionicons name={icon as any} size={20} color={iconColor} />
    </View>
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    {rightElement}
    {showChevron && onPress && (
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    )}
  </TouchableOpacity>
);

interface ProtectedItem {
  id: string;
  type: 'email' | 'phone' | 'bank' | 'social';
  value: string;
  isPrimary: boolean;
  isVerified: boolean;
}

export default function SettingsScreen() {
  const [protectedEmails, setProtectedEmails] = useState<ProtectedItem[]>([
    { id: '1', type: 'email', value: 'user@example.com', isPrimary: true, isVerified: true },
    { id: '2', type: 'email', value: 'work@company.com', isPrimary: false, isVerified: true },
  ]);

  const [protectedPhones, setProtectedPhones] = useState<ProtectedItem[]>([
    { id: '1', type: 'phone', value: '+1 (555) 123-4567', isPrimary: true, isVerified: true },
  ]);

  const [settings, setSettings] = useState({
    scamProtection: true,
    breachMonitoring: true,
    darkWebMonitoring: true,
    callScreening: false,
    smsFiltering: true,
    instantAlerts: true,
    weeklyReport: true,
    biometricUnlock: false,
    showScoreToOthers: false,
  });

  const [showAddEmail, setShowAddEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddEmail = () => {
    if (newEmail.trim()) {
      const newItem: ProtectedItem = {
        id: Date.now().toString(),
        type: 'email',
        value: newEmail.trim(),
        isPrimary: false,
        isVerified: false,
      };
      setProtectedEmails(prev => [...prev, newItem]);
      setNewEmail('');
      setShowAddEmail(false);
      RNAlert.alert('Email Added', 'Please verify your email to complete setup.');
    }
  };

  const handleRemoveItem = (type: 'email' | 'phone', id: string) => {
    RNAlert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from protection?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            if (type === 'email') {
              setProtectedEmails(prev => prev.filter(item => item.id !== id));
            } else {
              setProtectedPhones(prev => prev.filter(item => item.id !== id));
            }
          },
        },
      ]
    );
  };

  const handleSetPrimary = (type: 'email' | 'phone', id: string) => {
    if (type === 'email') {
      setProtectedEmails(prev =>
        prev.map(item => ({ ...item, isPrimary: item.id === id }))
      );
    } else {
      setProtectedPhones(prev =>
        prev.map(item => ({ ...item, isPrimary: item.id === id }))
      );
    }
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://rez.trust/privacy');
  };

  const handleTermsOfService = () => {
    Linking.openURL('https://rez.trust/terms');
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@rez.trust');
  };

  const handleExportData = () => {
    RNAlert.alert(
      'Export Data',
      'Your data export will be sent to your registered email within 24 hours.',
      [{ text: 'OK' }]
    );
  };

  const handleDeleteAccount = () => {
    RNAlert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Handle account deletion
            RNAlert.alert('Account Deletion', 'Please contact support to delete your account.');
          },
        },
      ]
    );
  };

  const renderProtectedItems = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Protected Items</Text>
        <TouchableOpacity onPress={() => setShowAddEmail(true)}>
          <Ionicons name="add-circle" size={24} color="#6366F1" />
        </TouchableOpacity>
      </View>

      {/* Protected Emails */}
      <View style={styles.subsection}>
        <Text style={styles.subsectionTitle}>Email Addresses</Text>
        {protectedEmails.map(item => (
          <View key={item.id} style={styles.protectedItem}>
            <View style={styles.protectedItemLeft}>
              <View style={[styles.itemIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="mail" size={16} color="#3B82F6" />
              </View>
              <View>
                <View style={styles.itemValueRow}>
                  <Text style={styles.itemValue}>{item.value}</Text>
                  {item.isPrimary && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>Primary</Text>
                    </View>
                  )}
                  {item.isVerified ? (
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  ) : (
                    <Ionicons name="time" size={16} color="#F59E0B" />
                  )}
                </View>
              </View>
            </View>
            <View style={styles.itemActions}>
              {!item.isPrimary && (
                <TouchableOpacity onPress={() => handleSetPrimary('email', item.id)}>
                  <Text style={styles.setPrimaryText}>Set Primary</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => handleRemoveItem('email', item.id)}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Protected Phones */}
      <View style={styles.subsection}>
        <Text style={styles.subsectionTitle}>Phone Numbers</Text>
        {protectedPhones.map(item => (
          <View key={item.id} style={styles.protectedItem}>
            <View style={styles.protectedItemLeft}>
              <View style={[styles.itemIcon, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="call" size={16} color="#10B981" />
              </View>
              <View>
                <View style={styles.itemValueRow}>
                  <Text style={styles.itemValue}>{item.value}</Text>
                  {item.isPrimary && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>Primary</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity onPress={() => handleRemoveItem('phone', item.id)}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Add Email Modal */}
      {showAddEmail && (
        <View style={styles.addEmailContainer}>
          <TextInput
            style={styles.emailInput}
            placeholder="Enter email address"
            value={newEmail}
            onChangeText={setNewEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={styles.addEmailActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowAddEmail(false);
                setNewEmail('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={handleAddEmail}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  const renderProtectionSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Protection Settings</Text>
      <View style={styles.settingsCard}>
        <SettingRow
          icon="shield-checkmark"
          iconColor="#10B981"
          iconBgColor="#ECFDF5"
          title="Scam Protection"
          subtitle="Block known scam calls and messages"
          showChevron={false}
          rightElement={
            <Switch
              value={settings.scamProtection}
              onValueChange={() => handleToggle('scamProtection')}
              trackColor={{ false: '#E5E7EB', true: '#A7F3D0' }}
              thumbColor={settings.scamProtection ? '#10B981' : '#9CA3AF'}
            />
          }
        />
        <View style={styles.settingDivider} />
        <SettingRow
          icon="server"
          iconColor="#3B82F6"
          iconBgColor="#DBEAFE"
          title="Breach Monitoring"
          subtitle="Monitor your data in real-time"
          showChevron={false}
          rightElement={
            <Switch
              value={settings.breachMonitoring}
              onValueChange={() => handleToggle('breachMonitoring')}
              trackColor={{ false: '#E5E7EB', true: '#A7F3D0' }}
              thumbColor={settings.breachMonitoring ? '#3B82F6' : '#9CA3AF'}
            />
          }
        />
        <View style={styles.settingDivider} />
        <SettingRow
          icon="globe"
          iconColor="#8B5CF6"
          iconBgColor="#EDE9FE"
          title="Dark Web Monitoring"
          subtitle="Alert on data exposure"
          showChevron={false}
          rightElement={
            <Switch
              value={settings.darkWebMonitoring}
              onValueChange={() => handleToggle('darkWebMonitoring')}
              trackColor={{ false: '#E5E7EB', true: '#A7F3D0' }}
              thumbColor={settings.darkWebMonitoring ? '#8B5CF6' : '#9CA3AF'}
            />
          }
        />
        <View style={styles.settingDivider} />
        <SettingRow
          icon="call"
          iconColor="#F59E0B"
          iconBgColor="#FEF3C7"
          title="Call Screening"
          subtitle="Screen unknown callers"
          showChevron={false}
          rightElement={
            <Switch
              value={settings.callScreening}
              onValueChange={() => handleToggle('callScreening')}
              trackColor={{ false: '#E5E7EB', true: '#A7F3D0' }}
              thumbColor={settings.callScreening ? '#F59E0B' : '#9CA3AF'}
            />
          }
        />
        <View style={styles.settingDivider} />
        <SettingRow
          icon="document-text"
          iconColor="#EC4899"
          iconBgColor="#FCE7F3"
          title="SMS Filtering"
          subtitle="Block spam and scam SMS"
          showChevron={false}
          rightElement={
            <Switch
              value={settings.smsFiltering}
              onValueChange={() => handleToggle('smsFiltering')}
              trackColor={{ false: '#E5E7EB', true: '#A7F3D0' }}
              thumbColor={settings.smsFiltering ? '#EC4899' : '#9CA3AF'}
            />
          }
        />
      </View>
    </View>
  );

  const renderNotificationSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.settingsCard}>
        <SettingRow
          icon="notifications"
          iconColor="#6366F1"
          iconBgColor="#EEF2FF"
          title="Instant Alerts"
          subtitle="Real-time breach notifications"
          showChevron={false}
          rightElement={
            <Switch
              value={settings.instantAlerts}
              onValueChange={() => handleToggle('instantAlerts')}
              trackColor={{ false: '#E5E7EB', true: '#A7F3D0' }}
              thumbColor={settings.instantAlerts ? '#6366F1' : '#9CA3AF'}
            />
          }
        />
        <View style={styles.settingDivider} />
        <SettingRow
          icon="calendar"
          iconColor="#14B8A6"
          iconBgColor="#CCFBF1"
          title="Weekly Report"
          subtitle="Summary of protection status"
          showChevron={false}
          rightElement={
            <Switch
              value={settings.weeklyReport}
              onValueChange={() => handleToggle('weeklyReport')}
              trackColor={{ false: '#E5E7EB', true: '#A7F3D0' }}
              thumbColor={settings.weeklyReport ? '#14B8A6' : '#9CA3AF'}
            />
          }
        />
      </View>
    </View>
  );

  const renderSecuritySettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Security</Text>
      <View style={styles.settingsCard}>
        <SettingRow
          icon="finger-print"
          iconColor="#111827"
          iconBgColor="#F3F4F6"
          title="Biometric Unlock"
          subtitle="Use Face ID or Touch ID"
          showChevron={false}
          rightElement={
            <Switch
              value={settings.biometricUnlock}
              onValueChange={() => handleToggle('biometricUnlock')}
              trackColor={{ false: '#E5E7EB', true: '#A7F3D0' }}
              thumbColor={settings.biometricUnlock ? '#111827' : '#9CA3AF'}
            />
          }
        />
        <View style={styles.settingDivider} />
        <SettingRow
          icon="eye-off"
          iconColor="#6B7280"
          iconBgColor="#F3F4F6"
          title="Hide Score from Others"
          subtitle="Keep your trust score private"
          showChevron={false}
          rightElement={
            <Switch
              value={settings.showScoreToOthers}
              onValueChange={() => handleToggle('showScoreToOthers')}
              trackColor={{ false: '#E5E7EB', true: '#A7F3D0' }}
              thumbColor={settings.showScoreToOthers ? '#6B7280' : '#9CA3AF'}
            />
          }
        />
      </View>
    </View>
  );

  const renderLegalAndSupport = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Legal & Support</Text>
      <View style={styles.settingsCard}>
        <SettingRow
          icon="document-outline"
          iconColor="#6366F1"
          iconBgColor="#EEF2FF"
          title="Privacy Policy"
          onPress={handlePrivacyPolicy}
        />
        <View style={styles.settingDivider} />
        <SettingRow
          icon="newspaper-outline"
          iconColor="#6366F1"
          iconBgColor="#EEF2FF"
          title="Terms of Service"
          onPress={handleTermsOfService}
        />
        <View style={styles.settingDivider} />
        <SettingRow
          icon="help-circle-outline"
          iconColor="#3B82F6"
          iconBgColor="#DBEAFE"
          title="Contact Support"
          onPress={handleContactSupport}
        />
        <View style={styles.settingDivider} />
        <SettingRow
          icon="download-outline"
          iconColor="#10B981"
          iconBgColor="#ECFDF5"
          title="Export My Data"
          subtitle="Download all your data"
          onPress={handleExportData}
        />
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {renderProtectedItems()}
      {renderProtectionSettings()}
      {renderNotificationSettings()}
      {renderSecuritySettings()}
      {renderLegalAndSupport()}

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>Danger Zone</Text>
        <View style={[styles.settingsCard, styles.dangerCard]}>
          <SettingRow
            icon="trash"
            iconColor="#EF4444"
            iconBgColor="#FEE2E2"
            title="Delete Account"
            subtitle="Permanently remove all data"
            onPress={handleDeleteAccount}
            showChevron={false}
          />
        </View>
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appName}>TrustOS Shield</Text>
        <Text style={styles.appVersion}>Version 1.0.0</Text>
        <Text style={styles.appCopyright}>© 2026 REZ Trust Network</Text>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  subsection: {
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  protectedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  protectedItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  primaryBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6366F1',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  setPrimaryText: {
    fontSize: 13,
    color: '#6366F1',
    fontWeight: '500',
  },
  addEmailContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  emailInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  addEmailActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  addButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 12,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  appVersion: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  bottomPadding: {
    height: 100,
  },
});
