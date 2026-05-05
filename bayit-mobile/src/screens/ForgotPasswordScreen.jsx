import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import colors from '../theme/colors';
import ErrorBanner from '../components/ErrorBanner';

export default function ForgotPasswordScreen({ navigation }) {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err) {
      setError('Could not send reset link.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'android' ? 'height' : 'padding'}
    >
      <View style={styles.card}>
        {submitted ? (
          <>
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.successText}>
              If an account exists for this email, a reset link has been sent.
            </Text>
            <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.primaryButtonText}>Back to Sign In</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.title}>Reset Password</Text>

            <ErrorBanner message={error} onDismiss={() => setError('')} />

            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Email"
            />

            <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>Send Reset Link</Text>
              )}
            </Pressable>

            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Back to Sign In</Text>
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  successText: {
    fontSize: 15,
    color: colors.success,
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  primaryButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.primary,
    marginTop: 4,
    minHeight: 45,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
  link: {
    color: colors.primaryDark,
    textAlign: 'center',
    marginTop: 14,
    fontSize: 14,
    fontWeight: '500',
  },
});
