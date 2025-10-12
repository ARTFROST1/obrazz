import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>👔</Text>
        </View>

        <Text style={styles.title}>Welcome to Obrazz</Text>
        <Text style={styles.subtitle}>
          Your Personal Fashion Assistant{'\n'}
          Create stunning outfits with AI
        </Text>

        <View style={styles.features}>
          <FeatureItem icon="✨" text="AI-powered outfit suggestions" />
          <FeatureItem icon="👗" text="Manage your digital wardrobe" />
          <FeatureItem icon="🎨" text="Create custom outfits" />
          <FeatureItem icon="🌐" text="Share with the community" />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Sign In"
          onPress={() => router.push('/(auth)/sign-in')}
          style={styles.signInButton}
        />
        <Button
          title="Create Account"
          onPress={() => router.push('/(auth)/sign-up')}
          variant="secondary"
          style={styles.signUpButton}
        />
      </View>
    </View>
  );
}

const FeatureItem: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  buttonContainer: {
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  featureItem: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 20,
    paddingLeft: 16,
  },
  featureText: {
    color: '#333333',
    flex: 1,
    fontSize: 15,
  },
  features: {
    marginTop: 24,
  },
  logo: {
    fontSize: 80,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  signInButton: {
    marginBottom: 12,
  },
  signUpButton: {
    marginBottom: 0,
  },
  subtitle: {
    color: '#666666',
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 48,
    textAlign: 'center',
  },
  title: {
    color: '#000000',
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
});
