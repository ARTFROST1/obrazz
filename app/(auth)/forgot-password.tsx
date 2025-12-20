import { Ionicons } from '@expo/vector-icons';
import { authService } from '@services/auth/authService';
import { validateEmail } from '@utils/validation/authValidation';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    Keyboard.dismiss();
    setError('');

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || 'Invalid email');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.resetPassword(email);
      if (result.success) {
        setEmailSent(true);
      } else {
        setError(result.error || 'Failed to send reset email');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 },
        ]}
      >
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="mail-outline" size={48} color="#1A1A2E" />
          </View>
          <Text style={styles.successTitle}>Check Your Email</Text>
          <Text style={styles.successMessage}>
            We've sent a password reset link to{'\n'}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/sign-in')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Back to Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setEmailSent(false);
              setEmail('');
            }}
          >
            <Text style={styles.linkText}>Try different email</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>OBRAZZ</Text>
            <Text style={styles.tagline}>Reset Password</Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoFocus
                />
              </View>
            </View>

            {/* Error Message */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Reset Button */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>

            {/* Back to Sign In */}
            <View style={styles.linkContainer}>
              <Text style={styles.linkLabel}>Remember your password? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
                <Text style={styles.linkAction}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    marginBottom: 24,
    marginLeft: -8,
    width: 44,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  description: {
    color: '#666',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 32,
    textAlign: 'center',
  },
  emailHighlight: {
    color: '#1A1A2E',
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  form: {
    flex: 1,
    width: '100%',
  },
  input: {
    color: '#000',
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  inputContainer: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    flexDirection: 'row',
    height: 56,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  linkAction: {
    color: '#1A1A2E',
    fontSize: 14,
    fontWeight: '600',
  },
  linkContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  linkLabel: {
    color: '#666',
    fontSize: 14,
  },
  linkText: {
    color: '#1A1A2E',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 24,
  },
  logo: {
    color: '#1A1A2E',
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 3,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 30,
    height: 56,
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
  },
  successContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  successIcon: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    marginBottom: 24,
    width: 80,
  },
  successMessage: {
    color: '#666',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 32,
    textAlign: 'center',
  },
  successTitle: {
    color: '#1A1A2E',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  tagline: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
});
