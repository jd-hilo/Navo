import { Image } from 'react-native';

export interface PreloadResult {
  url: string;
  success: boolean;
  error?: string;
}

export interface PreloadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Preload a single image with timeout
 */
const preloadSingleImage = async (
  url: string,
  timeoutMs: number = 5000
): Promise<PreloadResult> => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return { url, success: false, error: 'Invalid URL' };
  }

  try {
    // Create a promise that races between prefetch and timeout
    const prefetchPromise = Image.prefetch(url);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    );

    await Promise.race([prefetchPromise, timeoutPromise]);
    return { url, success: true };
  } catch (error) {
    console.warn(`Failed to preload image: ${url}`, error);
    return {
      url,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Preload multiple images concurrently with progress tracking
 */
export const preloadImages = async (
  urls: string[],
  options?: {
    concurrency?: number;
    timeoutMs?: number;
    onProgress?: (progress: PreloadProgress) => void;
  }
): Promise<PreloadResult[]> => {
  const {
    concurrency = 5,
    timeoutMs = 5000,
    onProgress,
  } = options || {};

  // Filter out invalid URLs
  const validUrls = urls.filter(
    (url) => url && typeof url === 'string' && url.trim() !== ''
  );

  if (validUrls.length === 0) {
    return [];
  }

  const results: PreloadResult[] = [];
  let completed = 0;

  // Process images in batches for better performance
  for (let i = 0; i < validUrls.length; i += concurrency) {
    const batch = validUrls.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((url) => preloadSingleImage(url, timeoutMs))
    );

    results.push(...batchResults);
    completed += batch.length;

    // Report progress
    if (onProgress) {
      onProgress({
        loaded: completed,
        total: validUrls.length,
        percentage: Math.round((completed / validUrls.length) * 100),
      });
    }
  }

  return results;
};

/**
 * Extract image URLs from search results
 */
export const extractImageUrls = (searchResults: any): string[] => {
  const urls: string[] = [];

  // Extract TikTok video thumbnails
  if (searchResults?.tiktok?.videos) {
    searchResults.tiktok.videos.forEach((video: any) => {
      if (video.thumbnail) {
        urls.push(video.thumbnail);
      }
    });
  }

  // Extract Reddit post images
  if (searchResults?.reddit?.posts) {
    searchResults.reddit.posts.forEach((post: any) => {
      if (post.media) {
        urls.push(post.media);
      }
      if (post.thumbnail) {
        urls.push(post.thumbnail);
      }
    });
  }

  // Extract Pinterest pin images
  if (searchResults?.pinterest?.pins) {
    searchResults.pinterest.pins.forEach((pin: any) => {
      if (pin.image_url) {
        urls.push(pin.image_url);
      }
    });
  }

  // Remove duplicates
  return [...new Set(urls)];
};

/**
 * Preload critical images for search results
 */
export const preloadSearchResultImages = async (
  searchResults: any,
  options?: {
    onProgress?: (progress: PreloadProgress) => void;
  }
): Promise<{ success: boolean; results: PreloadResult[] }> => {
  const imageUrls = extractImageUrls(searchResults);

  console.log(`📸 Preloading ${imageUrls.length} images...`);

  if (imageUrls.length === 0) {
    return { success: true, results: [] };
  }

  const results = await preloadImages(imageUrls, {
    concurrency: 8, // Higher concurrency for faster preload
    timeoutMs: 5000,
    onProgress: options?.onProgress,
  });

  const successCount = results.filter((r) => r.success).length;
  const successRate = (successCount / results.length) * 100;

  console.log(
    `✅ Preloaded ${successCount}/${results.length} images (${successRate.toFixed(1)}%)`
  );

  // Consider it successful if at least 70% of images loaded
  return {
    success: successRate >= 70,
    results,
  };
};

