import { useState, useEffect, useCallback } from "react";

interface RecentlyViewedProperty {
  id: string;
  slug: string;
  title: string;
  price: number;
  property_type: string;
  purpose: string;
  location?: string;
  main_image_url?: string;
  company_slug: string;
  viewed_at: number;
}

const STORAGE_KEY = "rebal-recently-viewed";
const MAX_ITEMS = 10;

export const useRecentlyViewed = (companySlug?: string) => {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedProperty[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed: RecentlyViewedProperty[] = JSON.parse(stored);
        // Filter by company slug if provided
        const filtered = companySlug 
          ? parsed.filter(p => p.company_slug === companySlug)
          : parsed;
        setRecentlyViewed(filtered);
      } catch {
        setRecentlyViewed([]);
      }
    }
  }, [companySlug]);

  // Add a property to recently viewed
  const addToRecentlyViewed = useCallback((property: {
    id: string;
    slug: string;
    title: string;
    price: number;
    property_type: string;
    purpose: string;
    location?: string | null;
    main_image_url?: string | null;
  }, companySlug: string) => {
    const newItem: RecentlyViewedProperty = {
      id: property.id,
      slug: property.slug,
      title: property.title,
      price: property.price,
      property_type: property.property_type,
      purpose: property.purpose,
      location: property.location || undefined,
      main_image_url: property.main_image_url || undefined,
      company_slug: companySlug,
      viewed_at: Date.now(),
    };

    // Get all items from storage (not filtered by company)
    const stored = localStorage.getItem(STORAGE_KEY);
    let allItems: RecentlyViewedProperty[] = [];
    if (stored) {
      try {
        allItems = JSON.parse(stored);
      } catch {
        allItems = [];
      }
    }

    // Remove if already exists
    allItems = allItems.filter(p => p.id !== property.id);

    // Add to front
    allItems.unshift(newItem);

    // Limit to MAX_ITEMS
    allItems = allItems.slice(0, MAX_ITEMS);

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allItems));

    // Update state (filtered by current company if applicable)
    setRecentlyViewed(
      companySlug 
        ? allItems.filter(p => p.company_slug === companySlug)
        : allItems
    );
  }, []);

  // Clear all recently viewed
  const clearRecentlyViewed = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setRecentlyViewed([]);
  }, []);

  return {
    recentlyViewed,
    addToRecentlyViewed,
    clearRecentlyViewed,
  };
};