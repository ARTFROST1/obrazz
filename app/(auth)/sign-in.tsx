import { Button, Input, Loader } from '@components/ui';
import { useTranslation } from '@hooks/useTranslation';
import { authService } from '@services/auth/authService';
import { validateEmail, validatePassword } from '@utils/validation/authValidation';
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

export default function SignInScreen() {
  const router = useRouter();
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    // Validate inputs
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    if (!emailValidation.isValid || !passwordValidation.isValid) {
      setErrors({
        email: emailValidation.error,
        password: passwordValidation.error,
      });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const result = await authService.signIn({ email, password });

      if (result.success) {
        // Navigation will be handled automatically by auth state change
        router.replace('/(tabs)');
      } else {
        Alert.alert(t('common:states.error'), result.error || t('signIn.errorMessage'));
      }
    } catch {
      Alert.alert(t('common:states.error'), t('signIn.unexpectedError'));
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
            <Text style={styles.title}>{t('signIn.title')}</Text>
            <Text style={styles.subtitle}>{t('signIn.subtitle')}</Text>
          </View>

          <View style={styles.form}>
            <Input
              label={t('signIn.emailLabel')}
              placeholder={t('signIn.emailPlaceholder')}
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
              label={t('signIn.passwordLabel')}
              placeholder={t('signIn.passwordPlaceholder')}
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
              autoComplete="password"
              textContentType="password"
            />

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text style={styles.forgotPasswordText}>{t('signIn.forgotPassword')}</Text>
            </TouchableOpacity>

            <Button
              title={t('signIn.signInButton')}
              onPress={handleSignIn}
              loading={loading}
              style={styles.signInButton}
            />

            <View style={styles.signUpPrompt}>
              <Text style={styles.signUpPromptText}>{t('signIn.noAccount')}</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
                <Text style={styles.signUpLink}>{t('signIn.signUpLink')}</Text>
              </TouchableOpacity>
            </View>
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -8,
  },
  forgotPasswordText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '500',
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
  signInButton: {
    marginBottom: 24,
  },
  signUpLink: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '600',
  },
  signUpPrompt: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signUpPromptText: {
    color: '#666666',
    fontSize: 15,
  },
  subtitle: {
    color: '#666666',
    fontSize: 17,
  },
  title: {
    color: '#000000',
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 8,
  },
});
