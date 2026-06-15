import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const colors = {
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceLight: '#252540',
  primary: '#6366F1',
  danger: '#EF4444',
  accent: '#F97316',
  accentGreen: '#10B981',
  accentGold: '#FFD700',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
};

export default function CrisisScreen() {
  const [isSOSActive, setIsSOSActive] = useState(false);

  const handleSOS = () => {
    Alert.alert(
      'Trigger Emergency SOS',
      'This will:\n• Alert your trusted circle\n• Share your location\n• Connect you to emergency services\n\nContinue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Trigger SOS',
          style: 'destructive',
          onPress: () => {
            setIsSOSActive(true);
            Alert.alert(
              'SOS Active',
              'Your contacts have been notified. Help is on the way.',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  };

  const emergencyContacts = [
    { name: 'Police', number: '100', icon: 'shield', color: colors.primary },
    { name: 'Ambulance', number: '108', icon: 'medical', color: colors.danger },
    { name: 'Women Helpline', number: '181', icon: 'women', color: '#EC4899' },
    { name: 'Fire', number: '101', icon: 'flame', color: colors.accent },
  ];

  const resources = [
    { name: 'Nearest Hospital', distance: '1.2 km', available: true, icon: 'hospital' },
    { name: 'Police Station', distance: '800 m', available: true, icon: 'shield-checkmark' },
    { name: 'Shelter', distance: '2 km', available: true, icon: 'home' },
    { name: 'Pharmacy', distance: '500 m', available: true, icon: 'medical-outline' },
  ];

  const recentIncidents = [
    { type: 'Weather', message: 'Heavy rain warning for Bengaluru Urban', time: '2h ago', severity: 'moderate' },
    { type: 'Traffic', message: 'Metro delay on Purple Line', time: '4h ago', severity: 'low' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Crisis Center</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* SOS Button */}
      <View style={styles.sosSection}>
        <TouchableOpacity
          style={[styles.sosButton, isSOSActive && styles.sosButtonActive]}
          onPress={handleSOS}
        >
          <View style={[styles.sosInner, isSOSActive && styles.sosInnerActive]}>
            <Ionicons
              name={isSOSActive ? 'checkmark-circle' : 'alert-circle'}
              size={48}
              color={colors.textPrimary}
            />
            <Text style={styles.sosText}>
              {isSOSActive ? 'SOS ACTIVE' : 'TAP FOR SOS'}
            </Text>
            <Text style={styles.sosSubtext}>
              {isSOSActive ? 'Help is on the way' : 'Alert contacts & emergency services'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Emergency Contacts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Contacts</Text>
        <View style={styles.contactsGrid}>
          {emergencyContacts.map((contact, index) => (
            <TouchableOpacity
              key={index}
              style={styles.contactCard}
              onPress={() => Linking.openURL(`tel:${contact.number}`)}
            >
              <View style={[styles.contactIcon, { backgroundColor: contact.color + '20' }]}>
                <Ionicons name={contact.icon as any} size={24} color={contact.color} />
              </View>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactNumber}>{contact.number}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Resources */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nearby Resources</Text>
        {resources.map((resource, index) => (
          <TouchableOpacity key={index} style={styles.resourceCard}>
            <View style={styles.resourceIcon}>
              <Ionicons name={resource.icon as any} size={20} color={colors.accentGreen} />
            </View>
            <View style={styles.resourceInfo}>
              <Text style={styles.resourceName}>{resource.name}</Text>
              <Text style={styles.resourceDistance}>{resource.distance}</Text>
            </View>
            <View style={styles.availableBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.accentGreen} />
              <Text style={styles.availableText}>Available</Text>
            </View>
            <TouchableOpacity style={styles.directionsButton}>
              <Ionicons name="navigate" size={16} color={colors.primary} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>

      {/* Status Check */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Family Check-In</Text>
        <View style={styles.checkInCard}>
          <View style={styles.checkInIcon}>
            <Ionicons name="people" size={24} color={colors.primary} />
          </View>
          <View style={styles.checkInInfo}>
            <Text style={styles.checkInTitle}>Everyone Safe?</Text>
            <Text style={styles.checkInSubtitle}>Quick check with your trusted contacts</Text>
          </View>
          <TouchableOpacity style={styles.checkInButton}>
            <Text style={styles.checkInButtonText}>Check Now</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Volunteer */}
      <View style={styles.section}>
        <View style={styles.volunteerCard}>
          <View style={styles.volunteerIcon}>
            <Ionicons name="heart" size={24} color={colors.danger} />
          </View>
          <View style={styles.volunteerInfo}>
            <Text style={styles.volunteerTitle}>Become a Volunteer</Text>
            <Text style={styles.volunteerSubtitle}>Help during emergencies</Text>
          </View>
          <TouchableOpacity style={styles.volunteerButton}>
            <Text style={styles.volunteerButtonText}>Join</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Alerts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>City Alerts</Text>
        {recentIncidents.map((incident, index) => (
          <View key={index} style={styles.alertCard}>
            <View style={styles.alertIcon}>
              <Ionicons
                name={incident.type === 'Weather' ? 'cloud' : 'car'}
                size={18}
                color={incident.severity === 'moderate' ? colors.accent : colors.accentGreen}
              />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertType}>{incident.type}</Text>
              <Text style={styles.alertMessage}>{incident.message}</Text>
              <Text style={styles.alertTime}>{incident.time}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  settingsButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.surface,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  sosButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.danger,
    padding: 8,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  sosButtonActive: {
    backgroundColor: colors.accentGreen,
  },
  sosInner: {
    flex: 1,
    borderRadius: 92,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosInnerActive: {
    borderColor: 'rgba(255,255,255,0.4)',
  },
  sosText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    letterSpacing: 2,
    marginTop: 8,
  },
  sosSubtext: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  contactsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  contactCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  contactNumber: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentGreen + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resourceInfo: {
    flex: 1,
  },
  resourceName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  resourceDistance: {
    fontSize: 12,
    color: colors.textMuted,
  },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  availableText: {
    fontSize: 11,
    color: colors.accentGreen,
  },
  directionsButton: {
    width: 36,
    height: 36,
    backgroundColor: colors.primary + '20',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkInCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  checkInIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkInInfo: {
    flex: 1,
  },
  checkInTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  checkInSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  checkInButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  checkInButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  volunteerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger + '10',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.danger + '30',
    gap: 12,
  },
  volunteerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.danger + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  volunteerInfo: {
    flex: 1,
  },
  volunteerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  volunteerSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  volunteerButton: {
    backgroundColor: colors.danger,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  volunteerButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertType: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  alertMessage: {
    fontSize: 14,
    color: colors.textPrimary,
    marginTop: 2,
  },
  alertTime: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
});
