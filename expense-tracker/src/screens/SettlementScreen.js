import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getGroup, getGroupExpenses } from '../services/firebaseService';
import { computeNetBalances, minimizeTransactions } from '../utils/settlement';
import { formatCurrency } from '../utils/formatters';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import { colors, spacing, typography, radius, shadows } from '../theme';

export default function SettlementScreen({ route }) {
  const { groupId, groupName } = route.params;
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [members, setMembers] = useState([]);
  const [balances, setBalances] = useState({});

  useEffect(() => {
    async function load() {
      try {
        const [group, expenses] = await Promise.all([getGroup(groupId), getGroupExpenses(groupId)]);
        const mems = group?.members || [];
        setMembers(mems);
        const bals = computeNetBalances(expenses, mems);
        setBalances(bals);
        setTransactions(minimizeTransactions(bals));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [groupId]);

  function getMemberName(id) {
    return members.find((m) => m.id === id)?.name || id;
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const settled = transactions.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Hero */}
        {settled ? (
          <Card variant="primary" style={styles.heroCard}>
            <Ionicons name="checkmark-circle" size={48} color={colors.white} style={styles.heroIcon} />
            <Text style={styles.heroTitle}>All settled up!</Text>
            <Text style={styles.heroSub}>Everyone in {groupName} is even.</Text>
          </Card>
        ) : (
          <Card variant="primary" style={styles.heroCard}>
            <Text style={styles.heroSmall}>To settle {groupName}</Text>
            <Text style={styles.heroTitle}>{transactions.length} payment{transactions.length !== 1 ? 's' : ''} needed</Text>
            <Text style={styles.heroSub}>Minimum transactions to clear all debts</Text>
          </Card>
        )}

        {/* Suggested transactions */}
        {transactions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suggested Payments</Text>
            {transactions.map((tx, idx) => (
              <Card key={idx} style={styles.txCard}>
                <View style={styles.txRow}>
                  <View style={styles.txPerson}>
                    <Avatar name={getMemberName(tx.from)} id={tx.from} size={40} />
                    <Text style={styles.txName} numberOfLines={1}>{getMemberName(tx.from)}</Text>
                    <Text style={styles.txRole}>pays</Text>
                  </View>
                  <View style={styles.txArrow}>
                    <Text style={styles.txAmount}>{formatCurrency(tx.amount)}</Text>
                    <Ionicons name="arrow-forward" size={22} color={colors.primary} />
                  </View>
                  <View style={styles.txPerson}>
                    <Avatar name={getMemberName(tx.to)} id={tx.to} size={40} />
                    <Text style={styles.txName} numberOfLines={1}>{getMemberName(tx.to)}</Text>
                    <Text style={styles.txRole}>receives</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* All balances */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Balances</Text>
          {members.map((m) => {
            const bal = balances[m.id] || 0;
            const abs = Math.abs(bal);
            const isOwed = bal > 0.01;
            const owes = bal < -0.01;
            return (
              <View key={m.id} style={styles.balRow}>
                <Avatar name={m.name} id={m.id} size={36} />
                <View style={styles.balInfo}>
                  <Text style={styles.balName}>{m.name}</Text>
                  <Text
                    style={[
                      styles.balStatus,
                      { color: isOwed ? colors.success : owes ? colors.error : colors.textSecondary },
                    ]}
                  >
                    {abs < 0.01
                      ? 'Settled up'
                      : isOwed
                      ? `gets back ${formatCurrency(abs)}`
                      : `owes ${formatCurrency(abs)}`}
                  </Text>
                </View>
                <View
                  style={[
                    styles.balBadge,
                    { backgroundColor: isOwed ? colors.owesLight : owes ? colors.owedLight : colors.surfaceAlt },
                  ]}
                >
                  <Text
                    style={[
                      styles.balBadgeText,
                      { color: isOwed ? colors.success : owes ? colors.error : colors.textSecondary },
                    ]}
                  >
                    {abs < 0.01 ? '—' : (isOwed ? '+' : '-') + formatCurrency(abs).replace('-', '')}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.disclaimer}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textDisabled} />
          <Text style={styles.disclaimerText}>
            Balances are automatically recalculated when new expenses are added.
            Mark payments as settled by recording them as expenses.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  heroCard: { alignItems: 'center', marginBottom: spacing.lg, paddingVertical: spacing.xl },
  heroIcon: { marginBottom: spacing.sm },
  heroSmall: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: colors.white, marginBottom: 4 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.h3, marginBottom: spacing.sm },
  txCard: { marginBottom: spacing.sm, ...shadows.md },
  txRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  txPerson: { alignItems: 'center', flex: 1 },
  txName: { ...typography.small, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  txRole: { ...typography.caption, textAlign: 'center' },
  txArrow: { alignItems: 'center', flex: 1 },
  txAmount: { ...typography.bodyBold, color: colors.primary, marginBottom: 4 },
  balRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  balInfo: { flex: 1, marginLeft: spacing.md },
  balName: { ...typography.bodyBold },
  balStatus: { ...typography.small, marginTop: 2 },
  balBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  balBadgeText: { fontSize: 13, fontWeight: '700' },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  disclaimerText: { ...typography.caption, flex: 1, lineHeight: 16 },
});
