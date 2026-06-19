/**
 * Couple Mode Screen
 * Shared timeline, bucket list, expenses, goals
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#6366f1',
  accent: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  background: '#0f0f23',
  card: '#1a1a2e',
  text: '#ffffff',
  textSecondary: '#a1a1aa',
};

interface Milestone {
  id: string;
  type: 'match' | 'first_chat' | 'first_call' | 'first_meet' | 'anniversary' | 'trip' | 'gift';
  title: string;
  date: string;
  photo?: string;
}

interface BucketListItem {
  id: string;
  title: string;
  category: 'travel' | 'food' | 'activity' | 'adventure';
  completed: boolean;
  dueDate?: string;
}

interface SharedExpense {
  id: string;
  title: string;
  amount: number;
  paidBy: 'you' | 'partner';
  split: 'equal' | 'custom';
  settled: boolean;
}

export default function CoupleModeScreen() {
  const [activeTab, setActiveTab] = useState<'timeline' | 'bucket' | 'expenses' | 'goals'>('timeline');
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: '1', type: 'match', title: 'Matched!', date: '2024-01-15' },
    { id: '2', type: 'first_chat', title: 'First conversation', date: '2024-01-16' },
    { id: '3', type: 'first_call', title: 'First video call', date: '2024-01-20' },
    { id: '4', type: 'first_meet', title: 'First date - Coffee at Blue Tokai', date: '2024-02-01' },
    { id: '5', type: 'trip', title: 'Weekend trip to Goa', date: '2024-03-15', photo: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2' },
  ]);

  const [bucketList, setBucketList] = useState<BucketListItem[]>([
    { id: '1', title: 'Watch sunset at Marine Drive', category: 'travel', completed: true },
    { id: '2', title: 'Try that new Japanese restaurant', category: 'food', completed: false },
    { id: '3', title: 'Go paragliding', category: 'adventure', completed: false },
    { id: '4', title: 'Attend a concert together', category: 'activity', completed: true },
    { id: '5', title: 'Road trip to Munnar', category: 'travel', completed: false },
  ]);

  const [expenses, setExpenses] = useState<SharedExpense[]>([
    { id: '1', title: 'Goa trip hotel', amount: 12000, paidBy: 'you', split: 'equal', settled: false },
    { id: '2', title: 'Dinner at Sushiya', amount: 2400, paidBy: 'partner', split: 'equal', settled: true },
    { id: '3', title: 'Movie tickets', amount: 800, paidBy: 'you', split: 'equal', settled: false },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState('');

  const getMilestoneIcon = (type: string) => {
    const icons: Record<string, string> = {
      match: 'heart',
      first_chat: 'chatbubble',
      first_call: 'videocam',
      first_meet: 'location',
      anniversary: 'calendar',
      trip: 'airplane',
      gift: 'gift',
    };
    return icons[type] || 'heart';
  };

  const getMilestoneColor = (type: string) => {
    const colors: Record<string, string> = {
      match: COLORS.error,
      first_chat: COLORS.primary,
      first_call: COLORS.accent,
      first_meet: COLORS.success,
      anniversary: COLORS.warning,
      trip: '#06b6d4',
      gift: '#ec4899',
    };
    return colors[type] || COLORS.primary;
  };

  const calculateBalance = () => {
    let balance = 0;
    expenses.forEach((exp) => {
      if (!exp.settled) {
        const half = exp.amount / 2;
        if (exp.paidBy === 'you') {
          balance += half;
        } else {
          balance -= half;
        }
      }
    });
    return Math.abs(balance);
  };

  const whoOwes = () => {
    let balance = 0;
    expenses.forEach((exp) => {
      if (!exp.settled) {
        const half = exp.amount / 2;
        if (exp.paidBy === 'you') {
          balance += half;
        } else {
          balance -= half;
        }
      }
    });
    return balance > 0 ? 'Partner owes you' : balance < 0 ? 'You owe partner' : 'All settled!';
  };

  const renderTimeline = () => (
    <View>
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{milestones.length}</Text>
          <Text style={styles.statLabel}>Milestones</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{bucketList.filter(b => b.completed).length}</Text>
          <Text style={styles.statLabel}>Bucket List</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>💕</Text>
          <Text style={styles.statLabel}>Together</Text>
        </View>
      </View>

      {/* Timeline */}
      <View style={styles.timeline}>
        {milestones.map((milestone, index) => (
          <View key={milestone.id} style={styles.timelineItem}>
            <View style={styles.timelineLeft}>
              <View style={[styles.timelineDot, { backgroundColor: getMilestoneColor(milestone.type) }]}>
                <Ionicons name={getMilestoneIcon(milestone.type) as any} size={16} color="#fff" />
              </View>
              {index < milestones.length - 1 && <View style={styles.timelineLine} />}
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.milestoneTitle}>{milestone.title}</Text>
              <Text style={styles.milestoneDate}>
                {new Date(milestone.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
              {milestone.photo && (
                <View style={styles.milestonePhoto}>
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="image" size={24} color={COLORS.textSecondary} />
                  </View>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderBucketList = () => (
    <View>
      {/* Progress */}
      <View style={styles.bucketProgress}>
        <View style={styles.progressBar}>
          <View style={[
            styles.progressFill,
            { width: `${(bucketList.filter(b => b.completed).length / bucketList.length) * 100}%` }
          ]} />
        </View>
        <Text style={styles.progressText}>
          {bucketList.filter(b => b.completed).length} of {bucketList.length} completed
        </Text>
      </View>

      {/* Categories */}
      <View style={styles.categories}>
        {['travel', 'food', 'activity', 'adventure'].map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryChip, { backgroundColor: COLORS.card }]}
          >
            <Text style={styles.categoryText}>
              {cat === 'travel' && '✈️ '}
              {cat === 'food' && '🍽️ '}
              {cat === 'activity' && '🎭 '}
              {cat === 'adventure' && '🏔️ '}
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Items */}
      {bucketList.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.bucketItem}
          onPress={() => {
            setBucketList(bucketList.map(b =>
              b.id === item.id ? { ...b, completed: !b.completed } : b
            ));
          }}
        >
          <View style={[styles.bucketCheck, item.completed && styles.bucketCheckActive]}>
            {item.completed && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={[styles.bucketTitle, item.completed && styles.bucketTitleDone]}>
            {item.title}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={styles.addBucketButton}
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="add-circle" size={20} color={COLORS.primary} />
        <Text style={styles.addBucketText}>Add to bucket list</Text>
      </TouchableOpacity>
    </View>
  );

  const renderExpenses = () => (
    <View>
      {/* Balance Summary */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>{whoOwes()}</Text>
        <Text style={styles.balanceAmount}>₹{calculateBalance()}</Text>
        {calculateBalance() > 0 && (
          <TouchableOpacity style={styles.settleButton}>
            <Text style={styles.settleButtonText}>Settle Up</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Expenses */}
      <Text style={styles.sectionTitle}>Shared Expenses</Text>
      {expenses.map((expense) => (
        <View key={expense.id} style={styles.expenseItem}>
          <View style={styles.expenseLeft}>
            <Text style={styles.expenseTitle}>{expense.title}</Text>
            <Text style={styles.expenseMeta}>
              Paid by {expense.paidBy === 'you' ? 'you' : 'partner'}
              {expense.settled && ' • Settled'}
            </Text>
          </View>
          <View style={styles.expenseRight}>
            <Text style={styles.expenseAmount}>₹{expense.amount}</Text>
            {!expense.settled && (
              <TouchableOpacity
                style={styles.markSettled}
                onPress={() => {
                  setExpenses(expenses.map(e =>
                    e.id === expense.id ? { ...e, settled: true } : e
                  ));
                }}
              >
                <Text style={styles.markSettledText}>Mark Settled</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.addExpenseButton}>
        <Ionicons name="add-circle" size={20} color={COLORS.primary} />
        <Text style={styles.addExpenseText}>Add expense</Text>
      </TouchableOpacity>
    </View>
  );

  const renderGoals = () => (
    <View>
      <View style={styles.goalsHeader}>
        <View style={styles.goalStat}>
          <Text style={styles.goalValue}>3</Text>
          <Text style={styles.goalLabel}>Active Goals</Text>
        </View>
        <View style={styles.goalStat}>
          <Text style={styles.goalValue}>2</Text>
          <Text style={styles.goalLabel}>Completed</Text>
        </View>
      </View>

      {[
        { title: 'Dream Vacation to Japan', progress: 65, target: '₹2,50,000', current: '₹1,62,500' },
        { title: 'New apartment fund', progress: 30, target: '₹10,00,000', current: '₹3,00,000' },
        { title: 'Anniversary dinner', progress: 90, target: '₹15,000', current: '₹13,500' },
      ].map((goal, index) => (
        <View key={index} style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            <Text style={styles.goalProgress}>{goal.progress}%</Text>
          </View>
          <View style={styles.goalProgressBar}>
            <View style={[styles.goalProgressFill, { width: `${goal.progress}%` }]} />
          </View>
          <View style={styles.goalAmounts}>
            <Text style={styles.goalCurrent}>{goal.current}</Text>
            <Text style={styles.goalTarget}>of {goal.target}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.coupleAvatars}>
            <View style={[styles.avatar, styles.avatarLeft]} />
            <View style={[styles.avatar, styles.avatarRight]} />
          </View>
          <Text style={styles.headerTitle}>You & Partner</Text>
          <Text style={styles.headerSubtitle}>Together since Feb 1, 2024</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { key: 'timeline', icon: 'time', label: 'Timeline' },
          { key: 'bucket', icon: 'checkbox', label: 'Bucket List' },
          { key: 'expenses', icon: 'wallet', label: 'Expenses' },
          { key: 'goals', icon: 'flag', label: 'Goals' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.key ? COLORS.primary : COLORS.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'timeline' && renderTimeline()}
        {activeTab === 'bucket' && renderBucketList()}
        {activeTab === 'expenses' && renderExpenses()}
        {activeTab === 'goals' && renderGoals()}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add to Bucket List</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="What's on your bucket list?"
              placeholderTextColor={COLORS.textSecondary}
              value={newItem}
              onChangeText={setNewItem}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalAdd}
                onPress={() => {
                  if (newItem.trim()) {
                    setBucketList([...bucketList, {
                      id: Date.now().toString(),
                      title: newItem,
                      category: 'activity',
                      completed: false,
                    }]);
                    setNewItem('');
                    setShowAddModal(false);
                  }
                }}
              >
                <Text style={styles.modalAddText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  coupleAvatars: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
  },
  avatarLeft: {
    marginRight: -8,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  avatarRight: {
    backgroundColor: COLORS.accent,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.card,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 32,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.card,
    marginTop: 8,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 16,
    paddingBottom: 16,
  },
  milestoneTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  milestoneDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  milestonePhoto: {
    marginTop: 8,
  },
  photoPlaceholder: {
    width: 120,
    height: 80,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bucketProgress: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.card,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  categories: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 13,
    color: COLORS.text,
  },
  bucketItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  bucketCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bucketCheckActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  bucketTitle: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  bucketTitleDone: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
  addBucketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  addBucketText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  balanceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    marginVertical: 8,
  },
  settleButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  settleButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  expenseLeft: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  expenseMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  markSettled: {
    marginTop: 4,
  },
  markSettledText: {
    fontSize: 12,
    color: COLORS.success,
  },
  addExpenseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  addExpenseText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  goalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  goalStat: {
    alignItems: 'center',
  },
  goalValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  goalLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  goalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  goalProgress: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  goalProgressBar: {
    height: 6,
    backgroundColor: COLORS.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  goalAmounts: {
    flexDirection: 'row',
    marginTop: 8,
  },
  goalCurrent: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  goalTarget: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  modalCancelText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalAdd: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  modalAddText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
