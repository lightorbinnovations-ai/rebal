import { Code, Smartphone, Search, Share2, Zap, Shield, CheckCircle2 } from "lucide-react";
import { ScrollReveal } from "@/hooks/useScrollReveal";

const trustPoints = [
  {
    icon: Code,
    title: "No Coding Required",
    description: "Build your property website without any technical knowledge.",
  },
  {
    icon: Smartphone,
    title: "Mobile-First Design",
    description: "Looks perfect on every device, especially smartphones.",
  },
  {
    icon: Search,
    title: "SEO Optimized",
    description: "Get found on Google with built-in search optimization.",
  },
  {
    icon: Share2,
    title: "Built for WhatsApp",
    description: "Professional previews when sharing on messaging apps.",
  },
  {
    icon: Zap,
    title: "Fast & Reliable",
    description: "Lightning-fast loading times on global infrastructure.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Enterprise-grade security for your business data.",
  },
];

export const TrustSection = () => {
  return (
    <section className="py-28 lg:py-36 bg-background relative overflow-hidden section-glow">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Header */}
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-20">
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-accent/20 text-foreground text-sm font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Why REBAL
          </span>
          <h2 className="text-4xl lg:text-6xl font-extrabold font-heading text-foreground mb-6 leading-tight">
            Why businesses{" "}
            <span className="text-gradient">choose REBAL</span>
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
            Purpose-built for real estate professionals who want to{" "}
            <span className="text-foreground font-medium">stand out</span>.
          </p>
        </ScrollReveal>

        {/* Trust Points Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10 max-w-5xl mx-auto">
          {trustPoints.map((point, index) => (
            <ScrollReveal key={point.title} delay={index * 100}>
              <div className="flex items-start gap-5 group">
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                    <point.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CheckCircle2 className="absolute -bottom-1 -right-1 w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-bold font-heading text-foreground text-lg mb-2 group-hover:text-primary transition-colors">
                    {point.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {point.description}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
