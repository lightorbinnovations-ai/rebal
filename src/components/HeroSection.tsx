import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { PhoneMockup } from "./PhoneMockup";

export const HeroSection = () => {
  const navigate = useNavigate();

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center hero-gradient overflow-hidden pb-6 pt-16 sm:pt-20 sm:pb-8 lg:py-0"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(0 0% 100%) 1px, transparent 1px),
                             linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />

        {/* Glowing Orbs */}
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-gradient-to-r from-primary/20 to-secondary/10 rounded-full blur-[120px] floating-element" />
        <div className="absolute -bottom-32 right-0 w-[600px] h-[600px] bg-gradient-to-l from-secondary/15 to-accent/10 rounded-full blur-[150px] floating-element-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />

        {/* Floating Geometric Shapes */}
        <div className="absolute top-20 right-[20%] w-20 h-20 border border-primary-foreground/10 rounded-2xl rotate-12 floating-element" />
        <div className="absolute bottom-32 left-[15%] w-16 h-16 border border-secondary/20 rounded-full floating-element-delayed" />
        <div className="absolute top-[40%] right-[10%] w-3 h-3 bg-accent/60 rounded-full floating-element" />
        <div className="absolute top-[30%] left-[8%] w-2 h-2 bg-secondary/50 rounded-full floating-element-delayed" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left space-y-2 sm:space-y-3 md:space-y-5">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-full bg-gradient-to-r from-primary-foreground/10 to-primary-foreground/5 border border-primary-foreground/20 text-primary-foreground/90 text-[10px] sm:text-xs font-medium animate-fade-up backdrop-blur-sm">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 text-accent" />
              <span>Built for Real Estate Professionals</span>
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-secondary animate-pulse" />
            </div>

            {/* Headline */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] xl:text-5xl font-extrabold font-heading leading-[1.15] animate-fade-up animation-delay-100">
              <span className="text-primary-foreground">One-link website</span>
              <br />
              <span className="text-primary-foreground/90">for your </span>
              <span className="relative inline-block">
                <span className="text-gradient-accent">property business</span>
                <svg
                  className="absolute -bottom-1 left-0 w-full"
                  viewBox="0 0 300 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 10C50 4 150 2 298 6"
                    stroke="url(#underlineGradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="underlineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="hsl(45 93% 58%)" />
                      <stop offset="100%" stopColor="hsl(35 93% 50%)" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-primary-foreground/70 max-w-xl mx-auto lg:mx-0 animate-fade-up animation-delay-200 leading-relaxed">
              Create a professional property website and share listings instantly on WhatsApp and social media.
              <span className="text-primary-foreground font-medium"> Get more inquiries with beautiful, shareable links.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center lg:justify-start animate-fade-up animation-delay-300">
              <Button
                variant="hero"
                size="lg"
                onClick={() => navigate("/auth")}
                className="group relative bg-gradient-to-r from-white to-white/95 text-primary hover:from-white hover:to-white shadow-2xl shadow-white/20 shine-effect h-9 sm:h-10 md:h-11 lg:h-12 px-4 sm:px-5 md:px-6 lg:px-8 text-xs sm:text-sm md:text-base rounded-xl"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Free Trial
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>
              <Button
                variant="heroOutline"
                size="lg"
                onClick={() => scrollToSection("#how-it-works")}
                className="group border-primary-foreground/30 hover:border-primary-foreground/50 hover:bg-primary-foreground/10 h-9 sm:h-10 md:h-11 lg:h-12 px-4 sm:px-5 md:px-6 lg:px-8 text-xs sm:text-sm md:text-base rounded-xl"
              >
                <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" />
                <span className="hidden sm:inline">See How It Works</span>
                <span className="sm:hidden">How It Works</span>
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 justify-center lg:justify-start pt-1 sm:pt-2 md:pt-4 animate-fade-up animation-delay-400">
              <div className="flex -space-x-1.5 sm:-space-x-2">
                {[
                  "from-emerald-400 to-emerald-600",
                  "from-blue-400 to-blue-600",
                  "from-purple-400 to-purple-600",
                  "from-amber-400 to-amber-600",
                  "from-rose-400 to-rose-600"
                ].map((gradient, i) => (
                  <div
                    key={i}
                    className={`w-5 h-5 sm:w-7 sm:h-7 md:w-9 md:h-9 rounded-full border-2 border-primary/80 bg-gradient-to-br ${gradient} shadow-lg`}
                    style={{ zIndex: 5 - i }}
                  />
                ))}
              </div>
              <div className="text-[10px] sm:text-xs md:text-sm">
                <span className="font-bold text-primary-foreground text-xs sm:text-sm md:text-base">500+</span>
                <span className="block text-primary-foreground/70">businesses trust REBAL</span>
              </div>
            </div>
          </div>

          {/* Hero Visual - Phone Mockup */}
          <div className="relative animate-fade-up animation-delay-200 flex justify-center lg:justify-end w-full">
            {/* Glow behind phone */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 sm:w-64 sm:h-64 md:w-72 md:h-72 bg-gradient-to-r from-secondary/30 via-accent/20 to-primary/20 rounded-full blur-[60px]" />
            </div>
            <PhoneMockup />
          </div>
        </div>
      </div>

      {/* Scroll Indicator - hide on mobile */}
      <button
        onClick={() => scrollToSection("#how-it-works")}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-primary-foreground/30 rounded-full hidden sm:flex"
        aria-label="Scroll to next section"
      >
        <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/20 flex items-start justify-center p-1 backdrop-blur-sm bg-primary-foreground/5">
          <div className="w-1 h-2.5 rounded-full bg-gradient-to-b from-primary-foreground/60 to-primary-foreground/20" />
        </div>
      </button>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
};
