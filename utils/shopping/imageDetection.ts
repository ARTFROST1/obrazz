/**
 * Image detection script to be injected into WebView
 * Detects clothing images on web pages
 * Optimized for performance - self-contained and callable
 */
export const imageDetectionScript = `
(function() {
  console.log('[ImageDetection] Initializing detection system...');
  
  // Pre-compiled regex for keywords (faster than array.some)
  const keywordPattern = /product|clothing|fashion|dress|shirt|pants|jacket|shoe|skirt|coat|sweater|jeans|apparel|wear|style|outfit|товар|одежда|item|model|look|collection/i;

  // Helper function to find product URL from image parent elements
  function findProductUrl(img) {
    let element = img;
    let depth = 0;
    const maxDepth = 5; // Search up to 5 parent elements
    
    while (element && depth < maxDepth) {
      // Check if current element is a link
      if (element.tagName === 'A' && element.href) {
        const href = element.href;
        // Filter out non-product links (cart, search, category lists, etc.)
        if (!/\\/(cart|search|category|collection|catalog|list|filter)[\\/\\?]/i.test(href) &&
            !/\\/(login|register|account|checkout)/i.test(href)) {
          return href;
        }
      }
      // Check for data attributes that might contain product URLs
      if (element.dataset && (element.dataset.href || element.dataset.url || element.dataset.link)) {
        return element.dataset.href || element.dataset.url || element.dataset.link;
      }
      element = element.parentElement;
      depth++;
    }
    return null;
  }

  // Helper function to check if image is likely clothing
  function isClothingImage(img) {
    // Skip if image not loaded yet
    if (!img.complete) return false;

    // Minimum size filter (200x200px)
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;

    if (width < 200 || height < 200) return false;

    // Aspect ratio check (0.5 to 1.5, preferably 0.6 to 1.2)
    const aspectRatio = width / height;
    if (aspectRatio < 0.5 || aspectRatio > 1.5) return false;

    // Use regex for faster keyword matching
    const src = img.src;
    const alt = img.alt || '';
    const className = img.className || '';
    const parentClass = img.parentElement?.className || '';

    const hasKeyword = keywordPattern.test(src) || 
                       keywordPattern.test(alt) || 
                       keywordPattern.test(className) || 
                       keywordPattern.test(parentClass);

    // If has keyword or good aspect ratio (0.6-1.2), likely clothing
    return hasKeyword || (aspectRatio >= 0.6 && aspectRatio <= 1.2);
  }

  // Fast hash function for URL deduplication
  function fastHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  // Main detection function - exposed globally for direct calls
  window.__obrazzDetectImages = function() {
    console.log('[ImageDetection] 🔍 Starting detection...');
    console.log('[ImageDetection] ReactNativeWebView available:', !!window.ReactNativeWebView);
    const startTime = performance.now();
    
    const images = document.querySelectorAll('img');
    console.log('[ImageDetection] Found', images.length, 'img elements on page');
    
    const detectedImages = [];
    const seenUrls = new Set();
    let counter = 0;
    let totalImages = 0;
    let loadedImages = 0;

    // Use for loop instead of forEach for better performance
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      totalImages++;

      if (!img.complete) continue; // Skip unloaded images
      loadedImages++;

      if (isClothingImage(img)) {
        // Skip duplicates by URL
        if (seenUrls.has(img.src)) continue;
        seenUrls.add(img.src);

        // Generate unique ID with fast hash
        const timestamp = Date.now();
        const urlHash = fastHash(img.src);
        const id = \`img_\${timestamp}_\${counter++}_\${urlHash}\`;

        // Try to find product URL from parent elements
        const productUrl = findProductUrl(img);

        detectedImages.push({
          id: id,
          url: img.src,
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          alt: img.alt || '',
          productUrl: productUrl || undefined
        });
      }
    }

    const endTime = performance.now();
    console.log('[ImageDetection] ✅ Detection completed in', Math.round(endTime - startTime), 'ms');
    console.log('[ImageDetection] Stats:', {
      total: totalImages,
      loaded: loadedImages,
      detected: detectedImages.length,
      unloaded: totalImages - loadedImages
    });

    // Send results back to React Native
    try {
      if (window.ReactNativeWebView?.postMessage) {
        const message = JSON.stringify({
          type: 'IMAGES_DETECTED',
          images: detectedImages,
          timestamp: Date.now(),
          stats: {
            total: totalImages,
            loaded: loadedImages,
            detected: detectedImages.length,
            processingTime: Math.round(endTime - startTime)
          }
        });
        console.log('[ImageDetection] 📤 Sending', detectedImages.length, 'images to React Native');
        window.ReactNativeWebView.postMessage(message);
        console.log('[ImageDetection] ✅ Message sent successfully');
      } else {
        console.error('[ImageDetection] ❌ ReactNativeWebView.postMessage is NOT available!');
        console.error('[ImageDetection] window.ReactNativeWebView:', window.ReactNativeWebView);
      }
    } catch (error) {
      console.error('[ImageDetection] ❌ Error posting message:', error);
      console.error('[ImageDetection] Error details:', error.message, error.stack);
    }
  };

  console.log('[ImageDetection] ✅ Detection system ready');
  console.log('[ImageDetection] Call window.__obrazzDetectImages() to scan');
})();
true;
`;
