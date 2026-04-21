import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { formatCurrency, formatRelativeDate } from '../utils/formatters';
import Avatar from './Avatar';

export default function ExpenseCard({ expense, currentUserId, onPress }) {
  const paidByMe = expense.paidBy?.id === currentUserId;
  const itemCount = expense.items?.length || 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconWrap}>
        <Ionicons name="receipt-outline" size={22} color={colors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{expense.title}</Text>
        <View style={styles.meta}>
          <Avatar name={expense.paidBy?.name} id={expense.paidBy?.id} size={16} />
          <Text style={styles.metaText} numberOfLines={1}>
            {' '}{paidByMe ? 'You' : expense.paidBy?.name} paid
            {itemCount > 0 ? ` · ${itemCount} item${itemCount !== 1 ? 's' : ''}` : ''}
          </Text>
        </View>
        <Text style={styles.date}>{formatRelativeDate(expense.date)}</Text>
      </View>
      <Text style={styles.amount}>{formatCurrency(expense.totalAmount)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  content: { flex: 1, marginRight: spacing.sm },
  title: { ...typography.bodyBold, marginBottom: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  metaText: { ...typography.small, flex: 1 },
  date: { ...typography.caption },
  amount: { ...typography.bodyBold, color: colors.primary },
});
