import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { ScrollReveal } from "@/hooks/useScrollReveal";

export const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-28 lg:py-36 hero-gradient relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(hsl(0 0% 100%) 1px, transparent 1px),
                             linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Glowing Orbs */}
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-primary-foreground/10 rounded-full blur-[100px] floating-element" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-secondary/15 rounded-full blur-[120px] floating-element-delayed" />
        
        {/* Accent dots */}
        <div className="absolute top-20 right-[15%] w-3 h-3 bg-accent/50 rounded-full floating-element" />
        <div className="absolute bottom-32 left-[20%] w-2 h-2 bg-secondary/40 rounded-full floating-element-delayed" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <ScrollReveal className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground/90 text-sm font-medium mb-8 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>Start your 14-day free trial today</span>
          </div>

          <h2 className="text-4xl lg:text-6xl xl:text-7xl font-extrabold font-heading text-primary-foreground mb-8 leading-tight">
            Start sharing your properties{" "}
            <span className="text-gradient-accent">professionally</span>{" "}
            today
          </h2>
          
          <p className="text-lg lg:text-xl text-primary-foreground/70 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join hundreds of real estate professionals who trust REBAL to showcase their properties and close more deals.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="hero" 
              size="xl" 
              className="group relative bg-gradient-to-r from-white to-white/95 text-primary hover:from-white hover:to-white shadow-2xl shadow-white/20 shine-effect"
              onClick={() => navigate("/auth")}
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started Free
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-primary-foreground/60 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center">
                <span className="text-secondary text-xs">✓</span>
              </div>
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center">
                <span className="text-secondary text-xs">✓</span>
              </div>
              14-day free trial
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center">
                <span className="text-secondary text-xs">✓</span>
              </div>
              Cancel anytime
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* Top Gradient Fade */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent" />
    </section>
  );
};
