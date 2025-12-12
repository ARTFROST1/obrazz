import AddAllProgressModal from '@/components/shopping/AddAllProgressModal';
import CartButton from '@/components/shopping/CartButton';
import DetectionFAB from '@/components/shopping/DetectionFAB';
import GalleryBottomSheet from '@/components/shopping/GalleryBottomSheet';
import WebViewCropOverlay from '@/components/shopping/WebViewCropOverlay';
import { useShoppingBrowserStore } from '@/store/shoppingBrowserStore';
import type { DetectedImage } from '@/types/models/store';
import { imageDetectionScript } from '@/utils/shopping/imageDetection';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import { WebView } from 'react-native-webview';

export default function ShoppingBrowserScreen() {
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const webViewContainerRef = useRef<View>(null);
  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUrlRef = useRef<string>('');

  const {
    tabs,
    activeTabId,
    switchTab,
    closeTab,
    updateTabUrl,
    setDetectedImages,
    reset,
    setScanning,
    setHasScanned,
    resetScanState,
    showGallery,
  } = useShoppingBrowserStore();

  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [showCropOverlay, setShowCropOverlay] = useState(false);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  // Mobile User-Agent для отображения мобильной версии сайтов
  const MOBILE_USER_AGENT =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';

  useEffect(() => {
    // Load cart on mount
    const { loadCart } = useShoppingBrowserStore.getState();
    loadCart();
  }, []);

  useEffect(() => {
    // Reset detection when component unmounts
    return () => {
      setDetectedImages([]);
      // Cleanup detection timeout
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExit = React.useCallback(() => {
    Alert.alert('Выйти из браузера?', 'Все открытые вкладки будут закрыты.', [
      {
        text: 'Отмена',
        style: 'cancel',
      },
      {
        text: 'Выйти',
        style: 'destructive',
        onPress: () => {
          reset();
          router.back();
        },
      },
    ]);
  }, [reset, router]);

  // Handle Android back button
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true; // Prevent default behavior
      }
      handleExit();
      return true;
    });

    return () => backHandler.remove();
  }, [canGoBack, handleExit]);

  const handleTabSwitch = (tabId: string) => {
    switchTab(tabId);
    setLoading(true);
  };

  const handleTabClose = (tabId: string) => {
    closeTab(tabId);
    if (tabs.length === 1) {
      // Last tab closed
      router.back();
    }
  };

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
    setCurrentUrl(navState.url);

    // Reset scan state when navigating to new page
    if (navState.url !== lastUrlRef.current) {
      console.log('[Browser] URL changed, resetting scan state');
      resetScanState();
      lastUrlRef.current = navState.url;
    }

    if (activeTabId && navState.url !== activeTab?.currentUrl) {
      updateTabUrl(activeTabId, navState.url);
    }
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const rawData = event.nativeEvent.data;
      console.log('[WebView Message] Raw data received:', rawData?.substring(0, 100));

      if (!rawData) {
        console.warn('[WebView Message] Empty data received');
        return;
      }

      const data = JSON.parse(rawData);
      console.log('[WebView Message] Parsed data type:', data?.type);

      if (data.type === 'IMAGES_DETECTED') {
        const images: DetectedImage[] = data.images || [];
        console.log('[WebView Message] Detected images count:', images.length);

        // Stop scanning state
        setScanning(false);
        setHasScanned(true);

        if (images.length > 0) {
          console.log('[WebView Message] First image:', images[0]);
          setDetectedImages(images);

          // Auto-open gallery sheet
          console.log('[Browser] Auto-opening gallery sheet with detected items');
          setTimeout(() => {
            showGallery(true);
          }, 300);
        } else {
          console.log('[WebView Message] No images detected');
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[WebView Message] Error parsing message:', errorMsg);
      console.error('[WebView Message] Raw data was:', event.nativeEvent.data);
    }
  };

  const handleLoadEnd = () => {
    setLoading(false);

    // Clear any pending detection
    if (detectionTimeoutRef.current) {
      clearTimeout(detectionTimeoutRef.current);
    }

    const currentPageUrl = currentUrl || activeTab?.currentUrl || '';
    console.log('[Browser] Page loaded:', currentPageUrl.substring(0, 50));

    // Reset scan state on new page load
    resetScanState();

    // Reset detection script initialization flag and re-inject script on new page
    if (webViewRef.current) {
      console.log('[Browser] Re-initializing detection script for new page');

      // First, reset the initialization flag
      webViewRef.current.injectJavaScript(`
        (function() {
          if (window.__obrazzDetectionInitialized) {
            console.log('[Browser] Resetting detection initialization flag');
            delete window.__obrazzDetectionInitialized;
          }
        })();
        true;
      `);

      // Then, re-inject the detection script with a small delay
      setTimeout(() => {
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(imageDetectionScript);
        }
      }, 100);
    }
  };

  const handleScan = () => {
    console.log('[Browser] Manual scan triggered');
    setScanning(true);

    // Trigger detection after delay to allow images to load
    if (webViewRef.current) {
      detectionTimeoutRef.current = setTimeout(() => {
        if (webViewRef.current) {
          console.log('[Browser] Executing detection in WebView');
          webViewRef.current.injectJavaScript(`
            (function() {
              try {
                console.log('[Browser->WebView] Manual detection trigger');
                const event = new Event('detectImages');
                document.dispatchEvent(event);
              } catch (e) {
                console.error('[Manual Detection] Error:', e);
              }
            })();
            true;
          `);
        }
      }, 500); // Short delay to show scanning state
    }
  };

  const handleError = () => {
    setLoading(false);
    Alert.alert('Ошибка', 'Не удалось загрузить страницу', [
      {
        text: 'Попробовать снова',
        onPress: () => {
          if (webViewRef.current) {
            webViewRef.current.reload();
          }
        },
      },
      {
        text: 'Назад',
        onPress: () => router.back(),
      },
    ]);
  };

  const handleCropComplete = (croppedUri: string) => {
    console.log('[Browser] Crop complete, navigating to add-item:', croppedUri);
    setShowCropOverlay(false);

    // Navigate to add-item screen with cropped image
    router.push({
      pathname: '/add-item',
      params: {
        imageUrl: croppedUri,
        source: 'web_capture_manual',
      },
    });
  };

  const handleCropCancel = () => {
    console.log('[Browser] Crop cancelled');
    setShowCropOverlay(false);
  };

  if (!activeTab) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Магазин не выбран</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => router.back()}>
          <Text style={styles.errorButtonText}>Вернуться</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* Top Bar */}
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.topBar}>
            {/* Exit Button */}
            <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
              <Text style={styles.exitIcon}>✕</Text>
            </TouchableOpacity>

            {/* Tabs Carousel */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabsScroll}
              contentContainerStyle={styles.tabsContent}
            >
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tab, activeTabId === tab.id && styles.activeTab]}
                  onPress={() => handleTabSwitch(tab.id)}
                  onLongPress={() => handleTabClose(tab.id)}
                >
                  <Text style={[styles.tabText, activeTabId === tab.id && styles.activeTabText]}>
                    {tab.shopName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Cart Button */}
            <CartButton />

            {/* More Menu */}
            <TouchableOpacity style={styles.moreButton}>
              <Text style={styles.moreIcon}>⋯</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* WebView Container - wrapped for screenshot capture */}
        <View ref={webViewContainerRef} style={styles.webViewContainer}>
          <WebView
            ref={webViewRef}
            source={{ uri: activeTab.currentUrl }}
            userAgent={MOBILE_USER_AGENT}
            onNavigationStateChange={handleNavigationStateChange}
            onMessage={handleMessage}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            injectedJavaScript={imageDetectionScript}
            allowsBackForwardNavigationGestures
            sharedCookiesEnabled
            incognito={false}
            thirdPartyCookiesEnabled={false}
            cacheEnabled={true}
            mixedContentMode="never"
            style={styles.webView}
          />
        </View>

        {/* Detection FAB */}
        <DetectionFAB onScan={handleScan} onManualCrop={() => setShowCropOverlay(true)} />

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>Загрузка {activeTab.shopName}...</Text>
          </View>
        )}

        {/* Gallery Bottom Sheet */}
        <GalleryBottomSheet />

        {/* Add All Progress Modal */}
        <AddAllProgressModal />

        {/* WebView Crop Overlay */}
        <WebViewCropOverlay
          visible={showCropOverlay}
          viewShotRef={webViewContainerRef}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  safeArea: {
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#E5E5E5',
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 52,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  exitButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  exitIcon: {
    color: '#333333',
    fontSize: 24,
  },
  tabsScroll: {
    flex: 1,
    marginHorizontal: 8,
  },
  tabsContent: {
    alignItems: 'center',
  },
  tab: {
    marginHorizontal: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  activeTab: {
    borderBottomColor: '#000000',
    borderBottomWidth: 2,
  },
  tabText: {
    color: '#666666',
    fontSize: 15,
  },
  activeTabText: {
    color: '#000000',
    fontWeight: '600',
  },
  moreButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  moreIcon: {
    color: '#333333',
    fontSize: 24,
  },
  webViewContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#666666',
    fontSize: 14,
    marginTop: 12,
  },
  errorContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    color: '#666666',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
