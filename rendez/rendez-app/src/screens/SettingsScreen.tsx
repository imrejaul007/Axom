import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, ActivityIndicator, Linking,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';

interface SettingRowProps {
  icon: string;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  destructive?: boolean;
}

function SettingRow({ icon, label, sublabel, onPress, right, destructive }: SettingRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress && !right}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, destructive && styles.destructiveText]}>{label}</Text>
        {sublabel && <Text style={styles.rowSublabel}>{sublabel}</Text>}
      </View>
      {right || (onPress ? <Text style={styles.chevron}>›</Text> : null)}
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ navigation }: { navigation: { goBack: () => void; navigate: (s: string) => void } }) {
  const { logout } = useAuthStore();
  const [matchNotifs, setMatchNotifs] = useState(true);
  const [messageNotifs, setMessageNotifs] = useState(true);
  const [giftNotifs, setGiftNotifs] = useState(true);
  const [marketingNotifs, setMarketingNotifs] = useState(false);
  const [savingNotifs, setSavingNotifs] = useState(false);

  const deleteAccountMutation = useMutation({
    mutationFn: () => api.delete('/profile/me'),
    onSuccess: () => {
      Alert.alert('Account deleted', 'Your account has been permanently deleted.');
      logout();
    },
    onError: () => Alert.alert('Error', 'Could not delete account. Contact support@rendez.in'),
  });

  const handleNotifToggle = async (type: string, value: boolean) => {
    setSavingNotifs(true);
    try {
      // Update local state
      if (type === 'match') setMatchNotifs(value);
      if (type === 'message') setMessageNotifs(value);
      if (type === 'gift') setGiftNotifs(value);
      if (type === 'marketing') setMarketingNotifs(value);

      await api.patch('/devices/preferences', {
        notifications: {
          match: type === 'match' ? value : matchNotifs,
          message: type === 'message' ? value : messageNotifs,
          gift: type === 'gift' ? value : giftNotifs,
          marketing: type === 'marketing' ? value : marketingNotifs,
        },
      });
    } finally {
      setSavingNotifs(false);
    }
  };

  const handleOpenSystemSettings = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Notifications disabled',
        'Open Settings to allow Rendez to send you notifications.',
        [{ text: 'OK' }],
      );
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This will permanently delete your profile, matches, and message history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete permanently',
          style: 'destructive',
          onPress: () => deleteAccountMutation.mutate(),
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Notifications */}
      <View style={styles.group}>
        <Text style={styles.groupLabel}>Notifications</Text>
        <SettingRow
          icon="💜"
          label="New matches"
          sublabel="When someone likes you back"
          right={
            <Switch
              value={matchNotifs}
              onValueChange={(v) => handleNotifToggle('match', v)}
              trackColor={{ true: '#7c3aed' }}
              disabled={savingNotifs}
            />
          }
        />
        <SettingRow
          icon="💬"
          label="Messages & gifts"
          sublabel="Incoming messages and gift offers"
          right={
            <Switch
              value={messageNotifs || giftNotifs}
              onValueChange={(v) => {
                handleNotifToggle('message', v);
                handleNotifToggle('gift', v);
              }}
              trackColor={{ true: '#7c3aed' }}
              disabled={savingNotifs}
            />
          }
        />
        <SettingRow
          icon="📣"
          label="Promotions"
          sublabel="Tips, offers, and Rendez news"
          right={
            <Switch
              value={marketingNotifs}
              onValueChange={(v) => handleNotifToggle('marketing', v)}
              trackColor={{ true: '#7c3aed' }}
              disabled={savingNotifs}
            />
          }
        />
        <SettingRow
          icon="⚙️"
          label="System notification settings"
          onPress={handleOpenSystemSettings}
        />
      </View>

      {/* Account */}
      <View style={styles.group}>
        <Text style={styles.groupLabel}>Account</Text>
        <SettingRow
          icon="✏️"
          label="Edit profile"
          onPress={() => navigation.navigate('ProfileEdit')}
        />
        <SettingRow
          icon="🔒"
          label="Privacy policy"
          // R2-L4 FIX: Implement functional privacy policy link instead of placeholder alert.
          onPress={() => Linking.openURL('https://rendez.in/privacy').catch(() =>
            Alert.alert('Privacy Policy', 'Visit rendez.in/privacy for full policy.')
          )}
        />
        <SettingRow
          icon="📋"
          label="Terms of service"
          // R2-L4 FIX: Implement functional terms link instead of placeholder alert.
          onPress={() => Linking.openURL('https://rendez.in/terms').catch(() =>
            Alert.alert('Terms of Service', 'Visit rendez.in/terms for full terms.')
          )}
        />
        <SettingRow
          icon="📧"
          label="Contact support"
          sublabel="support@rendez.in"
          onPress={() => {
            Alert.alert('Support', 'Email us at support@rendez.in — we respond within 24 hours.');
          }}
        />
      </View>

      {/* REZ */}
      <View style={styles.group}>
        <Text style={styles.groupLabel}>REZ Ecosystem</Text>
        <SettingRow
          icon="💳"
          label="REZ Wallet"
          sublabel="View your REZ coins and transactions"
          onPress={() => navigation.navigate('Profile')}
        />
        <SettingRow
          icon="🎁"
          label="Gift history"
          sublabel="All gifts sent and received"
          onPress={() => navigation.navigate('Main')}
        />
      </View>

      {/* Danger zone */}
      <View style={styles.group}>
        <Text style={styles.groupLabel}>Account Actions</Text>
        <SettingRow
          icon="🚪"
          label="Log out"
          destructive
          onPress={() =>
            Alert.alert('Log out', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Log out', style: 'destructive', onPress: logout },
            ])
          }
        />
        <SettingRow
          icon="🗑️"
          label={deleteAccountMutation.isPending ? 'Deleting...' : 'Delete account'}
          sublabel="Permanently removes all data"
          destructive
          onPress={!deleteAccountMutation.isPending ? handleDeleteAccount : undefined}
          right={deleteAccountMutation.isPending ? <ActivityIndicator color="#ef4444" /> : undefined}
        />
      </View>

      <Text style={styles.version}>Rendez v{Constants.expoConfig?.version ?? '1.0.0'} · Powered by REZ</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  group: { marginTop: 20, backgroundColor: '#fff', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  groupLabel: {
    fontSize: 11, fontWeight: '700', color: '#999',
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
    backgroundColor: '#f8f8f8',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingVertical: 14, borderBottomWidth: 1, borderColor: '#f5f5f5',
    backgroundColor: '#fff', gap: 14,
  },
  rowIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 15, color: '#1a1a2e', fontWeight: '500' },
  rowSublabel: { fontSize: 12, color: '#bbb', marginTop: 2 },
  destructiveText: { color: '#ef4444' },
  chevron: { fontSize: 20, color: '#ccc', fontWeight: '300' },
  version: { textAlign: 'center', color: '#ccc', fontSize: 12, marginTop: 32 },
});
