import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getExpense } from '../../services/firebaseService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Card from '../../components/Card';
import Avatar from '../../components/Avatar';
import { colors, spacing, typography, radius, shadows } from '../../theme';

export default function ExpenseDetailScreen({ route, navigation }) {
  const { expenseId } = route.params;
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getExpense(expenseId)
      .then(setExpense)
      .finally(() => setLoading(false));
  }, [expenseId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={styles.center}>
        <Text style={typography.body}>Expense not found.</Text>
      </View>
    );
  }

  const items = expense.items || [];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <Card variant="primary" style={styles.headerCard}>
          <Text style={styles.cardLabel}>Total Amount</Text>
          <Text style={styles.amount}>{formatCurrency(expense.totalAmount)}</Text>
          <Text style={styles.title}>{expense.title}</Text>
          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.metaText}>{formatDate(expense.date)}</Text>
            </View>
          </View>
        </Card>

        {/* Paid by */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Paid by</Text>
          <View style={styles.paidByRow}>
            <Avatar name={expense.paidBy?.name} id={expense.paidBy?.id} size={40} />
            <View style={styles.paidByInfo}>
              <Text style={styles.paidByName}>{expense.paidBy?.name}</Text>
              <Text style={styles.paidByNote}>covered the full amount</Text>
            </View>
            <Text style={styles.paidAmount}>{formatCurrency(expense.totalAmount)}</Text>
          </View>
        </Card>

        {/* Receipt image */}
        {expense.receiptImageUrl && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Receipt</Text>
            <Image
              source={{ uri: expense.receiptImageUrl }}
              style={styles.receipt}
              resizeMode="contain"
            />
          </Card>
        )}

        {/* Items breakdown */}
        {items.length > 0 && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Items</Text>
            {items.map((item, idx) => (
              <View key={item.id || idx} style={[styles.itemRow, idx < items.length - 1 && styles.itemBorder]}>
                <View style={styles.itemMain}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <View style={styles.participantAvatars}>
                    {(item.participants || []).map((p) => (
                      <View key={p.id} style={styles.partAvatarWrap}>
                        <Avatar name={p.name} id={p.id} size={20} />
                      </View>
                    ))}
                    {(item.participants || []).length > 0 && (
                      <Text style={styles.splitHint}>
                        {formatCurrency(item.price / item.participants.length)} each
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>{formatCurrency(expense.totalAmount)}</Text>
            </View>
          </Card>
        )}

        {/* Per-person breakdown */}
        {items.length > 0 && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Per Person</Text>
            {computePersonTotals(items).map(({ id, name, total }) => (
              <View key={id} style={styles.personRow}>
                <Avatar name={name} id={id} size={32} />
                <Text style={styles.personName}>{name}</Text>
                <Text style={styles.personAmount}>{formatCurrency(total)}</Text>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function computePersonTotals(items) {
  const totals = {};
  for (const item of items) {
    if (!item.participants || item.participants.length === 0) continue;
    const share = item.price / item.participants.length;
    for (const p of item.participants) {
      if (!totals[p.id]) totals[p.id] = { id: p.id, name: p.name, total: 0 };
      totals[p.id].total += share;
    }
  }
  return Object.values(totals).sort((a, b) => b.total - a.total);
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  headerCard: { marginBottom: spacing.md },
  cardLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500', marginBottom: 4 },
  amount: { fontSize: 32, fontWeight: '800', color: colors.white, marginBottom: 4 },
  title: { fontSize: 16, fontWeight: '600', color: colors.white, marginBottom: spacing.sm },
  meta: { flexDirection: 'row', gap: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  section: { marginBottom: spacing.md },
  sectionTitle: { ...typography.label, marginBottom: spacing.md },
  paidByRow: { flexDirection: 'row', alignItems: 'center' },
  paidByInfo: { flex: 1, marginLeft: spacing.md },
  paidByName: { ...typography.bodyBold },
  paidByNote: { ...typography.small },
  paidAmount: { ...typography.bodyBold, color: colors.primary },
  receipt: { width: '100%', height: 300, borderRadius: radius.md, marginTop: spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing.sm },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  itemMain: { flex: 1 },
  itemName: { ...typography.body, marginBottom: 4 },
  participantAvatars: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  partAvatarWrap: { marginRight: -4 },
  splitHint: { ...typography.caption, marginLeft: spacing.sm },
  itemPrice: { ...typography.bodyBold, color: colors.text },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: { ...typography.bodyBold },
  totalAmount: { ...typography.bodyBold, color: colors.primary, fontSize: 17 },
  personRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  personName: { flex: 1, ...typography.body, marginLeft: spacing.md },
  personAmount: { ...typography.bodyBold, color: colors.primary },
});
