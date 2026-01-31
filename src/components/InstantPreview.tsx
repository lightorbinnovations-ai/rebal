import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Globe, Phone, Mail, MapPin, Sparkles, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DEFAULT_HERO_IMAGES } from "@/lib/defaultHeroImages";

export const InstantPreview = () => {
  const [businessName, setBusinessName] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const navigate = useNavigate();

  // Rotate hero images
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % DEFAULT_HERO_IMAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Sanitize and validate input - prevent XSS and limit length
  const sanitizeName = (name: string) => {
    // Remove any HTML/script tags, event handlers, and dangerous characters
    return name
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .replace(/on\w+\s*=/gi, "") // Remove event handlers like onerror=
      .replace(/javascript:/gi, "") // Remove javascript: protocol
      .replace(/[<>'"]/g, "") // Remove angle brackets and quotes
      .trim()
      .slice(0, 100); // Limit to 100 characters
  };

  const generateSlug = (name: string) => {
    return sanitizeName(name)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 30);
  };

  // Sanitized display name - always use sanitized version
  const displayName = sanitizeName(businessName) || "Your Business";

  const handleGetStarted = () => {
    setIsAnimating(true);
    setTimeout(() => {
      navigate("/auth", { state: { businessName } });
    }, 500);
  };

  const slug = businessName ? generateSlug(businessName) : "your-business";

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-background to-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
      
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            Try It Now — No Signup Required
          </span>
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold font-heading text-foreground mb-4">
            See Your Website in <span className="text-gradient">60 Seconds</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Enter your business name and watch your professional real estate website come to life instantly.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Input Section */}
          <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto mb-10">
            <Input
              type="text"
              placeholder="Enter your business name..."
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value.slice(0, 100))}
              maxLength={100}
              className="h-14 text-lg px-6 flex-1 bg-card border-border/50 focus:border-primary"
            />
            <Button
              onClick={handleGetStarted}
              disabled={!businessName.trim()}
              className="h-14 px-8 text-lg font-semibold bg-primary hover:bg-primary/90"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Live Preview */}
          <div 
            className={`relative rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-card transition-all duration-500 ${
              isAnimating ? "scale-95 opacity-0" : "scale-100 opacity-100"
            }`}
          >
            {/* Browser Chrome */}
            <div className="bg-muted/80 backdrop-blur px-4 py-3 flex items-center gap-3 border-b border-border/50">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="bg-background/80 rounded-lg px-4 py-1.5 flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="w-4 h-4" />
                  <span>rebal.ng/<span className="text-foreground font-medium">{slug}</span></span>
                </div>
              </div>
            </div>

            {/* Website Preview */}
            <div className="relative">
              {/* Hero Section */}
              <div 
                className="h-[300px] lg:h-[400px] bg-cover bg-center relative transition-all duration-1000"
                style={{ backgroundImage: `url(${DEFAULT_HERO_IMAGES[heroIndex]})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                
                {/* Navbar Preview */}
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center border border-white/20">
                      <span className="text-white font-bold text-lg">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-white font-bold text-lg hidden sm:block">
                      {displayName}
                    </span>
                  </div>
                  <div className="hidden md:flex items-center gap-6 text-white/80 text-sm">
                    <span>Properties</span>
                    <span>About</span>
                    <span>Contact</span>
                  </div>
                </div>

                {/* Hero Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-10">
                  <h1 className="text-2xl lg:text-4xl font-bold text-white mb-2">
                    {displayName}
                  </h1>
                  <p className="text-white/80 text-sm lg:text-base mb-4 max-w-md">
                    Your trusted partner for premium real estate in Nigeria
                  </p>
                  <div className="flex gap-3">
                    <div className="bg-white text-primary px-4 py-2 rounded-lg text-sm font-semibold">
                      View Properties
                    </div>
                    <div className="bg-white/20 backdrop-blur text-white px-4 py-2 rounded-lg text-sm border border-white/30">
                      Contact Us
                    </div>
                  </div>
                </div>
              </div>

              {/* Properties Preview */}
              <div className="bg-card p-6 lg:p-8">
                <h3 className="font-bold text-lg mb-4 text-foreground">Featured Properties</h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { title: "3BR Duplex", price: "₦85M", location: "Lekki Phase 1" },
                    { title: "4BR Semi-Detached", price: "₦120M", location: "Victoria Island" },
                    { title: "Land (500sqm)", price: "₦45M", location: "Ajah" },
                  ].map((property, index) => (
                    <div key={index} className="bg-muted/50 rounded-xl overflow-hidden">
                      <div 
                        className="h-24 lg:h-32 bg-cover bg-center"
                        style={{ backgroundImage: `url(${DEFAULT_HERO_IMAGES[(index + 2) % DEFAULT_HERO_IMAGES.length]})` }}
                      />
                      <div className="p-3">
                        <p className="font-semibold text-sm text-foreground">{property.title}</p>
                        <p className="text-primary font-bold text-sm">{property.price}</p>
                        <p className="text-muted-foreground text-xs flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {property.location}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Preview */}
              <div className="bg-slate-900 text-white p-6">
                <div className="flex flex-wrap gap-6 justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <span className="font-bold text-sm">{displayName.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="font-semibold">{displayName}</span>
                  </div>
                  <div className="flex gap-4 text-white/60 text-sm">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> Contact</span>
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> Email</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Badge */}
            <div className="absolute top-20 right-4 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
              <Check className="w-3.5 h-3.5" />
              Live Preview
            </div>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
            {[
              "Ready in 60 seconds",
              "No coding required",
              "Mobile optimized",
              "Free 14-day trial",
            ].map((benefit, index) => (
              <div key={index} className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                <Check className="w-4 h-4 text-secondary" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
