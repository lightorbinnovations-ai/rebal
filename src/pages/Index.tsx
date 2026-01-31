import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { InstantPreview } from "@/components/InstantPreview";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { SocialPreviewSection } from "@/components/SocialPreviewSection";
import { HomePricingSection } from "@/components/HomePricingSection";
import { TrustSection } from "@/components/TrustSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";
import { 
  SEOStructuredData, 
  getRebalOrganizationSchema, 
  getRebalWebsiteSchema 
} from "@/components/SEOStructuredData";

const Index = () => {
  const [isDark, setIsDark] = useState(false);

  // SEO meta tags for homepage
  useSEO({
    title: "REBAL - One Smart Link for Your Property Business | Real Estate Nigeria",
    description:
      "Create a professional property website and share listings instantly on WhatsApp and social media. The #1 platform for real estate agents and property developers in Nigeria.",
    keywords: [
      "real estate Nigeria",
      "property listings Nigeria",
      "real estate agent website",
      "property marketplace Lagos",
      "houses for sale Nigeria",
      "land for sale Abuja",
      "property website builder",
      "WhatsApp property sharing",
      "real estate marketing",
      "property developer Nigeria",
    ],
    url: "/",
    image: "/og-image.png",
  });

  useEffect(() => {
    // Check system preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const stored = localStorage.getItem("theme");
    
    if (stored === "dark" || (!stored && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Structured Data for SEO */}
      <SEOStructuredData data={getRebalOrganizationSchema()} />
      <SEOStructuredData data={getRebalWebsiteSchema()} />
      
      <Navbar isDark={isDark} toggleTheme={toggleTheme} />
      <HeroSection />
      <InstantPreview />
      <HowItWorksSection />
      <FeaturesSection />
      <SocialPreviewSection />
      <HomePricingSection />
      <TrustSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
