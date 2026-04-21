import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getUserGroupsWithMemberObjects, deleteGroup } from '../../services/firebaseService';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import Avatar from '../../components/Avatar';

export default function GroupListScreen({ navigation }) {
  const { user, profile, logout } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      const data = await getUserGroupsWithMemberObjects(user.uid);
      setGroups(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.uid]);

  useFocusEffect(useCallback(() => { fetchGroups(); }, [fetchGroups]));

  function handleLongPress(group) {
    if (group.createdBy !== user.uid) return;
    Alert.alert(
      'Delete Group',
      `Delete "${group.name}"? This won't delete existing expenses.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteGroup(group.id);
            setGroups((prev) => prev.filter((g) => g.id !== group.id));
          },
        },
      ]
    );
  }

  function renderGroup({ item }) {
    const memberCount = item.members?.length || 0;
    return (
      <TouchableOpacity
        style={styles.groupCard}
        onPress={() => navigation.navigate('GroupDetail', { groupId: item.id, groupName: item.name })}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.groupIcon}>
          <Ionicons name="people" size={24} color={colors.primary} />
        </View>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.groupMeta}>
            {memberCount} member{memberCount !== 1 ? 's' : ''}
          </Text>
          <View style={styles.avatarRow}>
            {item.members?.slice(0, 4).map((m) => (
              <View key={m.id} style={styles.avatarWrap}>
                <Avatar name={m.name} id={m.id} size={22} />
              </View>
            ))}
            {memberCount > 4 && (
              <Text style={styles.moreText}>+{memberCount - 4}</Text>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textDisabled} />
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Hello, {profile?.name?.split(' ')[0] || 'there'} 👋</Text>
          <Text style={styles.subGreeting}>Manage your shared expenses</Text>
        </View>
        <TouchableOpacity onPress={() => Alert.alert('Sign Out', 'Are you sure?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: logout },
        ])}>
          <Ionicons name="log-out-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={renderGroup}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchGroups(); }} tintColor={colors.primary} />}
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={56} color={colors.textDisabled} />
              <Text style={styles.emptyTitle}>No groups yet</Text>
              <Text style={styles.emptyText}>Create a group to start splitting expenses with friends.</Text>
            </View>
          )
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateGroup')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  greeting: { ...typography.h2 },
  subGreeting: { ...typography.small, marginTop: 2 },
  list: { padding: spacing.lg, paddingTop: spacing.md, paddingBottom: 100 },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  groupInfo: { flex: 1 },
  groupName: { ...typography.bodyBold, marginBottom: 2 },
  groupMeta: { ...typography.small, marginBottom: spacing.xs },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: { marginRight: -6 },
  moreText: { ...typography.caption, marginLeft: spacing.sm },
  empty: { alignItems: 'center', paddingTop: spacing.xxl * 2 },
  emptyTitle: { ...typography.h3, marginTop: spacing.lg, marginBottom: spacing.xs },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.xl },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
});
