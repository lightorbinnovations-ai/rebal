import { useState, useEffect } from "react";
import { Company } from "@/types/company";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Eye, 
  Monitor, 
  Smartphone, 
  Building, 
  Phone, 
  Mail, 
  MapPin,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { SocialLinks } from "@/components/company/SocialLinks";
import { DEFAULT_HERO_IMAGES, DEFAULT_HERO_OPTIONS } from "@/lib/defaultHeroImages";

interface BrandingPreviewProps {
  company: Company;
  watchedValues: Partial<Company>;
  publicUrl: string;
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

export const BrandingPreview = ({ company, watchedValues, publicUrl }: BrandingPreviewProps) => {
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [previewSection, setPreviewSection] = useState<"hero" | "footer">("hero");

  const [currentDefaultImage, setCurrentDefaultImage] = useState(0);

  // Check if the current hero_image_url is a default option
  const isUsingDefault = DEFAULT_HERO_OPTIONS.some(
    (opt) => opt.src === watchedValues.hero_image_url
  );
  const hasCustomHero = watchedValues.hero_image_url && !isUsingDefault;

  // Rotate default hero images in preview when no selection
  useEffect(() => {
    if (watchedValues.hero_image_url) return;
    
    const interval = setInterval(() => {
      setCurrentDefaultImage((prev) => (prev + 1) % DEFAULT_HERO_IMAGES.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [watchedValues.hero_image_url]);

  // Merge company with watched values for preview
  const previewCompany: Company = {
    ...company,
    ...watchedValues,
  } as Company;

  const primaryColor = watchedValues.primary_color || "#0F172A";
  const secondaryColor = watchedValues.secondary_color || "#3B82F6";
  const footerBgColor = watchedValues.footer_bg_color || "#0F172A";
  const footerTextColor = watchedValues.footer_text_color || "#FFFFFF";
  const fontHeading = watchedValues.font_heading || "Inter";
  const fontBody = watchedValues.font_body || "Open Sans";
  const buttonRadius = getButtonRadius(watchedValues.button_style || "rounded");

  return (
    <Card className="sticky top-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-4 w-4" />
              Live Preview
            </CardTitle>
            <CardDescription>See how your public page will look</CardDescription>
          </div>
          <div className="flex gap-1">
            <Button
              variant={previewMode === "desktop" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setPreviewMode("desktop")}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={previewMode === "mobile" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setPreviewMode("mobile")}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview Section Tabs */}
        <Tabs value={previewSection} onValueChange={(v) => setPreviewSection(v as "hero" | "footer")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="hero">Hero Section</TabsTrigger>
            <TabsTrigger value="footer">Footer</TabsTrigger>
          </TabsList>

          {/* Hero Section Preview */}
          <TabsContent value="hero" className="mt-4">
            <div
              className={`rounded-lg overflow-hidden border shadow-sm transition-all ${
                previewMode === "mobile" ? "max-w-[280px] mx-auto" : ""
              }`}
            >
              {/* Mini Hero */}
              <div
                className="relative p-6 text-center"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 50%, ${primaryColor}aa 100%)`,
                  minHeight: previewMode === "mobile" ? "180px" : "200px",
                }}
              >
              {/* Hero Image Background */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
                style={{
                  backgroundImage: `url(${watchedValues.hero_image_url || DEFAULT_HERO_IMAGES[currentDefaultImage]})`,
                  opacity: 0.25,
                }}
              />
              
              {/* Hero content */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full">
                  {/* Logo or Name */}
                  {watchedValues.logo_url ? (
                    <img
                      src={watchedValues.logo_url}
                      alt="Logo"
                      className="max-h-10 object-contain mb-3"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : (
                    <h2
                      className={`font-bold text-white mb-2 ${
                        previewMode === "mobile" ? "text-xl" : "text-2xl"
                      }`}
                      style={{ fontFamily: `"${fontHeading}", sans-serif` }}
                    >
                      {watchedValues.name || "Your Company"}
                    </h2>
                  )}

                  {watchedValues.tagline && (
                    <p
                      className={`text-white/90 mb-3 ${
                        previewMode === "mobile" ? "text-xs" : "text-sm"
                      }`}
                      style={{ fontFamily: `"${fontBody}", sans-serif` }}
                    >
                      {watchedValues.tagline}
                    </p>
                  )}

                  {/* Buttons */}
                  <div className={`flex gap-2 ${previewMode === "mobile" ? "flex-col" : ""}`}>
                    <button
                      className={`inline-flex items-center justify-center gap-1 text-white font-medium ${
                        previewMode === "mobile" ? "text-xs px-3 py-1.5" : "text-sm px-4 py-2"
                      }`}
                      style={{
                        backgroundColor: secondaryColor,
                        borderRadius: buttonRadius,
                      }}
                    >
                      <Building className={previewMode === "mobile" ? "h-3 w-3" : "h-4 w-4"} />
                      View Properties
                    </button>
                    <button
                      className={`inline-flex items-center justify-center gap-1 text-white font-medium border border-white/30 ${
                        previewMode === "mobile" ? "text-xs px-3 py-1.5" : "text-sm px-4 py-2"
                      }`}
                      style={{ borderRadius: buttonRadius }}
                    >
                      <Phone className={previewMode === "mobile" ? "h-3 w-3" : "h-4 w-4"} />
                      Contact Us
                    </button>
                  </div>

                  {/* Verified Badge */}
                  {previewCompany.is_verified && (
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1 bg-white/20 text-white px-2 py-1 rounded-full text-xs">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Property Cards Preview */}
              <div className="p-4 bg-muted/30">
                <p
                  className="text-xs font-medium text-center mb-3"
                  style={{ fontFamily: `"${fontHeading}", sans-serif` }}
                >
                  Featured Properties
                </p>
                <div className={`grid gap-2 ${previewMode === "mobile" ? "grid-cols-1" : "grid-cols-2"}`}>
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-card rounded border p-2">
                      <div className="bg-muted h-12 rounded mb-2" />
                      <div className="h-2 bg-muted rounded w-3/4 mb-1" />
                      <div className="h-2 bg-muted rounded w-1/2" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Footer Preview */}
          <TabsContent value="footer" className="mt-4">
            <div
              className={`rounded-lg overflow-hidden border shadow-sm transition-all ${
                previewMode === "mobile" ? "max-w-[280px] mx-auto" : ""
              }`}
            >
              <div
                className="p-4"
                style={{
                  backgroundColor: footerBgColor,
                  color: footerTextColor,
                }}
              >
                <div className={previewMode === "mobile" ? "space-y-4" : "grid grid-cols-2 gap-4"}>
                  {/* Company Info */}
                  <div>
                    <h3
                      className="font-bold text-sm mb-2"
                      style={{ fontFamily: `"${fontHeading}", sans-serif` }}
                    >
                      {watchedValues.name || "Your Company"}
                    </h3>
                    {watchedValues.tagline && (
                      <p className="text-xs opacity-80 mb-2">{watchedValues.tagline}</p>
                    )}
                    <div className="mt-2">
                      <SocialLinks company={previewCompany} size="sm" />
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div>
                    <h4 className="font-semibold text-xs mb-2" style={{ color: `${footerTextColor}cc` }}>
                      Contact
                    </h4>
                    <div className="space-y-1">
                      {watchedValues.phone && (
                        <div className="flex items-center gap-1 text-xs" style={{ color: `${footerTextColor}cc` }}>
                          <Phone className="h-3 w-3" />
                          {watchedValues.phone}
                        </div>
                      )}
                      {watchedValues.email && (
                        <div className="flex items-center gap-1 text-xs" style={{ color: `${footerTextColor}cc` }}>
                          <Mail className="h-3 w-3" />
                          {watchedValues.email}
                        </div>
                      )}
                      {watchedValues.address && (
                        <div className="flex items-center gap-1 text-xs" style={{ color: `${footerTextColor}cc` }}>
                          <MapPin className="h-3 w-3" />
                          <span className="line-clamp-1">{watchedValues.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div
                  className="mt-4 pt-3 border-t flex justify-between items-center text-xs"
                  style={{ borderColor: `${footerTextColor}20`, color: `${footerTextColor}99` }}
                >
                  <span>© 2024 {watchedValues.name || "Company"}</span>
                  <span>
                    Powered by{" "}
                    <span style={{ color: secondaryColor }} className="font-semibold">
                      REBAL
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div
              className="w-6 h-6 rounded mx-auto mb-1"
              style={{ backgroundColor: primaryColor }}
            />
            <p className="text-xs text-muted-foreground">Primary</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div
              className="w-6 h-6 rounded mx-auto mb-1"
              style={{ backgroundColor: secondaryColor }}
            />
            <p className="text-xs text-muted-foreground">Secondary</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div
              className="w-6 h-3 mx-auto mb-1 flex items-center justify-center"
              style={{ 
                backgroundColor: secondaryColor,
                borderRadius: buttonRadius,
              }}
            />
            <p className="text-xs text-muted-foreground">Button</p>
          </div>
        </div>

        {/* Font Preview */}
        <div className="space-y-2 pt-2 border-t">
          <p className="text-xs text-muted-foreground">Typography</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-muted/30 rounded">
              <p
                className="text-sm font-bold truncate"
                style={{ fontFamily: `"${fontHeading}", sans-serif` }}
              >
                Heading
              </p>
              <p className="text-xs text-muted-foreground truncate">{fontHeading}</p>
            </div>
            <div className="p-2 bg-muted/30 rounded">
              <p
                className="text-sm truncate"
                style={{ fontFamily: `"${fontBody}", sans-serif` }}
              >
                Body text
              </p>
              <p className="text-xs text-muted-foreground truncate">{fontBody}</p>
            </div>
          </div>
        </div>

        {/* Public URL */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">Public Page</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded truncate">
              {publicUrl}
            </code>
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
