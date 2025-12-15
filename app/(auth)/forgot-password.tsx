import { Button, Input, Loader } from '@components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@hooks/useTranslation';
import { authService } from '@services/auth/authService';
import { validateEmail } from '@utils/validation/authValidation';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation('auth');
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
        Alert.alert(t('common:states.error'), result.error || t('forgotPassword.errorMessage'));
      }
    } catch {
      Alert.alert(t('common:states.error'), t('forgotPassword.unexpectedError'));
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
          <Text style={styles.successTitle}>{t('forgotPassword.successTitle')}</Text>
          <Text style={styles.successMessage}>
            {t('forgotPassword.successMessage')} <Text style={styles.emailText}>{email}</Text>
          </Text>
          <Text style={styles.instructionsText}>{t('forgotPassword.instructions')}</Text>
          <Button
            title={t('forgotPassword.backToSignIn')}
            onPress={() => router.push('/(auth)/sign-in')}
            style={styles.backButton}
          />
          <TouchableOpacity
            onPress={() => {
              setEmailSent(false);
              setEmail('');
            }}
          >
            <Text style={styles.resendText}>{t('forgotPassword.tryDifferentEmail')}</Text>
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
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#000000" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>{t('forgotPassword.title')}</Text>
            <Text style={styles.subtitle}>{t('forgotPassword.subtitle')}</Text>
          </View>

          <View style={styles.form}>
            <Input
              label={t('forgotPassword.emailLabel')}
              placeholder={t('forgotPassword.emailPlaceholder')}
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
              title={t('forgotPassword.sendResetLink')}
              onPress={handleResetPassword}
              loading={loading}
              style={styles.resetButton}
            />

            <View style={styles.signInPrompt}>
              <Text style={styles.signInPromptText}>{t('forgotPassword.rememberPassword')}</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
                <Text style={styles.signInLink}>{t('forgotPassword.signInLink')}</Text>
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
