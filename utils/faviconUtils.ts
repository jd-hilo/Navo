// Utility functions for fetching favicons

/**
 * Get favicon URL for a domain
 * @param domain - The domain (e.g., "example.com")
 * @param url - The full URL (fallback if domain doesn't work)
 * @returns Promise<string> - The favicon URL
 */
export const getFaviconUrl = async (domain: string, url?: string): Promise<string> => {
  // Try multiple favicon services
  const faviconServices = [
    `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
    `https://favicon.ico/${domain}`,
    `https://icon.horse/icon/${domain}`,
  ];

  // If we have a full URL, also try the root domain favicon
  if (url) {
    try {
      const urlObj = new URL(url);
      const rootDomain = urlObj.hostname;
      faviconServices.unshift(`https://www.google.com/s2/favicons?domain=${rootDomain}&sz=32`);
    } catch (error) {
      // Invalid URL, continue with domain-based services
    }
  }

  // Try each service until one works
  for (const serviceUrl of faviconServices) {
    try {
      const response = await fetch(serviceUrl, { method: 'HEAD' });
      if (response.ok) {
        return serviceUrl;
      }
    } catch (error) {
      // Continue to next service
      continue;
    }
  }

  // Fallback to Google's favicon service
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
};

/**
 * Get favicon URL for a domain (synchronous version for immediate use)
 * @param domain - The domain (e.g., "example.com")
 * @param url - The full URL (fallback if domain doesn't work)
 * @returns string - The favicon URL
 */
export const getFaviconUrlSync = (domain: string, url?: string): string => {
  // Return Google's favicon service as default
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
};

/**
 * Extract domain from URL
 * @param url - The full URL
 * @returns string - The domain
 */
export const extractDomain = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (error) {
    // If URL parsing fails, try to extract domain manually
    const match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/);
    return match ? match[1] : url;
  }
}; 