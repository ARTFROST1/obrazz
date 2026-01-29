/**
 * Region Detection Service
 *
 * Determines user's region for:
 * - Payment method selection (IAP vs web payments)
 * - Locale-specific features
 *
 * Russian users: YooKassa web payments (Apple/Google restrictions)
 * Global users: In-App Purchases
 */

import { useSettingsStore } from '@store/settings/settingsStore';
import { useSubscriptionStore } from '@store/subscription/subscriptionStore';
import { NativeModules, Platform } from 'react-native';

// Russian region indicators
const RUSSIAN_LOCALES = ['ru', 'ru-RU', 'ru_RU'];
const RUSSIAN_COUNTRY_CODES = ['RU', 'BY', 'KZ']; // Russia, Belarus, Kazakhstan (CIS)

export type RegionType = 'ru' | 'global';

export interface RegionInfo {
  region: RegionType;
  locale: string;
  country: string | null;
  timezone: string;
  detectionMethod: 'locale' | 'country' | 'timezone' | 'setting' | 'default';
}

// Helper to get device locale without expo-localization
function getDeviceLocale(): string {
  try {
    if (Platform.OS === 'ios') {
      return (
        NativeModules.SettingsManager?.settings?.AppleLocale ||
        NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
        'en'
      );
    } else if (Platform.OS === 'android') {
      return NativeModules.I18nManager?.localeIdentifier || 'en';
    }
    return 'en';
  } catch {
    return 'en';
  }
}

// Helper to get device timezone
function getDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

class RegionService {
  private cachedRegion: RegionInfo | null = null;

  /**
   * Detect user's region and update stores
   */
  async detectAndSetRegion(): Promise<RegionInfo> {
    const regionInfo = await this.detectRegion();

    // Update subscription store's payment region
    useSubscriptionStore.getState().setPaymentRegion(regionInfo.region);

    console.log('[RegionService] Region detected:', regionInfo);
    return regionInfo;
  }

  /**
   * Detect user's region
   * Priority: 1. App language setting, 2. Device locale, 3. Country code, 4. Timezone
   */
  async detectRegion(): Promise<RegionInfo> {
    if (this.cachedRegion) {
      return this.cachedRegion;
    }

    const locale = getDeviceLocale();
    const timezone = getDeviceTimezone();

    // Get country code (if available)
    let country: string | null = null;
    try {
      country = await this.getCountryCode();
    } catch {
      // Country detection failed
    }

    let region: RegionType = 'global';
    let detectionMethod: RegionInfo['detectionMethod'] = 'default';

    // 1. Check app language setting (most reliable user intent)
    const appLanguage = useSettingsStore.getState().language;
    if (appLanguage === 'ru') {
      region = 'ru';
      detectionMethod = 'setting';
    }
    // 2. Check device locale
    else if (RUSSIAN_LOCALES.some((l) => locale.startsWith(l))) {
      region = 'ru';
      detectionMethod = 'locale';
    }
    // 3. Check country code
    else if (country && RUSSIAN_COUNTRY_CODES.includes(country.toUpperCase())) {
      region = 'ru';
      detectionMethod = 'country';
    }
    // 4. Check timezone (fallback)
    else if (this.isRussianTimezone(timezone)) {
      region = 'ru';
      detectionMethod = 'timezone';
    }

    this.cachedRegion = {
      region,
      locale,
      country,
      timezone,
      detectionMethod,
    };

    return this.cachedRegion;
  }

  /**
   * Check if timezone is in Russian range
   */
  private isRussianTimezone(timezone: string): boolean {
    const russianTimezones = [
      'Europe/Moscow',
      'Europe/Kaliningrad',
      'Europe/Samara',
      'Asia/Yekaterinburg',
      'Asia/Omsk',
      'Asia/Novosibirsk',
      'Asia/Krasnoyarsk',
      'Asia/Irkutsk',
      'Asia/Yakutsk',
      'Asia/Vladivostok',
      'Asia/Magadan',
      'Asia/Kamchatka',
      // Belarus
      'Europe/Minsk',
      // Kazakhstan
      'Asia/Almaty',
      'Asia/Aqtobe',
    ];
    return russianTimezones.includes(timezone);
  }

  /**
   * Get country code from device
   */
  private async getCountryCode(): Promise<string | null> {
    try {
      // iOS specific
      if (Platform.OS === 'ios') {
        const settings = NativeModules.SettingsManager?.settings;
        if (settings?.AppleLocale) {
          const parts = settings.AppleLocale.split('_');
          return parts[parts.length - 1] || null;
        }
        // Try AppleLanguages
        const languages = settings?.AppleLanguages;
        if (languages && languages.length > 0) {
          const parts = languages[0].split('-');
          if (parts.length > 1) {
            return parts[parts.length - 1].toUpperCase();
          }
        }
      }

      // Android specific
      if (Platform.OS === 'android') {
        const locale = NativeModules.I18nManager?.localeIdentifier || '';
        const parts = locale.split('_');
        if (parts.length > 1) {
          return parts[parts.length - 1].toUpperCase();
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Force set region (for testing or user override)
   */
  setRegion(region: RegionType): void {
    this.cachedRegion = {
      region,
      locale: getDeviceLocale(),
      country: null,
      timezone: getDeviceTimezone(),
      detectionMethod: 'setting',
    };
    useSubscriptionStore.getState().setPaymentRegion(region);
    console.log('[RegionService] Region manually set to:', region);
  }

  /**
   * Clear cached region (for re-detection)
   */
  clearCache(): void {
    this.cachedRegion = null;
  }

  /**
   * Check if user is in Russian region
   */
  isRussianRegion(): boolean {
    const { paymentRegion } = useSubscriptionStore.getState();
    return paymentRegion === 'ru';
  }

  /**
   * Get current region
   */
  getRegion(): RegionType {
    return useSubscriptionStore.getState().paymentRegion;
  }
}

export const regionService = new RegionService();
