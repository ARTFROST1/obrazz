/**
 * Image detection script to be injected into WebView
 * Detects clothing images on web pages
 */
export const imageDetectionScript = `
(function() {
  // Prevent multiple initializations
  if (window.__obrazzDetectionInitialized) {
    console.log('[ImageDetection] Already initialized, skipping');
    return;
  }
  window.__obrazzDetectionInitialized = true;

  // Helper function to check if image is likely clothing
  function isClothingImage(img) {
    // Skip if image not loaded yet
    if (!img.complete) {
      console.log('[ImageDetection] Image not loaded yet:', img.src.substring(0, 50));
      return false;
    }

    // Minimum size filter (200x200px)
    // Use naturalWidth/Height for actual image dimensions
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;

    if (width < 200 || height < 200) {
      return false;
    }

    // Aspect ratio check (0.5 to 1.5, preferably 0.6 to 1.2)
    const aspectRatio = width / height;
    if (aspectRatio < 0.5 || aspectRatio > 1.5) {
      return false;
    }

    // Keywords to look for in URL or alt text
    const keywords = [
      'product', 'clothing', 'fashion', 'dress', 'shirt', 'pants',
      'jacket', 'shoe', 'skirt', 'coat', 'sweater', 'jeans',
      'apparel', 'wear', 'style', 'outfit', 'товар', 'одежда',
      'item', 'model', 'look', 'collection'
    ];

    const src = img.src.toLowerCase();
    const alt = (img.alt || '').toLowerCase();
    const className = (img.className || '').toLowerCase();
    const parentClass = (img.parentElement?.className || '').toLowerCase();

    const hasKeyword = keywords.some(kw =>
      src.includes(kw) || alt.includes(kw) || className.includes(kw) || parentClass.includes(kw)
    );

    // If has keyword or good aspect ratio (0.6-1.2), likely clothing
    return hasKeyword || (aspectRatio >= 0.6 && aspectRatio <= 1.2);
  }

  // Detect images on current page
  function detectImages() {
    console.log('[ImageDetection] Starting detection...');
    const images = document.querySelectorAll('img');
    const detectedImages = [];
    const seenUrls = new Set();
    let counter = 0;
    let totalImages = 0;
    let loadedImages = 0;
    let filteredBySize = 0;
    let filteredByRatio = 0;

    images.forEach(img => {
      totalImages++;

      if (!img.complete) {
        return; // Skip unloaded images
      }

      loadedImages++;

      if (isClothingImage(img)) {
        // Skip duplicates by URL
        if (seenUrls.has(img.src)) {
          return;
        }
        seenUrls.add(img.src);

        // Generate unique ID: timestamp + counter + hash of URL
        const timestamp = Date.now();
        const urlHash = img.src.split('').reduce((hash, char) => {
          return ((hash << 5) - hash) + char.charCodeAt(0);
        }, 0);
        const id = \`img_\${timestamp}_\${counter++}_\${Math.abs(urlHash)}\`;

        detectedImages.push({
          id: id,
          url: img.src,
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          alt: img.alt || ''
        });
      }
    });

    console.log('[ImageDetection] Stats:', {
      total: totalImages,
      loaded: loadedImages,
      detected: detectedImages.length,
      unloaded: totalImages - loadedImages
    });

    // Send results back to React Native with error handling
    try {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'IMAGES_DETECTED',
          images: detectedImages,
          timestamp: Date.now(),
          stats: {
            total: totalImages,
            loaded: loadedImages,
            detected: detectedImages.length
          }
        }));
        console.log('[ImageDetection] Sent', detectedImages.length, 'images to React Native');
      } else {
        console.warn('[ImageDetection] ReactNativeWebView not available');
      }
    } catch (error) {
      console.error('[ImageDetection] Error posting message:', error);
    }
  }

  // Listen for manual trigger from React Native
  document.addEventListener('detectImages', function() {
    console.log('[ImageDetection] Manual trigger received, starting detection');
    // Run detection immediately
    detectImages();

    // Also run delayed detection to catch images that are still loading
    setTimeout(() => {
      console.log('[ImageDetection] Running delayed detection for late-loaded images');
      detectImages();
    }, 2000);
  });

  console.log('[ImageDetection] Manual detection system initialized - waiting for trigger');
})();
true; // Return true to indicate successful injection
`;
