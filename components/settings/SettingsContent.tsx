/**
 * SettingsContent - Full settings screen content
 *
 * Contains all settings previously in Profile screen:
 * - Account settings (edit profile, change password)
 * - App settings (notifications, theme, language)
 * - Support (help, terms, about)
 * - Sign out
 */

import { Button } from '@components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@hooks/useTranslation';
import { authService } from '@services/auth/authService';
import { useAuthStore } from '@store/auth/authStore';
import { useSettingsStore } from '@store/settings/settingsStore';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface SettingsContentProps {
  returnRoute: string;
}

export function SettingsContent({ returnRoute }: SettingsContentProps) {
  const { user } = useAuthStore();
  const { language, setLanguage, theme, notificationsEnabled } = useSettingsStore();
  const { t, i18n } = useTranslation('settings');
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignOut = () => {
    Alert.alert(t('signOut.title'), t('signOut.message'), [
      {
        text: t('signOut.cancel'),
        style: 'cancel',
      },
      {
        text: t('signOut.confirm'),
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          const result = await authService.signOut();
          setLoading(false);

          if (result.success) {
            router.replace('/(auth)/welcome');
          } else {
            Alert.alert(t('common:states.error'), result.error || t('signOut.error'));
          }
        },
      },
    ]);
  };

  const handleLanguageChange = (newLang: 'ru' | 'en') => {
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
    setShowLanguagePicker(false);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.navigate(returnRoute as never)}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('header.title')}</Text>
          <View style={styles.placeholder} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* User Info */}
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color="#666666" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.user_metadata?.full_name || t('common:profile.defaultName')}
            </Text>
            <Text style={styles.userEmail}>{user?.email || t('common:profile.noEmail')}</Text>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('sections.account')}</Text>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="person-outline" size={24} color="#000000" />
              <Text style={styles.menuItemText}>{t('menu.editProfile')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C4C4C4" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="lock-closed-outline" size={24} color="#000000" />
              <Text style={styles.menuItemText}>{t('menu.changePassword')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C4C4C4" />
          </TouchableOpacity>
        </View>

        {/* App Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('sections.appSettings')}</Text>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="notifications-outline" size={24} color="#000000" />
              <Text style={styles.menuItemText}>{t('menu.notifications')}</Text>
            </View>
            <Text style={styles.currentValue}>
              {notificationsEnabled
                ? t('settings.notifications.enabled')
                : t('settings.notifications.disabled')}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#C4C4C4" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="moon-outline" size={24} color="#000000" />
              <Text style={styles.menuItemText}>{t('menu.darkMode')}</Text>
            </View>
            <Text style={styles.currentValue}>{t(`settings.theme.${theme}`)}</Text>
            <Ionicons name="chevron-forward" size={20} color="#C4C4C4" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => setShowLanguagePicker(true)}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="language-outline" size={24} color="#000000" />
              <Text style={styles.menuItemText}>{t('menu.language')}</Text>
            </View>
            <Text style={styles.currentValue}>{t(`settings.currentLanguage.${language}`)}</Text>
            <Ionicons name="chevron-forward" size={20} color="#C4C4C4" />
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('sections.support')}</Text>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="help-circle-outline" size={24} color="#000000" />
              <Text style={styles.menuItemText}>{t('menu.helpSupport')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C4C4C4" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="document-text-outline" size={24} color="#000000" />
              <Text style={styles.menuItemText}>{t('menu.termsPrivacy')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C4C4C4" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="information-circle-outline" size={24} color="#000000" />
              <Text style={styles.menuItemText}>{t('menu.about')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C4C4C4" />
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <Button
            title={t('common:buttons.signOut')}
            onPress={handleSignOut}
            variant="secondary"
            style={styles.signOutButton}
            loading={loading}
          />
        </View>

        <Text style={styles.version}>{t('version', { version: '1.0.0' })}</Text>
      </ScrollView>

      {/* Language Picker Modal */}
      <Modal
        visible={showLanguagePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguagePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguagePicker(false)}
        >
          <View style={styles.languageModal} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>{t('settings.selectLanguage')}</Text>

            <TouchableOpacity
              style={[styles.languageOption, language === 'ru' && styles.languageOptionSelected]}
              onPress={() => handleLanguageChange('ru')}
            >
              <Text style={styles.languageEmoji}>🇷🇺</Text>
              <Text style={[styles.languageText, language === 'ru' && styles.languageTextSelected]}>
                Русский
              </Text>
              {language === 'ru' && <Ionicons name="checkmark" size={24} color="#007AFF" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.languageOption, language === 'en' && styles.languageOptionSelected]}
              onPress={() => handleLanguageChange('en')}
            >
              <Text style={styles.languageEmoji}>🇬🇧</Text>
              <Text style={[styles.languageText, language === 'en' && styles.languageTextSelected]}>
                English
              </Text>
              {language === 'en' && <Ionicons name="checkmark" size={24} color="#007AFF" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowLanguagePicker(false)}
            >
              <Text style={styles.closeButtonText}>{t('common:buttons.close')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  safeArea: {
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    color: '#999999',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  menuItem: {
    alignItems: 'center',
    borderBottomColor: '#F0F0F0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  menuItemLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  menuItemText: {
    color: '#000000',
    fontSize: 17,
    marginLeft: 16,
  },
  currentValue: {
    color: '#666666',
    fontSize: 15,
    marginRight: 8,
  },
  signOutButton: {
    marginTop: 8,
  },
  version: {
    color: '#C4C4C4',
    fontSize: 13,
    paddingVertical: 32,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 24,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#F8F8F8',
  },
  languageOptionSelected: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  languageEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  languageText: {
    fontSize: 17,
    color: '#000000',
    flex: 1,
  },
  languageTextSelected: {
    fontWeight: '600',
    color: '#007AFF',
  },
  closeButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});
