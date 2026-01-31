import { MessageCircle, CheckCircle2 } from "lucide-react";
import { ScrollReveal } from "@/hooks/useScrollReveal";
import propertyImage from "@/assets/default-hero-2.webp";

export const SocialPreviewSection = () => {
  return (
    <section className="py-28 lg:py-36 bg-background overflow-hidden relative section-glow">
      {/* Background decoration */}
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] -translate-y-1/2" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Text Content */}
          <ScrollReveal direction="left" className="order-2 lg:order-1">
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              Social Previews
            </span>
            <h2 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold font-heading text-foreground mb-6 leading-tight">
              Every link you share looks{" "}
              <span className="text-gradient">professional</span>
            </h2>
            <p className="text-lg lg:text-xl text-muted-foreground mb-10 leading-relaxed">
              When you share your REBAL link on WhatsApp, Facebook, or any social platform, it automatically generates a{" "}
              <span className="text-foreground font-medium">beautiful preview card</span> with your company logo or property image.
            </p>

            <div className="space-y-5">
              {[
                "Company pages show your logo and business name",
                "Property pages display listing images and details",
                "Optimized for WhatsApp, Facebook, Twitter & more",
                "No extra setup required — it just works",
              ].map((item, index) => (
                <ScrollReveal key={index} delay={index * 100}>
                  <div className="flex items-start gap-4 group">
                    <div className="shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-secondary" />
                    </div>
                    <p className="text-foreground text-lg group-hover:text-primary transition-colors">{item}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </ScrollReveal>

          {/* Visual Mockups */}
          <ScrollReveal direction="right" className="order-1 lg:order-2 relative">
            <div className="relative flex justify-center lg:justify-end">
              {/* Glow effect */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-72 h-72 bg-gradient-to-r from-secondary/20 to-primary/10 rounded-full blur-[60px]" />
              </div>

              {/* Company Preview Card */}
              <div className="relative bg-card rounded-3xl shadow-2xl p-5 border border-border/50 max-w-sm card-hover">
                <div className="bg-muted rounded-2xl overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-br from-primary via-primary to-primary/80 p-6">
                    <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center border border-white/20">
                      <span className="text-2xl font-bold font-heading text-white">R</span>
                    </div>
                  </div>
                  {/* Content */}
                  <div className="p-5 bg-card">
                    <p className="text-xs text-muted-foreground mb-1">rebal.ng</p>
                    <h4 className="font-bold font-heading text-lg text-foreground mb-2">Prime Realty Ltd.</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">Premium real estate listings in Lagos. View our collection of luxury properties.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <div className="w-10 h-10 rounded-full bg-[#25D366]/20 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-[#25D366]" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground">WhatsApp Preview</span>
                    <p className="text-xs text-muted-foreground">Tap to open</p>
                  </div>
                </div>
              </div>

              {/* Property Preview Card - Floating */}
              <div className="absolute -bottom-6 -left-8 lg:-left-16 bg-card rounded-2xl shadow-2xl p-4 border border-border/50 max-w-[260px] floating-element z-10">
                <div className="bg-muted rounded-xl overflow-hidden">
                  <div className="h-28 overflow-hidden">
                    <img 
                      src={propertyImage} 
                      alt="Property preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 bg-card">
                    <p className="text-[10px] text-muted-foreground mb-1">rebal.ng</p>
                    <h4 className="font-bold font-heading text-sm text-foreground mb-1">3BR Duplex - ₦85M</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">Modern 3 bedroom duplex with pool in Lekki Phase 1...</p>
                  </div>
                </div>
              </div>

              {/* Small floating element */}
              <div className="absolute top-4 -left-4 w-12 h-12 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center floating-element-delayed">
                <span className="text-xl">🏠</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
