import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius, spacing, shadows } from '../theme';

export default function Card({ children, style, variant = 'default' }) {
  return (
    <View style={[styles.card, styles[`variant_${variant}`], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  variant_default: {},
  variant_elevated: { ...shadows.md },
  variant_outlined: {
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: colors.border,
  },
  variant_primary: {
    backgroundColor: colors.primary,
    ...shadows.lg,
  },
});
