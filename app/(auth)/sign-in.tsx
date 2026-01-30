import { Ionicons } from '@expo/vector-icons';
import { authService } from '@services/auth/authService';
import { oauthService } from '@services/auth/oauthService';
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

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    Keyboard.dismiss();
    setError('');

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || 'Invalid email');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.signIn({ email, password });
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        setError(result.error || 'Sign in failed');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    Keyboard.dismiss();
    setError('');
    setOauthLoading('google');
    try {
      const result = await oauthService.signInWithGoogle();
      if (result.success) {
        router.replace('/(tabs)');
      } else if (result.error && result.error !== 'Вход отменён') {
        setError(result.error);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setOauthLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    Keyboard.dismiss();
    setError('');
    setOauthLoading('apple');
    try {
      const result = await oauthService.signInWithApple();
      if (result.success) {
        router.replace('/(tabs)');
      } else if (result.error && result.error !== 'Вход отменён') {
        setError(result.error);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>OBRAZZ</Text>
            <Text style={styles.tagline}>Your Personal Stylist</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#999"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text style={styles.forgotPasswordText}>Forgot password</Text>
            </TouchableOpacity>

            {/* Error Message */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.button, (loading || oauthLoading) && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={loading || oauthLoading !== null}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>LOGIN</Text>
              )}
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.linkContainer}>
              <Text style={styles.linkText}>Don't Have Account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
                <Text style={styles.linkAction}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>Or Continue with</Text>
              <View style={styles.divider} />
            </View>

            {/* Social Buttons */}
            <View style={styles.socialContainer}>
              <TouchableOpacity
                style={[
                  styles.socialButton,
                  oauthLoading === 'google' && styles.socialButtonLoading,
                ]}
                activeOpacity={0.7}
                onPress={handleGoogleSignIn}
                disabled={loading || oauthLoading !== null}
              >
                {oauthLoading === 'google' ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Ionicons name="logo-google" size={22} color="#000" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.socialButton,
                  oauthLoading === 'apple' && styles.socialButtonLoading,
                ]}
                activeOpacity={0.7}
                onPress={handleAppleSignIn}
                disabled={loading || oauthLoading !== null}
              >
                {oauthLoading === 'apple' ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Ionicons name="logo-apple" size={22} color="#000" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 30,
    height: 56,
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1,
  },
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  divider: {
    backgroundColor: '#E5E5E5',
    flex: 1,
    height: 1,
  },
  dividerContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 24,
  },
  dividerText: {
    color: '#999',
    fontSize: 13,
    marginHorizontal: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  eyeButton: {
    padding: 8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: 4,
  },
  forgotPasswordText: {
    color: '#666',
    fontSize: 14,
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
    marginBottom: 32,
  },
  linkText: {
    color: '#666',
    fontSize: 14,
  },
  logo: {
    color: '#1A1A2E',
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 3,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
  },
  socialButton: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    marginHorizontal: 8,
    width: 56,
  },
  socialButtonLoading: {
    opacity: 0.7,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  tagline: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
});
