/**
 * Safety Center Screen
 * SOS, emergency contacts, live tracking, verification badges
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { safetyService } from '../../services/safety/safety';

const COLORS = {
  primary: '#6366f1',
  danger: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
  background: '#0f0f23',
  card: '#1a1a2e',
  text: '#ffffff',
  textSecondary: '#a1a1aa',
};

export default function SafetyScreen() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [verification, setVerification] = useState<any>(null);
  const [isSOSActive, setIsSOSActive] = useState(false);

  useEffect(() => {
    loadSafetyData();
  }, []);

  const loadSafetyData = async () => {
    const [emergencyContacts, verifyStatus] = await Promise.all([
      safetyService.getEmergencyContacts('currentUser'),
      safetyService.getVerificationStatus('currentUser'),
    ]);
    setContacts(emergencyContacts);
    setVerification(verifyStatus);
  };

  const handleSOS = () => {
    Alert.alert(
      '🚨 Emergency SOS',
      'This will alert all your emergency contacts with your current location. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: async () => {
            // Get location would use expo-location
            const result = await safetyService.triggerSOS('currentUser', {
              lat: 19.076,
              lng: 72.8777,
            }, 'Emergency from Rendez');
            if (result.success) {
              setIsSOSActive(true);
              Alert.alert('SOS Sent', `Notified ${result.notifiedContacts} emergency contacts`);
            }
          },
        },
      ]
    );
  };

  const getVerificationBadge = (level: string) => {
    const badges: Record<string, { color: string; icon: string; label: string }> = {
      basic: { color: COLORS.textSecondary, icon: 'help-circle', label: 'Basic' },
      verified: { color: COLORS.success, icon: 'checkmark-circle', label: 'Verified' },
      premium: { color: COLORS.primary, icon: 'ribbon', label: 'Premium' },
      trusted: { color: COLORS.warning, icon: 'shield-checkmark', label: 'Trusted' },
    };
    return badges[level] || badges.basic;
  };

  const verificationBadge = verification ? getVerificationBadge(verification.overallLevel) : null;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Safety Center</Text>
      </View>

      {/* SOS Button */}
      <View style={styles.sosSection}>
        <TouchableOpacity
          style={[styles.sosButton, isSOSActive && styles.sosButtonActive]}
          onPress={handleSOS}
          activeOpacity={0.8}
        >
          <View style={styles.sosInner}>
            <Ionicons
              name={isSOSActive ? 'checkmark' : 'alert-circle'}
              size={32}
              color="#fff"
            />
            <Text style={styles.sosText}>
              {isSOSActive ? 'SOS Sent' : 'SOS Emergency'}
            </Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.sosSubtext}>
          Hold for 3 seconds to send emergency alert
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction}>
          <View style={[styles.quickIcon, { backgroundColor: '#ef444420' }]}>
            <Ionicons name="location" size={24} color="#ef4444" />
          </View>
          <Text style={styles.quickLabel}>Share Location</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <View style={[styles.quickIcon, { backgroundColor: '#10b98120' }]}>
            <Ionicons name="timer" size={24} color="#10b981" />
          </View>
          <Text style={styles.quickLabel}>Safe Timer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction}>
          <View style={[styles.quickIcon, { backgroundColor: '#6366f120' }]}>
            <Ionicons name="shield-checkmark" size={24} color="#6366f1" />
          </View>
          <Text style={styles.quickLabel}>Verify ID</Text>
        </TouchableOpacity>
      </View>

      {/* Verification Status */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Verification</Text>
          <View style={[styles.badge, { backgroundColor: verificationBadge?.color + '20' }]}>
            <Ionicons name={verificationBadge?.icon as any} size={14} color={verificationBadge?.color} />
            <Text style={[styles.badgeText, { color: verificationBadge?.color }]}>
              {verificationBadge?.label}
            </Text>
          </View>
        </View>

        <View style={styles.verificationCard}>
          {[
            { key: 'phone', label: 'Phone', icon: 'phone-portrait', verified: verification?.phone },
            { key: 'email', label: 'Email', icon: 'mail', verified: verification?.email },
            { key: 'selfie', label: 'Selfie', icon: 'person', verified: verification?.selfie?.status === 'verified' },
            { key: 'government', label: 'Government ID', icon: 'card', verified: verification?.governmentId?.status === 'verified' },
            { key: 'linkedin', label: 'LinkedIn', icon: 'briefcase', verified: verification?.linkedIn?.status === 'verified' },
            { key: 'instagram', label: 'Instagram', icon: 'logo-instagram', verified: verification?.instagram?.status === 'verified' },
          ].map((item) => (
            <TouchableOpacity key={item.key} style={styles.verifyItem}>
              <View style={styles.verifyInfo}>
                <Ionicons name={item.icon as any} size={20} color={COLORS.textSecondary} />
                <Text style={styles.verifyLabel}>{item.label}</Text>
              </View>
              {item.verified ? (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                </View>
              ) : (
                <TouchableOpacity style={styles.verifyButton}>
                  <Text style={styles.verifyButtonText}>Verify</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Emergency Contacts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          <TouchableOpacity>
            <Ionicons name="add-circle" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {contacts.length === 0 ? (
          <View style={styles.emptyContacts}>
            <Text style={styles.emptyText}>No emergency contacts added</Text>
            <TouchableOpacity style={styles.addButton}>
              <Text style={styles.addButtonText}>Add Contact</Text>
            </TouchableOpacity>
          </View>
        ) : (
          contacts.map((contact) => (
            <View key={contact.id} style={styles.contactCard}>
              <View style={styles.contactAvatar}>
                <Text style={styles.contactInitial}>
                  {contact.name.charAt(0)}
                </Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactRelation}>{contact.relationship}</Text>
              </View>
              <TouchableOpacity style={styles.contactCall}>
                <Ionicons name="call" size={20} color={COLORS.success} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Safety Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Safety Features</Text>
        <View style={styles.featuresGrid}>
          {[
            { icon: 'timer-outline', label: 'Safe Date Timer', desc: 'Auto-alert after set time' },
            { icon: 'location-outline', label: 'Location Sharing', desc: 'Share with matches' },
            { icon: 'videocam-outline', label: 'Video Call', desc: 'Verify before meeting' },
            { icon: 'document-text-outline', label: 'Date Check-in', desc: 'Confirm safe arrival' },
            { icon: 'shield-outline', label: 'Block & Report', desc: 'Protect yourself' },
            { icon: 'eye-off-outline', label: 'Screenshot Alert', desc: 'Get notified of screenshots' },
          ].map((feature) => (
            <TouchableOpacity key={feature.label} style={styles.featureCard}>
              <Ionicons name={feature.icon as any} size={24} color={COLORS.primary} />
              <Text style={styles.featureLabel}>{feature.label}</Text>
              <Text style={styles.featureDesc}>{feature.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Safety Tips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Safety Tips</Text>
        <View style={styles.tipsCard}>
          {[
            'Meet in public places for first dates',
            'Tell a friend where you\'re going',
            'Trust your instincts - if something feels wrong, leave',
            'Use the Safe Date Timer for added security',
            'Verify your date\'s identity with video call',
          ].map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <View style={styles.tipNumber}>
                <Text style={styles.tipNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  sosSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  sosButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  sosButtonActive: {
    backgroundColor: COLORS.success,
  },
  sosInner: {
    alignItems: 'center',
    gap: 8,
  },
  sosText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sosSubtext: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  quickAction: {
    alignItems: 'center',
    gap: 8,
  },
  quickIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '500',
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
    color: COLORS.text,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  verificationCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 8,
  },
  verifyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  verifyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  verifyLabel: {
    color: COLORS.text,
    fontSize: 15,
  },
  verifiedBadge: {},
  verifyButton: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  verifyButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContacts: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInitial: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  contactRelation: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  contactCall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: '47%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
  },
  featureLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  featureDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  tipsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tipText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
});
