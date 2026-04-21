import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  error,
  multiline,
  numberOfLines,
  maxLength,
  editable = true,
  prefix,
  suffix,
  style,
  inputStyle,
  ...rest
}) {
  const [secure, setSecure] = useState(secureTextEntry);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.container,
          focused && styles.focused,
          error && styles.error,
          !editable && styles.disabled,
          multiline && styles.multiline,
        ]}
      >
        {prefix && <View style={styles.adornment}>{prefix}</View>}
        <TextInput
          style={[styles.input, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textDisabled}
          secureTextEntry={secure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          editable={editable}
          {...rest}
        />
        {secureTextEntry && (
          <TouchableOpacity style={styles.adornment} onPress={() => setSecure(!secure)}>
            <Ionicons
              name={secure ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
        {suffix && !secureTextEntry && <View style={styles.adornment}>{suffix}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { ...typography.label, marginBottom: spacing.xs },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  focused: { borderColor: colors.primary },
  error: { borderColor: colors.error },
  disabled: { backgroundColor: colors.surfaceAlt, opacity: 0.8 },
  multiline: { alignItems: 'flex-start', paddingVertical: spacing.sm },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  adornment: { marginHorizontal: spacing.xs / 2 },
  errorText: { ...typography.small, color: colors.error, marginTop: spacing.xs },
});
