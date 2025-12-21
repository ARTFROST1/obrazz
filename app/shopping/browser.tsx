import CartButton from '@/components/shopping/CartButton';
import GalleryBottomSheet from '@/components/shopping/GalleryBottomSheet';
import TabsCarousel from '@/components/shopping/TabsCarousel';
import WebViewCropOverlay from '@/components/shopping/WebViewCropOverlay';
import { useShoppingBrowserStore } from '@/store/shoppingBrowserStore';
import type { DetectedImage } from '@/types/models/store';
import { imageDetectionScript } from '@/utils/shopping/imageDetection';
import { preloadOptimizationScript } from '@/utils/shopping/webviewOptimization';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import { WebView } from 'react-native-webview';
import { useShallow } from 'zustand/react/shallow';

export default function ShoppingBrowserScreen() {
  const router = useRouter();
  // const safeAreaInsets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const webViewContainerRef = useRef<View>(null);
  const detectionTimeoutRef = useRef<{
    current: NodeJS.Timeout | null;
    safetyTimeout: NodeJS.Timeout | null;
  }>({ current: null, safetyTimeout: null });
  const lastUrlRef = useRef<string>('');
  const currentUrlRef = useRef<string>('');
  const lastNavUiUpdateAtRef = useRef<number>(0);

  const debugLog = (...args: unknown[]) => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  };

  const {
    tabs,
    activeTabId,
    showGallerySheet,
    isScanning,
    hasScanned,
    detectedImages,
    updateTabUrl,
    setDetectedImages,
    reset,
    setScanning,
    setHasScanned,
    resetScanState,
    showGallery,
  } = useShoppingBrowserStore(
    useShallow((state) => ({
      tabs: state.tabs,
      activeTabId: state.activeTabId,
      showGallerySheet: state.showGallerySheet,
      isScanning: state.isScanning,
      hasScanned: state.hasScanned,
      detectedImages: state.detectedImages,
      updateTabUrl: state.updateTabUrl,
      setDetectedImages: state.setDetectedImages,
      reset: state.reset,
      setScanning: state.setScanning,
      setHasScanned: state.setHasScanned,
      resetScanState: state.resetScanState,
      showGallery: state.showGallery,
    })),
  );
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [showCropOverlay, setShowCropOverlay] = useState(false);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  // Platform-specific Mobile User-Agent для избежания блокировок
  const MOBILE_USER_AGENT = Platform.select({
    ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    android:
      'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    default:
      'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  }) as string;

  // Reset state when switching tabs - FIXED: removed resetScanState from deps to prevent infinite loop
  useEffect(() => {
    if (activeTabId) {
      debugLog('[Browser] Tab switched to:', activeTabId);
      resetScanState(); // Call it but don't include in deps
      lastUrlRef.current = activeTab?.currentUrl || '';
      currentUrlRef.current = activeTab?.currentUrl || '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabId]); // Only depend on activeTabId, not activeTab or resetScanState

  useEffect(() => {
    // Load cart on mount
    const { loadCart } = useShoppingBrowserStore.getState();
    loadCart();
  }, []);

  useEffect(() => {
    // Cleanup on unmount
    const currentDetectionTimeoutRef = detectionTimeoutRef.current;
    return () => {
      const { setDetectedImages: clearDetectedImages } = useShoppingBrowserStore.getState();
      clearDetectedImages([]);

      // Cleanup detection timeouts
      if (currentDetectionTimeoutRef.current) {
        clearTimeout(currentDetectionTimeoutRef.current);
        currentDetectionTimeoutRef.current = null;
      }
      if (currentDetectionTimeoutRef.safetyTimeout) {
        clearTimeout(currentDetectionTimeoutRef.safetyTimeout);
        currentDetectionTimeoutRef.safetyTimeout = null;
      }
    };
  }, []);

  const handleExit = React.useCallback(() => {
    reset();
    router.back();
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

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    currentUrlRef.current = navState.url;

    // WebView can emit many nav events (redirects, SPA route changes).
    // Throttle UI updates to avoid blocking the JS thread.
    const now = Date.now();
    const shouldUpdateUi =
      now - lastNavUiUpdateAtRef.current > 120 ||
      (navState.loading === false && now - lastNavUiUpdateAtRef.current > 20);

    if (shouldUpdateUi) {
      lastNavUiUpdateAtRef.current = now;
      setCanGoBack((prev) => (prev === navState.canGoBack ? prev : navState.canGoBack));
      setCanGoForward((prev) => (prev === navState.canGoForward ? prev : navState.canGoForward));
      setCurrentUrl((prev) => (prev === navState.url ? prev : navState.url));
    }

    // Normalize URL: remove hash and query params for comparison
    const normalizeUrl = (url: string) => {
      try {
        const urlObj = new URL(url);
        return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
      } catch {
        return url.split('#')[0].split('?')[0];
      }
    };

    const normalizedUrl = normalizeUrl(navState.url);
    const lastNormalizedUrl = normalizeUrl(lastUrlRef.current);

    // Reset scan state only when navigating to a truly new page (not just hash/query changes)
    // But keep gallery open if user is viewing results
    if (normalizedUrl !== lastNormalizedUrl && !showGallerySheet) {
      resetScanState();
      lastUrlRef.current = navState.url;
    } else if (normalizedUrl !== lastNormalizedUrl) {
      // Just update the URL ref without resetting scan state
      lastUrlRef.current = navState.url;
    }

    // IMPORTANT: don't update tab URL on every nav tick.
    // Commit final URL in onLoadEnd to avoid store churn and UI freezes.
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const rawData = event.nativeEvent.data;
      debugLog('[WebView Message] Raw data received, length:', rawData?.length);

      if (!rawData) {
        console.warn('[WebView Message] Empty data received');
        return;
      }

      const data = JSON.parse(rawData);
      debugLog('[WebView Message] Parsed data type:', data?.type);

      if (data.type === 'IMAGES_DETECTED') {
        const images: DetectedImage[] = data.images || [];
        debugLog('[WebView Message] IMAGES_DETECTED received, count:', images.length);
        debugLog('[WebView Message] Stats:', data.stats);

        // Log error if present
        if (data.error) {
          console.error('[WebView Message] ⚠️ Detection error:', data.error);
          if (data.debug) {
            debugLog('[WebView Message] Debug info:', data.debug);
          }
        }

        // Clear safety timeout
        if (detectionTimeoutRef.current.safetyTimeout) {
          clearTimeout(detectionTimeoutRef.current.safetyTimeout);
          detectionTimeoutRef.current.safetyTimeout = null;
        }

        // Stop scanning state
        setScanning(false);
        setHasScanned(true);

        if (images.length > 0) {
          debugLog('[WebView Message] First image:', {
            url: images[0].url?.substring(0, 60),
            hasProductUrl: !!images[0].productUrl,
            productUrl: images[0].productUrl?.substring(0, 60),
          });
          setDetectedImages(images);

          // Auto-open gallery sheet
          debugLog('[Browser] Auto-opening gallery sheet with detected items');
          setTimeout(() => {
            showGallery(true);
          }, 300);
        } else {
          debugLog('[WebView Message] No images detected');

          // Keep scan available; user can retry on the same page.
          setHasScanned(false);

          if (data.error) {
            Alert.alert('Ошибка обнаружения', String(data.error));
          } else {
            Alert.alert(
              'Ничего не найдено',
              'На этой странице не обнаружено вещей. Перейдите на страницу конкретного товара или вырежьте вручную.',
              [
                { text: 'Закрыть', style: 'cancel' },
                { text: 'Вырезать вручную', onPress: () => setShowCropOverlay(true) },
              ],
            );
          }
        }
      } else {
        debugLog('[WebView Message] Unknown message type:', data.type);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[WebView Message] ❌ Error parsing message:', errorMsg);
      console.error('[WebView Message] Raw data was:', event.nativeEvent.data?.substring(0, 200));

      // Clear safety timeout and reset scanning state on error
      if (detectionTimeoutRef.current.safetyTimeout) {
        clearTimeout(detectionTimeoutRef.current.safetyTimeout);
        detectionTimeoutRef.current.safetyTimeout = null;
      }
      setScanning(false);
    }
  };

  const handleLoadEnd = () => {
    // Commit final URL to the active tab once the load finishes.
    const finalUrl = currentUrlRef.current || activeTab?.currentUrl || '';
    if (activeTabId && finalUrl && finalUrl !== activeTab?.currentUrl) {
      updateTabUrl(activeTabId, finalUrl);
    }

    // Clear any pending detection
    if (detectionTimeoutRef.current.current) {
      clearTimeout(detectionTimeoutRef.current.current);
    }

    const currentPageUrl = finalUrl || currentUrl || '';
    debugLog('[Browser] Page loaded:', currentPageUrl.substring(0, 80));

    // Reset scan state on new page load only if gallery is not shown
    if (!showGallerySheet) {
      resetScanState();
    }

    // OPTIMIZED: Simplified injection - scripts already injected via props
    // No need to re-inject on every load, they're already in place via:
    // - injectedJavaScriptBeforeContentLoaded={preloadOptimizationScript}
    // - injectedJavaScript={imageDetectionScript}
  };

  const handleScan = () => {
    debugLog('[Browser] Manual scan triggered');
    debugLog('[Browser] Current URL:', currentUrlRef.current || currentUrl);
    debugLog('[Browser] WebView ref available:', !!webViewRef.current);
    setScanning(true);

    // Safety timeout: reset scanning state after 7 seconds if no response
    const safetyTimeout = setTimeout(() => {
      console.warn('[Browser] ⚠️ Detection timeout - no response received, resetting state');
      setScanning(false);
      setHasScanned(false);
      Alert.alert(
        'Таймаут',
        'Не удалось обнаружить вещи на странице. Попробуйте другую страницу товара или выполните вырезание вручную.',
        [
          { text: 'Закрыть', style: 'cancel' },
          { text: 'Вырезать вручную', onPress: () => setShowCropOverlay(true) },
        ],
      );
    }, 7000);

    // Trigger detection
    if (webViewRef.current) {
      detectionTimeoutRef.current.current = setTimeout(() => {
        if (webViewRef.current) {
          // Detection script is already injected via `injectedJavaScript`.
          // Keep injected payload minimal to avoid JS-thread stalls.
          debugLog('[Browser] Triggering detection function');
          const detectionCode = `
            (function() {
              try {
                if (typeof window.__obrazzDetectImages === 'function') {
                  window.__obrazzDetectImages();
                } else if (window.ReactNativeWebView?.postMessage) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'IMAGES_DETECTED',
                    images: [],
                    error: 'Detection function not available'
                  }));
                }
              } catch (e) {
                if (window.ReactNativeWebView?.postMessage) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'IMAGES_DETECTED',
                    images: [],
                    error: (e && e.message) ? e.message : String(e)
                  }));
                }
              }
            })();
            true;
          `;
          webViewRef.current.injectJavaScript(detectionCode);
        }
      }, 500); // Short delay to show scanning state

      // Store safety timeout ref to clear it when we get response
      detectionTimeoutRef.current.safetyTimeout = safetyTimeout;
    } else {
      console.error('[Browser] ❌ WebView ref is null, cannot trigger detection');
      clearTimeout(safetyTimeout);
      setScanning(false);
    }
  };

  const handleError = () => {
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
    debugLog('[Browser] Crop complete, navigating to add-item:', croppedUri);
    setShowCropOverlay(false);

    const sourceUrl = currentUrl || activeTab?.currentUrl || '';

    // Navigate to add-item screen with cropped image
    router.push({
      pathname: '/add-item',
      params: {
        imageUrl: croppedUri,
        source: 'web_capture_manual',
        sourceUrl,
      },
    });
  };

  const handleCropCancel = () => {
    debugLog('[Browser] Crop cancelled');
    setShowCropOverlay(false);
  };

  const handleGoBack = () => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
    }
  };

  const handleGoForward = () => {
    if (canGoForward && webViewRef.current) {
      webViewRef.current.goForward();
    }
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
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            {/* Exit Button */}
            <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
              <Text style={styles.exitIcon}>✕</Text>
            </TouchableOpacity>

            {/* Tabs Carousel with Favicons */}
            <View style={styles.tabsContainer}>
              <TabsCarousel />
            </View>

            {/* Cart Button */}
            <CartButton />
          </View>

          {/* WebView Container - wrapped for screenshot capture */}
          <View ref={webViewContainerRef} style={styles.webViewContainer}>
            <WebView
              key={activeTabId} // CRITICAL: Force re-render when tab changes
              ref={webViewRef}
              source={{ uri: activeTab.currentUrl }}
              userAgent={MOBILE_USER_AGENT}
              onNavigationStateChange={handleNavigationStateChange}
              onMessage={handleMessage}
              onLoadEnd={handleLoadEnd}
              onError={handleError}
              // Preload optimization script runs before page loads
              injectedJavaScriptBeforeContentLoaded={preloadOptimizationScript}
              // Detection script runs after page loads
              injectedJavaScript={imageDetectionScript}
              // Navigation & Gestures
              allowsBackForwardNavigationGestures
              // Cache & Storage - Android optimizations
              cacheEnabled={true}
              cacheMode={Platform.OS === 'android' ? 'LOAD_CACHE_ELSE_NETWORK' : undefined}
              domStorageEnabled={true}
              sharedCookiesEnabled
              incognito={false}
              thirdPartyCookiesEnabled={false}
              // ANDROID PERFORMANCE CRITICAL OPTIMIZATIONS
              androidLayerType={Platform.OS === 'android' ? 'hardware' : undefined}
              nestedScrollEnabled={Platform.OS === 'android'}
              overScrollMode="never"
              // Performance Optimization
              javaScriptEnabled
              javaScriptCanOpenWindowsAutomatically={false}
              setBuiltInZoomControls={false}
              scrollEnabled={true}
              // Security
              mixedContentMode="never"
              geolocationEnabled={false}
              allowsInlineMediaPlayback={false}
              mediaPlaybackRequiresUserAction={true}
              style={styles.webView}
            />
          </View>

          {/* Bottom Navigation Bar */}
          <View style={styles.bottomBar}>
            {/* Navigation Buttons (Left) */}
            <View style={styles.navButtonsContainer}>
              <TouchableOpacity
                style={[styles.navButton, !canGoBack && styles.navButtonDisabled]}
                onPress={handleGoBack}
                disabled={!canGoBack}
              >
                <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navButton, !canGoForward && styles.navButtonDisabled]}
                onPress={handleGoForward}
                disabled={!canGoForward}
              >
                <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Scan Button (Right) */}
            <TouchableOpacity
              style={[
                styles.scanButton,
                isScanning && styles.scanButtonScanning,
                hasScanned && detectedImages.length === 0 && styles.scanButtonManual,
              ]}
              onPress={
                isScanning
                  ? () => {}
                  : hasScanned && detectedImages.length === 0
                    ? () => setShowCropOverlay(true)
                    : handleScan
              }
              disabled={isScanning}
            >
              {isScanning ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.scanButtonText}>Скан...</Text>
                </>
              ) : hasScanned && detectedImages.length === 0 ? (
                <>
                  <Ionicons name="cut" size={20} color="#FFFFFF" />
                  <Text style={styles.scanButtonText}>Вырезать</Text>
                </>
              ) : (
                <>
                  <Ionicons name="search" size={20} color="#FFFFFF" />
                  <Text style={styles.scanButtonText}>Сканировать</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Gallery Bottom Sheet */}
          <GalleryBottomSheet />

          {/* WebView Crop Overlay */}
          <WebViewCropOverlay
            visible={showCropOverlay}
            viewShotRef={webViewContainerRef}
            onCropComplete={handleCropComplete}
            onCancel={handleCropCancel}
          />
        </View>
      </SafeAreaView>
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
    flex: 1,
  },
  topBar: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#E5E5E5',
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 52,
    paddingHorizontal: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
        marginTop: (StatusBar.currentHeight || 24) + 8, // StatusBar + дополнительный отступ
        paddingTop: 4,
      },
    }),
  },
  exitButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
  },
  exitIcon: {
    color: '#333333',
    fontSize: 24,
  },
  tabsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E5E5E5',
    borderTopWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
        paddingBottom: 32, // Увеличенный отступ для системной навигации (gesture bar / buttons)
        marginBottom: 4,
      },
    }),
  },
  navButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  scanButton: {
    flexDirection: 'row',
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 22,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  scanButtonScanning: {
    backgroundColor: '#333333',
  },
  scanButtonManual: {
    backgroundColor: '#34C759',
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
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
