import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { colors, spacing, typography } from '../../theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!name.trim() || name.trim().length < 2) e.name = 'Enter your full name';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Minimum 6 characters';
    if (password !== confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
    } catch (err) {
      const msg =
        err.code === 'auth/email-already-in-use'
          ? 'An account with this email already exists.'
          : 'Registration failed. Please try again.';
      Alert.alert('Sign Up Failed', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Join and start splitting expenses fairly</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Jane Smith"
              autoCapitalize="words"
              autoComplete="name"
              error={errors.name}
            />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoComplete="email"
              error={errors.email}
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Minimum 6 characters"
              secureTextEntry
              error={errors.password}
            />
            <Input
              label="Confirm Password"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Repeat password"
              secureTextEntry
              error={errors.confirm}
            />

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              size="lg"
              style={styles.btn}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: spacing.lg },
  back: { marginBottom: spacing.lg, marginTop: spacing.sm },
  header: { marginBottom: spacing.xl },
  title: { ...typography.h1, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary },
  form: { marginBottom: spacing.xl },
  btn: { marginTop: spacing.sm },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { ...typography.body, color: colors.textSecondary },
  link: { ...typography.bodyBold, color: colors.primary },
});
