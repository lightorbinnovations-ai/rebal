import { useEffect } from "react";
import { BASE_URL } from "@/lib/constants";

interface SEOProps {
  title: string;
  description?: string;
  image?: string | null;
  keywords?: string[];
  type?: "website" | "article";
  url?: string;
  noindex?: boolean;
}

/**
 * Hook to dynamically update document meta tags for SEO and social sharing
 * Note: Social media crawlers (WhatsApp, Facebook, etc.) don't execute JavaScript,
 * so these meta tags won't be seen by them. For proper social sharing, generate 
 * shareable URLs through the og-meta edge function or use the share buttons.
 */
export const useSEO = ({
  title,
  description,
  image,
  keywords,
  type = "website",
  url,
  noindex = false,
}: SEOProps) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Helper to update or create meta tag
    const updateMeta = (
      selector: string,
      content: string,
      attribute: "name" | "property" = "name"
    ) => {
      let tag = document.querySelector(selector);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attribute === "property" ? "property" : "name",
          selector.replace(/^meta\[(name|property)="([^"]+)"\]$/, "$2"));
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    // Helper to update or create link tag
    const updateLink = (rel: string, href: string) => {
      const selector = `link[rel="${rel}"]`;
      let tag = document.querySelector(selector);
      if (!tag) {
        tag = document.createElement("link");
        tag.setAttribute("rel", rel);
        document.head.appendChild(tag);
      }
      tag.setAttribute("href", href);
    };

    // Base URL for absolute URLs - using imported constant

    // Update description
    if (description) {
      updateMeta('meta[name="description"]', description);
      updateMeta('meta[property="og:description"]', description, "property");
      updateMeta('meta[name="twitter:description"]', description);
    }

    // Update title tags
    updateMeta('meta[property="og:title"]', title, "property");
    updateMeta('meta[name="twitter:title"]', title);

    // Update type
    updateMeta('meta[property="og:type"]', type, "property");

    // Update URL and canonical
    const currentUrl = url
      ? (url.startsWith("http") ? url : `${BASE_URL}${url.startsWith("/") ? url : `/${url}`}`)
      : window.location.href.replace(window.location.origin, BASE_URL);
    updateMeta('meta[property="og:url"]', currentUrl, "property");
    updateLink("canonical", currentUrl);

    // Update image - make sure it's an absolute URL
    if (image) {
      const absoluteImage = image.startsWith("http")
        ? image
        : `${BASE_URL}${image.startsWith("/") ? image : `/${image}`}`;
      updateMeta('meta[property="og:image"]', absoluteImage, "property");
      updateMeta('meta[name="twitter:image"]', absoluteImage);
      updateMeta('meta[name="twitter:card"]', "summary_large_image");
    }

    // Update keywords
    if (keywords && keywords.length > 0) {
      updateMeta('meta[name="keywords"]', keywords.join(", "));
    }

    // Handle robots/noindex
    if (noindex) {
      updateMeta('meta[name="robots"]', "noindex, nofollow");
    } else {
      updateMeta('meta[name="robots"]', "index, follow");
    }
  }, [title, description, image, keywords, type, url, noindex]);
};
