import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Input, Loader } from '@components/ui';
import { authService } from '@services/auth/authService';
import { validateEmail } from '@utils/validation/authValidation';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    // Validate email
    const emailValidation = validateEmail(email);

    if (!emailValidation.isValid) {
      setError(emailValidation.error);
      return;
    }

    setError(undefined);
    setLoading(true);

    try {
      const result = await authService.resetPassword(email);

      if (result.success) {
        setEmailSent(true);
      } else {
        Alert.alert('Error', result.error || 'Failed to send reset email.');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  if (emailSent) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="mail-outline" size={64} color="#34C759" />
          </View>
          <Text style={styles.successTitle}>Check Your Email</Text>
          <Text style={styles.successMessage}>
            We've sent a password reset link to{'\n'}
            <Text style={styles.emailText}>{email}</Text>
          </Text>
          <Text style={styles.instructionsText}>
            Click the link in the email to reset your password. If you don't see the email, check
            your spam folder.
          </Text>
          <Button
            title="Back to Sign In"
            onPress={() => router.push('/(auth)/sign-in')}
            style={styles.backButton}
          />
          <TouchableOpacity
            onPress={() => {
              setEmailSent(false);
              setEmail('');
            }}
          >
            <Text style={styles.resendText}>Try different email</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#000000" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError(undefined);
              }}
              error={error}
              leftIcon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              autoFocus
            />

            <Button
              title="Send Reset Link"
              onPress={handleResetPassword}
              loading={loading}
              style={styles.resetButton}
            />

            <View style={styles.signInPrompt}>
              <Text style={styles.signInPromptText}>Remember your password? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
                <Text style={styles.signInLink}>Sign In</Text>
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
    marginBottom: 16,
    marginLeft: -12,
    width: 44,
  },
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  emailText: {
    color: '#000000',
    fontWeight: '600',
  },
  form: {
    flex: 1,
  },
  header: {
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 32,
  },
  instructionsText: {
    color: '#999999',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 32,
    textAlign: 'center',
  },
  resendText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '500',
    marginTop: 16,
  },
  resetButton: {
    marginBottom: 24,
    marginTop: 8,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  signInLink: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '600',
  },
  signInPrompt: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signInPromptText: {
    color: '#666666',
    fontSize: 15,
  },
  subtitle: {
    color: '#666666',
    fontSize: 17,
    lineHeight: 24,
  },
  successContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  successMessage: {
    color: '#666666',
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  successTitle: {
    color: '#000000',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  title: {
    color: '#000000',
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 12,
  },
});
