import {
  Globe,
  Home,
  MessageSquare,
  FileText,
  MapPin,
  BarChart3,
  Moon,
  BadgeCheck,
} from "lucide-react";
import { ScrollReveal } from "@/hooks/useScrollReveal";

const features = [
  {
    icon: Globe,
    title: "Company Mini-Website",
    description: "Professional landing page with your branding, logo, and contact information.",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: Home,
    title: "Property Listings",
    description: "Showcase unlimited properties with images, details, pricing, and availability status.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp-Ready Previews",
    description: "Every link generates beautiful preview cards when shared on WhatsApp and social media.",
    gradient: "from-emerald-500 to-green-500",
  },
  {
    icon: FileText,
    title: "Inquiry Forms",
    description: "Built-in contact forms to capture leads and inquiries directly from visitors.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: BadgeCheck,
    title: "Verified Badge",
    description: "Get a verification badge to build trust and credibility with potential clients.",
    gradient: "from-sky-500 to-blue-600",
  },
  {
    icon: MapPin,
    title: "Location & Maps",
    description: "Embedded maps showing property locations for better visualization.",
    gradient: "from-rose-500 to-pink-600",
  },
  {
    icon: BarChart3,
    title: "Basic Analytics",
    description: "Track page views, property views, and inquiry counts to measure performance.",
    gradient: "from-indigo-500 to-violet-600",
  },
  {
    icon: Moon,
    title: "Dark & Light Mode",
    description: "Automatic theme switching based on visitor preferences for optimal viewing.",
    gradient: "from-slate-500 to-gray-700",
  },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-28 lg:py-36 bg-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Header */}
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-20">
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Features
          </span>
          <h2 className="text-4xl lg:text-6xl font-extrabold font-heading text-foreground mb-6 leading-tight">
            Everything you need to{" "}
            <span className="text-gradient">showcase properties</span>
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
            Powerful tools designed specifically for real estate professionals. 
            <span className="text-foreground font-medium"> No coding, no complexity.</span>
          </p>
        </ScrollReveal>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, index) => (
            <ScrollReveal
              key={feature.title}
              delay={index * 75}
              className="group"
            >
              <div className="relative h-full bg-card rounded-2xl p-6 border border-border/50 card-hover overflow-hidden">
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.05] transition-opacity duration-500`} />
                
                {/* Icon */}
                <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} p-[1px] mb-5`}>
                  <div className="w-full h-full rounded-2xl bg-card flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-foreground" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="font-bold text-foreground mb-2 text-lg leading-tight">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};