import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { createGroup, findUserByEmail } from '../../services/firebaseService';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Avatar from '../../components/Avatar';
import { colors, spacing, typography, radius, shadows } from '../../theme';

export default function CreateGroupScreen({ navigation }) {
  const { user, profile } = useAuth();
  const [name, setName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [members, setMembers] = useState([
    { id: user.uid, name: profile?.name || 'Me', email: profile?.email || '', isCreator: true },
  ]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [nameError, setNameError] = useState('');

  async function handleAddMember() {
    const email = memberEmail.trim().toLowerCase();
    if (!email) return;
    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (members.some((m) => m.email === email)) {
      Alert.alert('Already Added', 'This person is already in the group.');
      return;
    }
    setAdding(true);
    try {
      const found = await findUserByEmail(email);
      if (!found) {
        Alert.alert('User Not Found', 'No account found with that email. They need to sign up first.');
        return;
      }
      setMembers((prev) => [...prev, { id: found.id, name: found.name, email: found.email }]);
      setMemberEmail('');
    } catch {
      Alert.alert('Error', 'Could not search for user. Check your connection.');
    } finally {
      setAdding(false);
    }
  }

  function removeMember(id) {
    if (id === user.uid) return;
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  async function handleCreate() {
    if (!name.trim()) {
      setNameError('Group name is required');
      return;
    }
    if (members.length < 2) {
      Alert.alert('Add Members', 'Add at least one other member to the group.');
      return;
    }
    setLoading(true);
    try {
      const groupId = await createGroup({
        name: name.trim(),
        members,
        createdBy: user.uid,
      });
      navigation.replace('GroupDetail', { groupId, groupName: name.trim() });
    } catch {
      Alert.alert('Error', 'Could not create group. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Input
            label="Group Name"
            value={name}
            onChangeText={(t) => { setName(t); setNameError(''); }}
            placeholder="e.g. Trip to Bali, Housemates"
            autoCapitalize="words"
            error={nameError}
          />

          <Text style={styles.sectionTitle}>Add Members</Text>
          <View style={styles.addRow}>
            <Input
              value={memberEmail}
              onChangeText={setMemberEmail}
              placeholder="member@email.com"
              keyboardType="email-address"
              style={styles.emailInput}
            />
            <Button
              title="Add"
              onPress={handleAddMember}
              loading={adding}
              size="sm"
              style={styles.addBtn}
            />
          </View>

          <Text style={styles.memberCount}>{members.length} member{members.length !== 1 ? 's' : ''}</Text>
          {members.map((m) => (
            <View key={m.id} style={styles.memberRow}>
              <Avatar name={m.name} id={m.id} size={40} />
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{m.name}{m.isCreator ? ' (you)' : ''}</Text>
                <Text style={styles.memberEmail}>{m.email}</Text>
              </View>
              {!m.isCreator && (
                <TouchableOpacity onPress={() => removeMember(m.id)} style={styles.removeBtn}>
                  <Ionicons name="close-circle" size={22} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Create Group"
            onPress={handleCreate}
            loading={loading}
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: { padding: spacing.lg },
  sectionTitle: { ...typography.label, marginBottom: spacing.sm, marginTop: spacing.md },
  addRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  emailInput: { flex: 1, marginBottom: 0 },
  addBtn: { marginTop: 0, alignSelf: 'flex-start' },
  memberCount: { ...typography.small, marginTop: spacing.lg, marginBottom: spacing.sm },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  memberInfo: { flex: 1, marginLeft: spacing.md },
  memberName: { ...typography.bodyBold },
  memberEmail: { ...typography.small },
  removeBtn: { padding: spacing.xs },
  footer: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
