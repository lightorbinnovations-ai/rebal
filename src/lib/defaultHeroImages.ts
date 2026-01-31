// Default hero images for companies
import defaultHero1 from "@/assets/default-hero-1.webp";
import defaultHero2 from "@/assets/default-hero-2.webp";
import defaultHero3 from "@/assets/default-hero-3.webp";
import defaultHero4 from "@/assets/default-hero-4.webp";
import defaultHero5 from "@/assets/default-hero-5.webp";
import defaultHero6 from "@/assets/default-hero-6.webp";

export interface DefaultHeroOption {
  id: string;
  src: string;
  name: string;
  category: string;
}

export const DEFAULT_HERO_OPTIONS: DefaultHeroOption[] = [
  { id: "luxury-homes", src: defaultHero1, name: "Luxury Homes", category: "Residential" },
  { id: "city-skyline", src: defaultHero2, name: "City Skyline", category: "Urban" },
  { id: "modern-villa", src: defaultHero3, name: "Modern Villa", category: "Residential" },
  { id: "beachfront", src: defaultHero4, name: "Beachfront Paradise", category: "Vacation" },
  { id: "penthouse", src: defaultHero5, name: "Luxury Interior", category: "Interior" },
  { id: "community", src: defaultHero6, name: "Gated Community", category: "Suburban" },
];

// For rotating slideshow (used when no specific selection or custom upload)
export const DEFAULT_HERO_IMAGES = DEFAULT_HERO_OPTIONS.map((opt) => opt.src);

// Get a specific hero image by ID
export function getHeroById(id: string): string | undefined {
  return DEFAULT_HERO_OPTIONS.find((opt) => opt.id === id)?.src;
}

// Check if a URL is a default hero (for detecting custom uploads)
export function isDefaultHero(url: string): boolean {
  return DEFAULT_HERO_IMAGES.some((src) => url === src || url.includes(src));
}
