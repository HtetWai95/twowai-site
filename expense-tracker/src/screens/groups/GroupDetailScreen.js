import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getGroup, getGroupExpenses, deleteExpense } from '../../services/firebaseService';
import { computeNetBalances, minimizeTransactions } from '../../utils/settlement';
import { formatCurrency } from '../../utils/formatters';
import Card from '../../components/Card';
import ExpenseCard from '../../components/ExpenseCard';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import { colors, spacing, typography, radius, shadows } from '../../theme';

export default function GroupDetailScreen({ route, navigation }) {
  const { groupId } = route.params;
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [g, exps] = await Promise.all([getGroup(groupId), getGroupExpenses(groupId)]);
      setGroup(g);
      setExpenses(exps);
      if (g?.members) {
        setBalances(computeNetBalances(exps, g.members));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  function handleDeleteExpense(expense) {
    if (expense.paidBy?.id !== user.uid) {
      Alert.alert('Permission Denied', 'Only the person who paid can delete this expense.');
      return;
    }
    Alert.alert('Delete Expense', `Delete "${expense.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteExpense(expense.id);
          fetchData();
        },
      },
    ]);
  }

  const myBalance = balances[user.uid] || 0;
  const members = group?.members || [];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />}
      >
        {/* Summary card */}
        <Card variant="primary" style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Your balance</Text>
          <Text style={styles.summaryAmount}>
            {myBalance === 0
              ? 'All settled up'
              : myBalance > 0
              ? `You are owed ${formatCurrency(myBalance)}`
              : `You owe ${formatCurrency(-myBalance)}`}
          </Text>
          <View style={styles.memberAvatars}>
            {members.slice(0, 5).map((m) => (
              <View key={m.id} style={styles.avatarWrap}>
                <Avatar name={m.name} id={m.id} size={32} />
              </View>
            ))}
            {members.length > 5 && (
              <View style={[styles.avatarWrap, styles.moreChip]}>
                <Text style={styles.moreText}>+{members.length - 5}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Balances */}
        {members.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Balances</Text>
            {members.map((m) => {
              const bal = balances[m.id] || 0;
              const isMe = m.id === user.uid;
              const isOwed = bal > 0;
              const absBalance = Math.abs(bal);
              return (
                <View key={m.id} style={styles.balanceRow}>
                  <Avatar name={m.name} id={m.id} size={36} />
                  <View style={styles.balanceInfo}>
                    <Text style={styles.balanceName}>{isMe ? 'You' : m.name}</Text>
                    <Text style={[styles.balanceAmount, { color: isOwed ? colors.success : bal < 0 ? colors.error : colors.textSecondary }]}>
                      {Math.abs(bal) < 0.01
                        ? 'Settled up'
                        : isOwed
                        ? `gets back ${formatCurrency(absBalance)}`
                        : `owes ${formatCurrency(absBalance)}`}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Settle Up CTA */}
        {Object.values(balances).some((b) => Math.abs(b) > 0.01) && (
          <Button
            title="Settle Up"
            variant="secondary"
            icon={<Ionicons name="swap-horizontal" size={18} color={colors.primary} />}
            onPress={() => navigation.navigate('Settlement', { groupId, groupName: group?.name })}
            style={styles.settleBtn}
          />
        )}

        {/* Expenses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Expenses</Text>
            <TouchableOpacity
              style={styles.addExpenseBtn}
              onPress={() => navigation.navigate('AddExpense', { groupId, members: group?.members || [] })}
            >
              <Ionicons name="add" size={18} color={colors.white} />
              <Text style={styles.addExpenseText}>Add</Text>
            </TouchableOpacity>
          </View>

          {expenses.length === 0 ? (
            <View style={styles.emptyExpenses}>
              <Ionicons name="receipt-outline" size={40} color={colors.textDisabled} />
              <Text style={styles.emptyText}>No expenses yet. Add one to get started.</Text>
            </View>
          ) : (
            expenses.map((expense) => (
              <TouchableOpacity
                key={expense.id}
                onLongPress={() => handleDeleteExpense(expense)}
                activeOpacity={1}
              >
                <ExpenseCard
                  expense={expense}
                  currentUserId={user.uid}
                  onPress={() => navigation.navigate('ExpenseDetail', { expenseId: expense.id })}
                />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  summaryCard: { marginBottom: spacing.lg },
  summaryLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500', marginBottom: 4 },
  summaryAmount: { fontSize: 22, fontWeight: '700', color: colors.white, marginBottom: spacing.md },
  memberAvatars: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: { marginRight: -8 },
  moreChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: { fontSize: 11, color: colors.white, fontWeight: '600' },
  section: { marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionTitle: { ...typography.h3 },
  addExpenseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    gap: 4,
  },
  addExpenseText: { color: colors.white, fontWeight: '600', fontSize: 13 },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  balanceInfo: { flex: 1, marginLeft: spacing.md },
  balanceName: { ...typography.bodyBold },
  balanceAmount: { ...typography.small, marginTop: 2 },
  settleBtn: { marginBottom: spacing.lg },
  emptyExpenses: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyText: { ...typography.small, textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: spacing.lg },
});
