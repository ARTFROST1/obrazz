/**
 * Logo Fetcher Utility
 *
 * Fetches favicons for custom user stores.
 * Default stores use local assets from constants/storeLogos.ts
 */

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

/**
 * Get favicon URL from site
 * Uses Google's favicon service which is reliable for most sites
 */
export function getStoreFavicon(url: string): string {
  const domain = extractDomain(url);
  // Google's favicon service - works reliably in React Native
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

/**
 * Fallback: Try to get favicon directly from site
 */
export function getDirectFavicon(url: string): string {
  const domain = extractDomain(url);
  return `https://${domain}/favicon.ico`;
}
