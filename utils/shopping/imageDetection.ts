/**
 * Image detection script to be injected into WebView
 * Detects clothing images on web pages
 * Optimized for performance - self-contained and callable
 */
export const imageDetectionScript = `
(function() {
  var __obrazzDebug = !!window.__OBRAZZ_DEBUG;
  
  // Pre-compiled regex for keywords (faster than array.some)
  const keywordPattern = /product|clothing|fashion|dress|shirt|pants|jacket|shoe|skirt|coat|sweater|jeans|apparel|wear|style|outfit|товар|одежда|item|model|look|collection/i;

  function getImageSrc(img) {
    // Prefer currentSrc (handles srcset / <picture>), then common lazy-load attrs.
    return (
      img.currentSrc ||
      img.src ||
      img.getAttribute('data-src') ||
      img.getAttribute('data-original') ||
      img.getAttribute('data-lazy') ||
      img.getAttribute('data-image') ||
      ''
    );
  }

  // Helper function to find product URL from image parent elements
  function findProductUrl(img) {
    let element = img;
    let depth = 0;
    const maxDepth = 5; // Search up to 5 parent elements
    
    while (element && depth < maxDepth) {
      // Check if current element is a link
      if (element.tagName === 'A' && element.href) {
        const href = element.href;
        if (__obrazzDebug) console.log('[ProductUrl] Depth', depth, 'found link:', href);
        // Filter out clearly non-product links.
        // IMPORTANT: do NOT filter out "catalog" — many stores use /catalog/... for product pages.
        if (!/\/(cart|checkout|login|register|account)\b/i.test(href) &&
            !/\bsearch\b/i.test(href)) {
          if (__obrazzDebug) console.log('[ProductUrl] Valid product URL:', href);
          return href;
        } else {
          if (__obrazzDebug) console.log('[ProductUrl] Filtered out:', href);
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
    // Minimum size filter (relaxed: many stores render 120-180px thumbnails)
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;

    if (width < 120 || height < 120) return false;

    // Aspect ratio check (relaxed)
    const aspectRatio = width / height;
    if (aspectRatio < 0.35 || aspectRatio > 2.5) return false;

    // Use regex for faster keyword matching
    const src = getImageSrc(img);
    const alt = img.alt || '';
    const className = img.className || '';
    const parentClass = img.parentElement?.className || '';

    const hasKeyword = keywordPattern.test(src) || 
                       keywordPattern.test(alt) || 
                       keywordPattern.test(className) || 
                       keywordPattern.test(parentClass);

    // If has keyword or decent aspect ratio, likely clothing
    return hasKeyword || (aspectRatio >= 0.5 && aspectRatio <= 1.8);
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
    if (__obrazzDebug) console.log('[ImageDetection] Starting detection...');
    const startTime = performance.now();
    
    const images = document.querySelectorAll('img');
    if (__obrazzDebug) console.log('[ImageDetection] Found', images.length, 'img elements on page');
    
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
        const imgSrc = getImageSrc(img);

        // Skip invalid / non-network sources
        if (!imgSrc || /^data:/i.test(imgSrc) || /^blob:/i.test(imgSrc)) continue;

        // Skip duplicates by URL
        if (seenUrls.has(imgSrc)) continue;
        seenUrls.add(imgSrc);

        // Generate unique ID with fast hash
        const timestamp = Date.now();
        const urlHash = fastHash(imgSrc);
        const id = \`img_\${timestamp}_\${counter++}_\${urlHash}\`;

        // Try to find product URL from parent elements
        const productUrl = findProductUrl(img);
        if (__obrazzDebug && productUrl) {
          console.log('[ImageDetection] Product URL found:', imgSrc.substring(0, 80), '→', productUrl);
        }

        detectedImages.push({
          id: id,
          url: imgSrc,
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          alt: img.alt || '',
          productUrl: productUrl || undefined
        });
      }
    }

    const endTime = performance.now();
    if (__obrazzDebug) {
      console.log('[ImageDetection] Detection completed in', Math.round(endTime - startTime), 'ms');
      console.log('[ImageDetection] Stats:', {
        total: totalImages,
        loaded: loadedImages,
        detected: detectedImages.length,
        unloaded: totalImages - loadedImages,
      });
    }

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
        if (__obrazzDebug) console.log('[ImageDetection] Sending', detectedImages.length, 'images to React Native');
        window.ReactNativeWebView.postMessage(message);
        if (__obrazzDebug) console.log('[ImageDetection] Message sent successfully');
      } else {
        console.error('[ImageDetection] ❌ ReactNativeWebView.postMessage is NOT available!');
        console.error('[ImageDetection] window.ReactNativeWebView:', window.ReactNativeWebView);
      }
    } catch (error) {
      console.error('[ImageDetection] ❌ Error posting message:', error);
      console.error('[ImageDetection] Error details:', error.message, error.stack);
    }
  };

  if (__obrazzDebug) {
    console.log('[ImageDetection] Detection system ready');
  }
})();
true;
`;
