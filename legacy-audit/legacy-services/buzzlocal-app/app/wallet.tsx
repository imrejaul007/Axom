import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/theme';
import { CoinDisplay } from '@/components/ui';
import { useWalletStore, useAuthStore } from '@/store';
import { Transaction } from '@/types';

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', type: 'earn', amount: 25, description: 'Posted a new place', createdAt: '2026-05-12T10:00:00Z' },
  { id: '2', type: 'spend', amount: 100, description: 'Redeemed at Café Nero', createdAt: '2026-05-11T15:30:00Z' },
  { id: '3', type: 'earn', amount: 50, description: 'Event post bonus', createdAt: '2026-05-10T09:00:00Z' },
  { id: '4', type: 'earn', amount: 20, description: 'Post engagement bonus', createdAt: '2026-05-09T14:00:00Z' },
  { id: '5', type: 'earn', amount: 100, description: 'Welcome bonus', createdAt: '2026-05-08T12:00:00Z' },
];

export default function WalletScreen() {
  const router = useRouter();
  const { balance, transactions } = useWalletStore();
  const { user } = useAuthStore();

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionItem}>
      <View style={[
        styles.transactionIcon,
        { backgroundColor: item.type === 'earn' ? COLORS.success + '20' : COLORS.error + '20' }
      ]}>
        <Ionicons
          name={item.type === 'earn' ? 'arrow-down' : 'arrow-up'}
          size={18}
          color={item.type === 'earn' ? COLORS.success : COLORS.error}
        />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionDescription}>{item.description}</Text>
        <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <Text style={[
        styles.transactionAmount,
        { color: item.type === 'earn' ? COLORS.success : COLORS.error }
      ]}>
        {item.type === 'earn' ? '+' : '-'}{item.amount}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
        <TouchableOpacity>
          <Ionicons name="help-circle-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <View style={styles.balanceAmount}>
            <CoinDisplay amount={balance} size="large" />
          </View>
          <Text style={styles.balanceSubtext}>
            1 ReZ Coin = ₹1 at partner merchants
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: COLORS.success + '20' }]}>
              <Ionicons name="add" size={24} color={COLORS.success} />
            </View>
            <Text style={styles.actionText}>Add Coins</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: COLORS.primary + '20' }]}>
              <Ionicons name="gift" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.actionText}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIcon, { backgroundColor: COLORS.accent + '20' }]}>
              <Ionicons name="pricetag" size={24} color={COLORS.accent} />
            </View>
            <Text style={styles.actionText}>Offers</Text>
          </TouchableOpacity>
        </View>

        {/* Earn More Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>How to earn more</Text>
          </View>
          <View style={styles.earnList}>
            <View style={styles.earnItem}>
              <View style={styles.earnIcon}>
                <Ionicons name="document-text" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.earnInfo}>
                <Text style={styles.earnTitle}>Create posts</Text>
                <Text style={styles.earnDescription}>Earn 20-50 coins per post</Text>
              </View>
            </View>
            <View style={styles.earnItem}>
              <View style={styles.earnIcon}>
                <Ionicons name="location" size={20} color={COLORS.success} />
              </View>
              <View style={styles.earnInfo}>
                <Text style={styles.earnTitle}>Check-in at places</Text>
                <Text style={styles.earnDescription}>Earn 10 coins per check-in</Text>
              </View>
            </View>
            <View style={styles.earnItem}>
              <View style={styles.earnIcon}>
                <Ionicons name="calendar" size={20} color={COLORS.accent} />
              </View>
              <View style={styles.earnInfo}>
                <Text style={styles.earnTitle}>Attend events</Text>
                <Text style={styles.earnDescription}>Earn 30 coins per event</Text>
              </View>
            </View>
            <View style={styles.earnItem}>
              <View style={styles.earnIcon}>
                <Ionicons name="people" size={20} color={COLORS.info} />
              </View>
              <View style={styles.earnInfo}>
                <Text style={styles.earnTitle}>Refer friends</Text>
                <Text style={styles.earnDescription}>Earn 100 coins per referral</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {MOCK_TRANSACTIONS.map((transaction) => (
            <View key={transaction.id}>
              {renderTransaction({ item: transaction })}
            </View>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  balanceCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.coinGold + '30',
  },
  balanceLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },
  balanceAmount: {
    marginVertical: SPACING.md,
  },
  balanceSubtext: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  actionText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  section: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  seeAll: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  earnList: {},
  earnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  earnIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  earnInfo: {
    flex: 1,
  },
  earnTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  earnDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
});
