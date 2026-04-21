import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { scanReceipt } from '../../services/ocrService';
import Button from '../../components/Button';
import Avatar from '../../components/Avatar';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { formatCurrency } from '../../utils/formatters';

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function ReceiptScanScreen({ route, navigation }) {
  const { groupId, members = [] } = route.params || {};

  const [imageUri, setImageUri] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [items, setItems] = useState([]);
  const [scanned, setScanned] = useState(false);

  async function pickImage(fromCamera) {
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.85, base64: false })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.85, mediaTypes: ImagePicker.MediaTypeOptions.Images });

    if (result.canceled) return;
    const uri = result.assets[0].uri;
    setImageUri(uri);
    processReceipt(uri);
  }

  async function processReceipt(uri) {
    setScanning(true);
    setScanned(false);
    try {
      const { items: parsed, total } = await scanReceipt(uri);
      if (parsed.length === 0) {
        Alert.alert(
          'No Items Found',
          'The OCR could not detect items. You can add them manually.',
          [{ text: 'OK' }]
        );
        setItems([{ id: generateId(), name: '', price: '', participants: [] }]);
      } else {
        setItems(parsed.map((i) => ({ ...i, price: i.price.toString() })));
      }
      setScanned(true);
    } catch (err) {
      if (err.message.includes('not configured')) {
        Alert.alert(
          'OCR Not Configured',
          'Add your Google Vision API key in src/firebase/config.js to enable receipt scanning.\n\nYou can still enter items manually.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Scan Failed', err.message || 'Could not process the receipt image.');
      }
      setItems([{ id: generateId(), name: '', price: '', participants: [] }]);
      setScanned(true);
    } finally {
      setScanning(false);
    }
  }

  function addItem() {
    setItems((prev) => [...prev, { id: generateId(), name: '', price: '', participants: [] }]);
  }

  function removeItem(id) {
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
        return {
          ...item,
          participants: exists
            ? item.participants.filter((p) => p.id !== member.id)
            : [...item.participants, { id: member.id, name: member.name }],
        };
      })
    );
  }

  function handleContinue() {
    const validItems = items.filter(
      (i) => i.name.trim() && i.price && !isNaN(parseFloat(i.price)) && parseFloat(i.price) > 0
    );
    if (validItems.length === 0) {
      Alert.alert('No Items', 'Add at least one item with a name and price.');
      return;
    }
    navigation.navigate('AddExpense', {
      groupId,
      members,
      prefillItems: validItems.map((i) => ({ ...i, price: i.price.toString() })),
      receiptUri: imageUri,
    });
  }

  const total = items.reduce((s, i) => s + (parseFloat(i.price) || 0), 0);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          {/* Image section */}
          {!imageUri ? (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="receipt-outline" size={48} color={colors.textDisabled} />
              <Text style={styles.placeholderTitle}>Scan a receipt</Text>
              <Text style={styles.placeholderSub}>Take a photo or choose from your gallery</Text>
              <View style={styles.pickRow}>
                <Button
                  title="Camera"
                  icon={<Ionicons name="camera-outline" size={18} color={colors.white} />}
                  onPress={() => pickImage(true)}
                  style={styles.pickBtn}
                />
                <Button
                  title="Gallery"
                  variant="secondary"
                  icon={<Ionicons name="image-outline" size={18} color={colors.primary} />}
                  onPress={() => pickImage(false)}
                  style={styles.pickBtn}
                />
              </View>
            </View>
          ) : (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.receiptImage} resizeMode="cover" />
              <TouchableOpacity style={styles.changePhoto} onPress={() => { setImageUri(null); setItems([]); setScanned(false); }}>
                <Ionicons name="refresh" size={16} color={colors.white} />
                <Text style={styles.changePhotoText}>Change</Text>
              </TouchableOpacity>
              {scanning && (
                <View style={styles.scanOverlay}>
                  <ActivityIndicator size="large" color={colors.white} />
                  <Text style={styles.scanningText}>Extracting items…</Text>
                </View>
              )}
            </View>
          )}

          {/* Items editor */}
          {(scanned || items.length > 0) && !scanning && (
            <View style={styles.itemsSection}>
              <View style={styles.itemsHeader}>
                <Text style={styles.sectionTitle}>
                  {scanned ? 'Review & Edit Items' : 'Items'}
                </Text>
                {scanned && <Text style={styles.ocrNote}>OCR results — please verify</Text>}
              </View>

              {/* Two-panel layout: items left, members right */}
              {items.map((item, idx) => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemTopRow}>
                    <TextInput
                      style={styles.itemName}
                      value={item.name}
                      onChangeText={(v) => updateItem(item.id, 'name', v)}
                      placeholder={`Item ${idx + 1}`}
                      placeholderTextColor={colors.textDisabled}
                      autoCapitalize="sentences"
                    />
                    <View style={styles.priceRow}>
                      <Text style={styles.priceDollar}>$</Text>
                      <TextInput
                        style={styles.priceInput}
                        value={item.price.toString()}
                        onChangeText={(v) => updateItem(item.id, 'price', v)}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        placeholderTextColor={colors.textDisabled}
                      />
                    </View>
                    <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.delBtn}>
                      <Ionicons name="close-circle" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.assignLabel}>Assign to:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.memberChips}>
                      {members.map((m) => {
                        const sel = item.participants.some((p) => p.id === m.id);
                        return (
                          <TouchableOpacity
                            key={m.id}
                            style={[styles.memberChip, sel && styles.memberChipSel]}
                            onPress={() => toggleParticipant(item.id, m)}
                          >
                            <Avatar name={m.name} id={m.id} size={20} />
                            <Text style={[styles.memberChipName, sel && styles.memberChipNameSel]}>
                              {m.name?.split(' ')[0]}
                            </Text>
                            {sel && <Ionicons name="checkmark" size={10} color={colors.primary} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>

                  {item.participants.length > 0 && parseFloat(item.price) > 0 && (
                    <Text style={styles.shareNote}>
                      {formatCurrency(parseFloat(item.price) / item.participants.length)} each
                    </Text>
                  )}
                </View>
              ))}

              <TouchableOpacity style={styles.addBtn} onPress={addItem}>
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={styles.addBtnText}>Add item manually</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {(scanned || items.length > 0) && !scanning && (
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>{formatCurrency(total)}</Text>
            </View>
            <Button title="Continue to Expense" onPress={handleContinue} size="lg" />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: 20 },
  imagePlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: spacing.xxl,
    marginBottom: spacing.lg,
  },
  placeholderTitle: { ...typography.h3, marginTop: spacing.md, marginBottom: spacing.xs },
  placeholderSub: { ...typography.small, textAlign: 'center', marginBottom: spacing.lg },
  pickRow: { flexDirection: 'row', gap: spacing.md },
  pickBtn: { flex: 1 },
  imageContainer: { position: 'relative', borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.lg, height: 220 },
  receiptImage: { width: '100%', height: '100%' },
  changePhoto: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: 4,
  },
  changePhotoText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  scanningText: { color: colors.white, fontWeight: '600' },
  itemsSection: { marginBottom: spacing.sm },
  itemsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionTitle: { ...typography.h3 },
  ocrNote: { ...typography.caption, color: colors.warning },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  itemTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  itemName: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginLeft: spacing.sm },
  priceDollar: { color: colors.textSecondary, marginRight: 2 },
  priceInput: { fontSize: 15, fontWeight: '700', color: colors.primary, width: 65, textAlign: 'right', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 4 },
  delBtn: { padding: spacing.xs, marginLeft: spacing.xs },
  assignLabel: { ...typography.caption, marginBottom: spacing.xs },
  memberChips: { flexDirection: 'row', paddingBottom: 4 },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
    backgroundColor: colors.surfaceAlt,
  },
  memberChipSel: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  memberChipName: { fontSize: 12, color: colors.textSecondary },
  memberChipNameSel: { color: colors.primary, fontWeight: '600' },
  shareNote: { ...typography.caption, color: colors.success, textAlign: 'right', marginTop: spacing.xs },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, gap: spacing.xs },
  addBtnText: { ...typography.bodyBold, color: colors.primary },
  footer: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  totalLabel: { ...typography.body, color: colors.textSecondary },
  totalAmount: { ...typography.h3, color: colors.primary },
});
