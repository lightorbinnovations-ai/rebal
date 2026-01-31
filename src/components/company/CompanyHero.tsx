import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CompanyProfile } from "@/types/company";
import { Building, Phone, BadgeCheck } from "lucide-react";
import { DEFAULT_HERO_IMAGES } from "@/lib/defaultHeroImages";
import { CompanyButton } from "./CompanyButton";

interface CompanyHeroProps {
  company: CompanyProfile;
}

export const CompanyHero = ({ company }: CompanyHeroProps) => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLElement>(null);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        // Only apply parallax when hero is visible
        if (rect.bottom > 0) {
          setScrollY(window.scrollY);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Rotate through default images every 8 seconds if no custom hero
  useEffect(() => {
    if (company.hero_image_url) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % DEFAULT_HERO_IMAGES.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [company.hero_image_url]);

  // Use custom hero or rotating default
  const heroImage = company.hero_image_url || DEFAULT_HERO_IMAGES[currentImageIndex];

  // Calculate parallax offset (slower movement for background)
  const parallaxOffset = scrollY * 0.4;

  // We rely on CSS variables set by useCompanyBranding for colors
  // But for the Hero background gradient (fallback), we might use the hex values from company if needed
  // However, standardizing on black/dark overlay is better for text readability.
  const primaryColor = company.primary_color || "#0F172A";

  return (
    <section
      ref={heroRef}
      id="top"
      className="relative min-h-[70vh] sm:min-h-[75vh] lg:min-h-[80vh] flex items-center justify-center overflow-hidden bg-background"
    >
      {/* Hero Image Overlay with parallax effect */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 will-change-transform"
        style={{
          backgroundImage: `url(${heroImage})`,
          transform: `translateY(${parallaxOffset}px) scale(1.1)`,
        }}
      />

      {/* Gradient overlay for better text readability */}
      {/* Used strict black overlay to ensure white text is readable regardless of theme */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

      {/* Floating Elements (Subtle) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-48 h-48 lg:w-64 lg:h-64 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-56 h-56 lg:w-80 lg:h-80 bg-secondary/20 rounded-full blur-3xl animate-float-delayed" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center py-8">
        <div className="max-w-4xl mx-auto">
          {/* Company Name */}
          <h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 animate-fade-up leading-tight drop-shadow-lg"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {company.name}
          </h1>

          {/* Tagline */}
          {company.tagline && (
            <p
              className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 mb-3 sm:mb-4 animate-fade-up animation-delay-100 px-4 drop-shadow-md"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {company.tagline}
            </p>
          )}

          {/* Description */}
          {company.description && (
            <p
              className="text-sm sm:text-base lg:text-lg text-white/80 mb-6 sm:mb-8 max-w-2xl mx-auto animate-fade-up animation-delay-200 px-4 line-clamp-3 sm:line-clamp-none drop-shadow-sm"
              style={{ fontFamily: "var(--font-body)" }}
            >
              <span className="hidden sm:inline">
                {company.description.slice(0, 180)}
                {company.description.length > 180 ? "..." : ""}
              </span>
              <span className="sm:hidden">
                {company.description.slice(0, 100)}
                {company.description.length > 100 ? "..." : ""}
              </span>
            </p>
          )}

          {/* CTA Buttons - Using CompanyButton for strict theme compliance */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-fade-up animation-delay-300 px-4">
            <CompanyButton
              onClick={() => navigate(`/${company.slug}/properties`)}
              className="px-8 py-6 text-base sm:text-lg shadow-xl hover:scale-105 transition-transform"
            >
              <Building className="h-5 w-5 mr-2" />
              View Properties
            </CompanyButton>

            <CompanyButton
              onClick={() => navigate(`/${company.slug}/contact`)}
              variant="outline"
              className="px-8 py-6 text-base sm:text-lg border-white/30 text-white hover:bg-white/10 hover:border-white/50 bg-transparent shadow-lg"
            >
              <Phone className="h-5 w-5 mr-2" />
              Contact Us
            </CompanyButton>
          </div>

          {/* Verification Badge */}
          {company.is_verified && (
            <div className="mt-6 sm:mt-8 animate-fade-up animation-delay-400 px-4">
              <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium shadow-lg border border-white/10">
                <BadgeCheck className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" /> {/* Secondary color for verification check usually green */}
                Verified Business
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Image Indicators */}
      {!company.hero_image_url && (
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {DEFAULT_HERO_IMAGES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${index === currentImageIndex
                  ? "bg-white w-6 opacity-100"
                  : "bg-white/50 hover:bg-white/80"
                }`}
              aria-label={`Show image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};
