import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatInitials, generateAvatarColor } from '../utils/formatters';
import { typography } from '../theme';

export default function Avatar({ name = '', id, size = 36 }) {
  const bg = generateAvatarColor(id || name);
  const initials = formatInitials(name);
  const fontSize = size * 0.38;

  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#fff', fontWeight: '700' },
});
