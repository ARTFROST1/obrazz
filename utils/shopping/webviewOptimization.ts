/**
 * WebView optimization utilities
 * Scripts to improve page loading performance
 */

/**
 * Injected script to optimize page loading
 * - Blocks ads and tracking scripts
 * - Removes unnecessary elements
 * - Optimizes images loading
 */
export const pageOptimizationScript = `
(function() {
  if (window.__obrazzOptimizationInitialized) return;
  window.__obrazzOptimizationInitialized = true;

  var __obrazzDebug = !!window.__OBRAZZ_DEBUG;

  // Block common ad/tracking domains
  const blockedDomains = [
    'google-analytics.com',
    'googletagmanager.com',
    'doubleclick.net',
    'facebook.net',
    'scorecardresearch.com',
    'yandex.ru/metrika',
    'mc.yandex.ru'
  ];

  // Override fetch to block tracking requests
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0]?.toString() || '';
    if (blockedDomains.some(domain => url.includes(domain))) {
      if (__obrazzDebug) console.log('[PageOptimization] Blocked tracking request:', url.substring(0, 80));
      return Promise.reject(new Error('Blocked by Obrazz'));
    }
    return originalFetch.apply(this, args);
  };

  // Lazy load images using Intersection Observer
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      }
    });
  }, {
    rootMargin: '50px 0px',
    threshold: 0.01
  });

  // Optimize all images on page
  function optimizeImages() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
      // Use browser native lazy loading
      if ('loading' in HTMLImageElement.prototype) {
        img.loading = 'lazy';
      } else {
        // Fallback to Intersection Observer for older browsers
        imageObserver.observe(img);
      }
    });
  }

  // Run optimizations when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', optimizeImages);
  } else {
    optimizeImages();
  }

  // Remove unnecessary elements for faster rendering
  function removeUnnecessaryElements() {
    // Remove chat widgets, popups, etc.
    const selectors = [
      '[class*="chat"]',
      '[class*="popup"]',
      '[class*="modal"]',
      '[id*="cookie"]',
      '[class*="newsletter"]'
    ];

    selectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          // Only remove if it's overlay/fixed positioned
          const style = window.getComputedStyle(el);
          if (style.position === 'fixed' || style.position === 'absolute') {
            el.remove();
          }
        });
      } catch (e) {
        // Ignore errors from invalid selectors
      }
    });
  }

  // Run cleanup after page load
  setTimeout(removeUnnecessaryElements, 1000);

  if (__obrazzDebug) console.log('[PageOptimization] Optimizations initialized');
})();
true;
`;

/**
 * Pre-loading optimization script
 * Runs before page content loads
 */
export const preloadOptimizationScript = `
(function() {
  // Keep logs disabled by default in production.
  if (typeof window.__OBRAZZ_DEBUG === 'undefined') window.__OBRAZZ_DEBUG = false;

  // Set viewport for mobile optimization
  if (!document.querySelector('meta[name="viewport"]')) {
    const viewport = document.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
    document.head.appendChild(viewport);
  }

  // Add DNS prefetch for common CDNs
  const cdnDomains = [
    'cdn.shopify.com',
    'cdn.jsdelivr.net',
    'cdnjs.cloudflare.com',
    'images.unsplash.com'
  ];

  cdnDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = '//' + domain;
    document.head.appendChild(link);
  });

  if (window.__OBRAZZ_DEBUG) console.log('[PreloadOptimization] DNS prefetch configured');
})();
true;
`;

/**
 * Configuration for WebView performance props
 */
export const webViewPerformanceConfig = {
  // Cache settings
  cacheEnabled: true,

  // Storage
  domStorageEnabled: true,

  // Security & Privacy
  geolocationEnabled: false,
  allowsInlineMediaPlayback: false,
  mediaPlaybackRequiresUserAction: true,

  // Zoom
  setBuiltInZoomControls: false,

  // Loading
  startInLoadingState: true,

  // Scroll
  scrollEnabled: true,
};
