import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';
import Avatar from './Avatar';

export default function MemberSelector({ members, selected, onToggle, label }) {
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {members.map((member) => {
          const isSelected = selected.some((s) => s.id === member.id);
          return (
            <TouchableOpacity
              key={member.id}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => onToggle(member)}
              activeOpacity={0.7}
            >
              <Avatar name={member.name} id={member.id} size={28} />
              <Text style={[styles.name, isSelected && styles.nameSelected]} numberOfLines={1}>
                {member.name?.split(' ')[0]}
              </Text>
              {isSelected && (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark" size={10} color={colors.white} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { ...typography.label, marginBottom: spacing.sm },
  row: { flexDirection: 'row', paddingBottom: spacing.xs },
  chip: {
    alignItems: 'center',
    marginRight: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minWidth: 60,
    position: 'relative',
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  name: { ...typography.caption, marginTop: spacing.xs, color: colors.textSecondary },
  nameSelected: { color: colors.primary, fontWeight: '600' },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
