import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}
    >
      {/* Content */}
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>OBRAZZ</Text>
          <Text style={styles.tagline}>Your Personal Stylist</Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <FeatureItem icon="sparkles-outline" text="AI-powered outfit suggestions" />
          <FeatureItem icon="shirt-outline" text="Organize your wardrobe" />
          <FeatureItem icon="color-palette-outline" text="Create perfect looks" />
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/(auth)/sign-in')}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/(auth)/sign-up')}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const FeatureItem: React.FC<{ icon: keyof typeof Ionicons.glyphMap; text: string }> = ({
  icon,
  text,
}) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIconContainer}>
      <Ionicons name={icon} size={22} color="#1A1A2E" />
    </View>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  buttonContainer: {
    paddingHorizontal: 32,
  },
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  featureIconContainer: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    marginRight: 16,
    width: 44,
  },
  featureItem: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 16,
  },
  featureText: {
    color: '#333',
    flex: 1,
    fontSize: 15,
  },
  features: {
    marginTop: 48,
  },
  logo: {
    color: '#1A1A2E',
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: 4,
  },
  logoContainer: {
    alignItems: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 30,
    height: 56,
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: '#1A1A2E',
    borderRadius: 30,
    borderWidth: 1.5,
    height: 56,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#1A1A2E',
    fontSize: 16,
    fontWeight: '600',
  },
  tagline: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
});
