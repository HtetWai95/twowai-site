import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { createExpense, uploadReceiptImage } from '../../services/firebaseService';
import Button from '../../components/Button';
import Input from '../../components/Input';
import MemberSelector from '../../components/MemberSelector';
import Avatar from '../../components/Avatar';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { formatCurrency } from '../../utils/formatters';

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function AddExpenseScreen({ route, navigation }) {
  const { groupId, members = [], prefillItems = [], prefillTotal = null, receiptUri = null } = route.params || {};
  const { user, profile } = useAuth();

  const [title, setTitle] = useState('');
  const [paidBy, setPaidBy] = useState({ id: user.uid, name: profile?.name || 'Me' });
  const [items, setItems] = useState(
    prefillItems.length > 0
      ? prefillItems
      : [{ id: generateId(), name: '', price: '', participants: [] }]
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

  function addItem() {
    setItems((prev) => [...prev, { id: generateId(), name: '', price: '', participants: [] }]);
  }

  function removeItem(id) {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateItem(id, field, value) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  }

  function toggleParticipant(itemId, member) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const exists = item.participants.some((p) => p.id === member.id);
        const participants = exists
          ? item.participants.filter((p) => p.id !== member.id)
          : [...item.participants, { id: member.id, name: member.name }];
        return { ...item, participants };
      })
    );
  }

  function selectAllForItem(itemId) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const allSelected = item.participants.length === members.length;
        return {
          ...item,
          participants: allSelected ? [] : members.map((m) => ({ id: m.id, name: m.name })),
        };
      })
    );
  }

  function validate() {
    const e = {};
    if (!title.trim()) e.title = 'Expense title is required';
    if (items.some((i) => !i.name.trim())) e.items = 'All items need a name';
    if (items.some((i) => !i.price || isNaN(parseFloat(i.price)) || parseFloat(i.price) <= 0))
      e.price = 'All items need a valid price';
    if (items.some((i) => i.participants.length === 0))
      e.participants = 'Each item must have at least one participant';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      let receiptImageUrl = null;
      const expenseId = generateId();
      if (receiptUri) {
        receiptImageUrl = await uploadReceiptImage(receiptUri, expenseId).catch(() => null);
      }

      const parsedItems = items.map((item) => ({
        id: item.id,
        name: item.name.trim(),
        price: parseFloat(item.price),
        participants: item.participants,
      }));

      await createExpense({
        groupId,
        title: title.trim(),
        totalAmount,
        paidBy,
        date: new Date(),
        items: parsedItems,
        receiptImageUrl,
      });

      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Could not save expense. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          {/* Receipt scan shortcut */}
          <TouchableOpacity
            style={styles.scanBanner}
            onPress={() => navigation.navigate('ReceiptScan', { groupId, members, onScan: route.params?.onScan })}
          >
            <Ionicons name="camera" size={20} color={colors.primary} />
            <Text style={styles.scanText}>Scan a receipt to auto-fill items</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>

          <Input
            label="Expense Title"
            value={title}
            onChangeText={(t) => { setTitle(t); setErrors((e) => ({ ...e, title: '' })); }}
            placeholder="e.g. Dinner at Nobu"
            autoCapitalize="sentences"
            error={errors.title}
          />

          {/* Paid By */}
          <Text style={styles.label}>Paid By</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.paidByRow}>
            {members.map((m) => {
              const selected = paidBy.id === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.paidByChip, selected && styles.paidBySelected]}
                  onPress={() => setPaidBy({ id: m.id, name: m.name })}
                >
                  <Avatar name={m.name} id={m.id} size={26} />
                  <Text style={[styles.paidByName, selected && styles.paidByNameSelected]}>
                    {m.id === user.uid ? 'You' : m.name?.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Items */}
          <View style={styles.itemsHeader}>
            <Text style={styles.label}>Items</Text>
            <Text style={styles.totalLabel}>{formatCurrency(totalAmount)}</Text>
          </View>

          {errors.items && <Text style={styles.errorText}>{errors.items}</Text>}
          {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
          {errors.participants && <Text style={styles.errorText}>{errors.participants}</Text>}

          {items.map((item, idx) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemTopRow}>
                <View style={styles.itemNameWrap}>
                  <TextInput
                    style={styles.itemNameInput}
                    value={item.name}
                    onChangeText={(v) => updateItem(item.id, 'name', v)}
                    placeholder={`Item ${idx + 1}`}
                    placeholderTextColor={colors.textDisabled}
                    autoCapitalize="sentences"
                  />
                </View>
                <View style={styles.priceWrap}>
                  <Text style={styles.priceDollar}>$</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={item.price.toString()}
                    onChangeText={(v) => updateItem(item.id, 'price', v)}
                    placeholder="0.00"
                    placeholderTextColor={colors.textDisabled}
                    keyboardType="decimal-pad"
                  />
                </View>
                <TouchableOpacity
                  onPress={() => removeItem(item.id)}
                  style={styles.removeBtn}
                  disabled={items.length === 1}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={items.length === 1 ? colors.textDisabled : colors.error}
                  />
                </TouchableOpacity>
              </View>

              {/* Participant assignment */}
              <View style={styles.participantsRow}>
                <Text style={styles.participantsLabel}>
                  Split between ({item.participants.length}/{members.length}):
                </Text>
                <TouchableOpacity onPress={() => selectAllForItem(item.id)}>
                  <Text style={styles.selectAll}>
                    {item.participants.length === members.length ? 'Clear all' : 'Select all'}
                  </Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.participantChips}>
                  {members.map((m) => {
                    const selected = item.participants.some((p) => p.id === m.id);
                    return (
                      <TouchableOpacity
                        key={m.id}
                        style={[styles.participantChip, selected && styles.participantChipSelected]}
                        onPress={() => toggleParticipant(item.id, m)}
                      >
                        <Avatar name={m.name} id={m.id} size={22} />
                        <Text style={[styles.participantName, selected && styles.participantNameSelected]}>
                          {m.id === user.uid ? 'You' : m.name?.split(' ')[0]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              {item.participants.length > 0 && parseFloat(item.price) > 0 && (
                <Text style={styles.shareHint}>
                  {formatCurrency(parseFloat(item.price) / item.participants.length)} each
                </Text>
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.addItemText}>Add item</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalText}>Total</Text>
            <Text style={styles.totalAmount}>{formatCurrency(totalAmount)}</Text>
          </View>
          <Button title="Save Expense" onPress={handleSave} loading={saving} size="lg" />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: 20 },
  scanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  scanText: { flex: 1, ...typography.bodyBold, color: colors.primary },
  label: { ...typography.label, marginBottom: spacing.sm },
  paidByRow: { marginBottom: spacing.lg },
  paidByChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
  },
  paidBySelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  paidByName: { ...typography.small, color: colors.textSecondary },
  paidByNameSelected: { color: colors.primary, fontWeight: '600' },
  itemsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  totalLabel: { ...typography.bodyBold, color: colors.primary },
  errorText: { ...typography.small, color: colors.error, marginBottom: spacing.sm },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  itemTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  itemNameWrap: { flex: 1 },
  itemNameInput: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 4,
  },
  priceWrap: { flexDirection: 'row', alignItems: 'center', marginLeft: spacing.sm },
  priceDollar: { ...typography.body, color: colors.textSecondary, marginRight: 2 },
  priceInput: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    width: 70,
    textAlign: 'right',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 4,
  },
  removeBtn: { padding: spacing.xs, marginLeft: spacing.xs },
  participantsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  participantsLabel: { ...typography.caption },
  selectAll: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  participantChips: { flexDirection: 'row', paddingBottom: spacing.xs },
  participantChip: {
    alignItems: 'center',
    marginRight: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    minWidth: 48,
  },
  participantChipSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  participantName: { ...typography.caption, marginTop: 2, color: colors.textSecondary },
  participantNameSelected: { color: colors.primary, fontWeight: '600' },
  shareHint: { ...typography.caption, color: colors.success, textAlign: 'right', marginTop: spacing.xs },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  addItemText: { ...typography.bodyBold, color: colors.primary },
  footer: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  totalText: { ...typography.body, color: colors.textSecondary },
  totalAmount: { ...typography.h3, color: colors.primary },
});
