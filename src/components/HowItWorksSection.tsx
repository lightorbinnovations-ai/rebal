import { Building2, ImagePlus, Share2, ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/hooks/useScrollReveal";

const steps = [
  {
    icon: Building2,
    step: "01",
    title: "Create your company profile",
    description: "Set up your business with logo, contact details, and branding in minutes. No coding required.",
    color: "from-blue-500 to-indigo-600",
    bgColor: "bg-blue-500/10",
    iconColor: "text-blue-500",
  },
  {
    icon: ImagePlus,
    step: "02",
    title: "Add and publish properties",
    description: "Upload property images, details, pricing, and location. Publish with one click.",
    color: "from-emerald-500 to-teal-600",
    bgColor: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
  },
  {
    icon: Share2,
    step: "03",
    title: "Share your link anywhere",
    description: "Get a professional link that generates beautiful previews on WhatsApp and social media.",
    color: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-500/10",
    iconColor: "text-amber-500",
  },
];

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-28 lg:py-36 bg-background relative overflow-hidden section-glow">
      {/* Background Elements */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-20 left-0 w-80 h-80 bg-secondary/5 rounded-full blur-[100px]" />
      
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Header */}
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-20">
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            How It Works
          </span>
          <h2 className="text-4xl lg:text-6xl font-extrabold font-heading text-foreground mb-6 leading-tight">
            Get started in{" "}
            <span className="text-gradient">three simple steps</span>
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
            Launch your professional property website in minutes, not days. 
            <span className="text-foreground font-medium"> No technical skills required.</span>
          </p>
        </ScrollReveal>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-6 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <ScrollReveal
              key={step.step}
              delay={index * 150}
              className="relative group"
            >
              {/* Connector Arrow */}
              {index < steps.length - 1 && (
                <div className="hidden md:flex absolute top-20 -right-3 lg:-right-1 z-20 items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-muted-foreground/30" />
                </div>
              )}

              <div className="relative h-full bg-card rounded-3xl p-8 border border-border/50 card-hover overflow-hidden group-hover:border-border">
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />
                
                {/* Step Number - Large background */}
                <span className="absolute -top-6 -right-4 text-[120px] font-extrabold text-muted/30 select-none leading-none">
                  {step.step}
                </span>

                {/* Icon */}
                <div className={`relative w-16 h-16 rounded-2xl ${step.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className={`w-8 h-8 ${step.iconColor}`} />
                </div>

                {/* Content */}
                <h3 className="relative text-xl lg:text-2xl font-bold font-heading text-foreground mb-4">
                  {step.title}
                </h3>
                <p className="relative text-muted-foreground leading-relaxed">
                  {step.description}
                </p>

                {/* Bottom accent line */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${step.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
