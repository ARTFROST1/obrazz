import { Button, Input, Loader } from '@components/ui';
import { useTranslation } from '@hooks/useTranslation';
import { authService } from '@services/auth/authService';
import {
  validateEmail,
  validateName,
  validatePassword,
  validatePasswordMatch,
} from '@utils/validation/authValidation';
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

export default function SignUpScreen() {
  const router = useRouter();
  const { t } = useTranslation('auth');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    // Validate inputs
    const nameValidation = validateName(fullName);
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);
    const passwordMatchValidation = validatePasswordMatch(password, confirmPassword);

    if (
      !nameValidation.isValid ||
      !emailValidation.isValid ||
      !passwordValidation.isValid ||
      !passwordMatchValidation.isValid
    ) {
      setErrors({
        fullName: nameValidation.error,
        email: emailValidation.error,
        password: passwordValidation.error,
        confirmPassword: passwordMatchValidation.error,
      });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const result = await authService.signUp({
        email,
        password,
        fullName,
      });

      if (result.success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert(t('common:states.error'), result.error || t('signUp.errorMessage'));
      }
    } catch {
      Alert.alert(t('common:states.error'), t('signUp.unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
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
          <View style={styles.header}>
            <Text style={styles.title}>{t('signUp.title')}</Text>
            <Text style={styles.subtitle}>{t('signUp.subtitle')}</Text>
          </View>

          <View style={styles.form}>
            <Input
              label={t('signUp.fullNameLabel')}
              placeholder={t('signUp.fullNamePlaceholder')}
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                setErrors((prev) => ({ ...prev, fullName: undefined }));
              }}
              error={errors.fullName}
              leftIcon="person-outline"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
            />

            <Input
              label={t('signUp.emailLabel')}
              placeholder={t('signUp.emailPlaceholder')}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              error={errors.email}
              leftIcon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />

            <Input
              label={t('signUp.passwordLabel')}
              placeholder={t('signUp.passwordPlaceholder')}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              error={errors.password}
              leftIcon="lock-closed-outline"
              rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
              onRightIconPress={() => setShowPassword(!showPassword)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password-new"
              textContentType="newPassword"
            />

            <Input
              label={t('signUp.confirmPasswordLabel')}
              placeholder={t('signUp.confirmPasswordPlaceholder')}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              error={errors.confirmPassword}
              leftIcon="lock-closed-outline"
              rightIcon={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
              onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoComplete="password-new"
              textContentType="newPassword"
            />

            <Button
              title={t('signUp.createAccountButton')}
              onPress={handleSignUp}
              loading={loading}
              style={styles.signUpButton}
            />

            <View style={styles.signInPrompt}>
              <Text style={styles.signInPromptText}>{t('signUp.haveAccount')}</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
                <Text style={styles.signInLink}>{t('signUp.signInLink')}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.termsText}>
              {t('signUp.termsText')} <Text style={styles.termsLink}>{t('signUp.termsLink')}</Text>{' '}
              {t('signUp.and')} <Text style={styles.termsLink}>{t('signUp.privacyLink')}</Text>
            </Text>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  form: {
    flex: 1,
  },
  header: {
    marginBottom: 40,
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
    marginBottom: 24,
  },
  signInPromptText: {
    color: '#666666',
    fontSize: 15,
  },
  signUpButton: {
    marginBottom: 24,
    marginTop: 8,
  },
  subtitle: {
    color: '#666666',
    fontSize: 17,
  },
  termsLink: {
    color: '#007AFF',
    fontWeight: '500',
  },
  termsText: {
    color: '#999999',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  title: {
    color: '#000000',
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 8,
  },
});
