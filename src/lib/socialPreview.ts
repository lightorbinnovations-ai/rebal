/**
 * Social Preview URL utilities
 * 
 * SHORT LINKS (recommended): Use `rebal.site/r/{code}` which:
 * - Looks professional (branded domain)
 * - Works for crawlers (edge function serves OG tags)
 * - Tracks clicks
 * 
 * DIRECT PREVIEW: For pages without short links, falls back to edge function URL
 */

import { BASE_URL } from "./constants";

// Use environment variable for Supabase URL to ensure correct project
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://ywnisvgweuirqhocllga.supabase.co";

/**
 * Get the user-friendly branded URL (for display)
 */
export function getDisplayUrl(path: string, customDomain?: string | null): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (customDomain) {
    return `https://${customDomain}${normalizedPath}`;
  }
  return `${BASE_URL}${normalizedPath}`;
}

/**
 * Get the short link URL (branded domain + edge function for OG)
 * This is the BEST option - clean URL that works with social previews
 */
export function getShortLinkUrl(shortCode: string, customDomain?: string | null): string {
  // Use the branded /r/ link which is now proxied by Netlify to the edge function
  // This gives us both:
  // 1. Clean URL (rebal.site/r/code)
  // 2. Proper OG tags (via proxy to edge function)
  if (customDomain) {
    return `https://${customDomain}/r/${shortCode}`;
  }
  return `${BASE_URL}/r/${shortCode}`;
}

/**
 * Get the display short link (what users see)
 */
export function getDisplayShortLinkUrl(shortCode: string, customDomain?: string | null): string {
  // If we want short links on custom domain, we'd need to handle /r/:code on the custom domain
  // Since our CustomDomainWrapper doesn't handle /r/, we'll stick to BASE_URL for short links for now
  // OR we could add /r/ route to CustomDomainWrapper
  if (customDomain) {
    return `https://${customDomain}/r/${shortCode}`;
  }
  return `${BASE_URL}/r/${shortCode}`;
}

/**
 * Get the social preview URL that serves proper OG meta tags to crawlers
 * Used when no short link exists
 */
export function getSocialPreviewUrl(path: string, customDomain?: string | null): string {
  // Use the /s/ proxy to ensure we get Dynamic OG Tags (defined by Edge Function)
  // instead of the static index.html tags.
  // Netlify proxies /s/* -> Edge Function -> Redirects to actual page
  const normalizedPath = path.startsWith("/") ? path.substring(1) : path;

  if (customDomain) {
    return `https://${customDomain}/s/${normalizedPath}`;
  }
  return `${BASE_URL}/s/${normalizedPath}`;
}

/**
 * Generate share URLs for different platforms
 * Prefers short links when available, falls back to social-preview
 */
export function getShareUrls(path: string, text: string, shortCode?: string, customDomain?: string | null) {
  // If we have a short code, use the short link redirect (clean + works)
  const shareUrl = shortCode
    ? getShortLinkUrl(shortCode, customDomain)
    : getSocialPreviewUrl(path, customDomain);

  const encodedShareUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(text);

  // Display URL for text content (What gets pasted in the description)
  const displayUrl = shortCode
    ? getDisplayShortLinkUrl(shortCode, customDomain)
    : getDisplayUrl(path, customDomain);

  return {
    // Social platforms - use share URL for proper OG crawling
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedShareUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedShareUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedShareUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedShareUrl}`,
    telegram: `https://t.me/share/url?url=${encodedShareUrl}&text=${encodedText}`,
    // For copying - show the branded short link or full path
    copy: displayUrl,
    // The actual URL to copy for sharing (with OG support)
    shareable: shareUrl,
  };
}

/**
 * Copy the shareable URL to clipboard
 * Uses short link if available, otherwise social-preview URL
 */
export async function copyShareableUrl(path: string, shortCode?: string, customDomain?: string | null): Promise<boolean> {
  try {
    const url = shortCode
      ? getShortLinkUrl(shortCode, customDomain)
      : getSocialPreviewUrl(path, customDomain);
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * @deprecated Use copyShareableUrl instead
 */
export async function copySocialPreviewUrl(path: string, customDomain?: string | null): Promise<boolean> {
  return copyShareableUrl(path, undefined, customDomain);
}
