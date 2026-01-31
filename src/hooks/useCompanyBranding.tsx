import { useEffect } from "react";
import { CompanyProfile } from "@/types/company";

// Convert hex color to HSL values string (without hsl() wrapper)
function hexToHSL(hex: string): string {
  // Remove # if present
  hex = hex.replace(/^#/, "");
  
  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Generate a gradient from primary color
function generateGradient(primaryHex: string): string {
  const hsl = hexToHSL(primaryHex);
  const parts = hsl.split(" ");
  const h = parseInt(parts[0]);
  const s = parseInt(parts[1]);
  
  // Create gradient variants
  const color1 = `hsl(${h} ${s}% 25%)`;
  const color2 = `hsl(${h} ${Math.max(0, s - 5)}% 18%)`;
  const color3 = `hsl(${h} ${Math.max(0, s - 10)}% 10%)`;
  
  return `linear-gradient(135deg, ${color1} 0%, ${color2} 50%, ${color3} 100%)`;
}

// Get button border radius based on style
function getButtonRadius(style: string): string {
  switch (style) {
    case "pill":
      return "9999px";
    case "square":
      return "0";
    case "rounded":
    default:
      return "0.5rem";
  }
}

// Load Google Font dynamically
function loadGoogleFont(fontName: string) {
  const fontId = `google-font-${fontName.replace(/\s+/g, "-").toLowerCase()}`;
  
  // Don't load if already loaded
  if (document.getElementById(fontId)) return;
  
  // Create link element
  const link = document.createElement("link");
  link.id = fontId;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700&display=swap`;
  
  document.head.appendChild(link);
}

export const useCompanyBranding = (company: CompanyProfile | null) => {
  useEffect(() => {
    if (!company) return;

    const root = document.documentElement;
    
    // Colors
    const primaryColor = company.primary_color || "#0F172A";
    const secondaryColor = company.secondary_color || "#3B82F6";
    const footerBgColor = company.footer_bg_color || "#0F172A";
    const footerTextColor = company.footer_text_color || "#FFFFFF";

    // Set CSS custom properties for company branding
    const primaryHSL = hexToHSL(primaryColor);
    const secondaryHSL = hexToHSL(secondaryColor);
    
    // Company-specific CSS variables
    root.style.setProperty("--company-primary", primaryHSL);
    root.style.setProperty("--company-secondary", secondaryHSL);
    root.style.setProperty("--company-hero-gradient", generateGradient(primaryColor));
    root.style.setProperty("--company-primary-hex", primaryColor);
    root.style.setProperty("--company-secondary-hex", secondaryColor);
    
    // Footer colors
    root.style.setProperty("--company-footer-bg", footerBgColor);
    root.style.setProperty("--company-footer-text", footerTextColor);
    
    // IMPORTANT: Override theme primary/secondary colors for full brand integration
    // This ensures buttons, links, badges, etc. all use the company's brand colors
    root.style.setProperty("--primary", primaryHSL);
    root.style.setProperty("--secondary", secondaryHSL);
    
    // Generate accent color from primary (slightly lighter/more saturated)
    const primaryParts = primaryHSL.split(" ");
    const h = parseInt(primaryParts[0]);
    const s = parseInt(primaryParts[1]);
    const l = parseInt(primaryParts[2]);
    const accentHSL = `${h} ${Math.min(100, s + 10)}% ${Math.min(95, l + 40)}%`;
    root.style.setProperty("--accent", accentHSL);
    
    // Fonts
    const fontHeading = company.font_heading || "Inter";
    const fontBody = company.font_body || "Open Sans";
    
    loadGoogleFont(fontHeading);
    loadGoogleFont(fontBody);
    
    root.style.setProperty("--company-font-heading", `"${fontHeading}", sans-serif`);
    root.style.setProperty("--company-font-body", `"${fontBody}", sans-serif`);
    
    // Button style
    const buttonRadius = getButtonRadius(company.button_style || "rounded");
    root.style.setProperty("--company-button-radius", buttonRadius);

    // Cleanup on unmount - restore original theme colors
    return () => {
      root.style.removeProperty("--company-primary");
      root.style.removeProperty("--company-secondary");
      root.style.removeProperty("--company-hero-gradient");
      root.style.removeProperty("--company-primary-hex");
      root.style.removeProperty("--company-secondary-hex");
      root.style.removeProperty("--company-footer-bg");
      root.style.removeProperty("--company-footer-text");
      root.style.removeProperty("--company-font-heading");
      root.style.removeProperty("--company-font-body");
      root.style.removeProperty("--company-button-radius");
      
      // Restore original theme colors
      root.style.removeProperty("--primary");
      root.style.removeProperty("--secondary");
      root.style.removeProperty("--accent");
    };
  }, [
    company?.primary_color, 
    company?.secondary_color,
    company?.font_heading,
    company?.font_body,
    company?.button_style,
    company?.footer_bg_color,
    company?.footer_text_color,
  ]);
};

export { hexToHSL, generateGradient, getButtonRadius };
