import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { PricingCards, ComparisonTable } from "@/components/pricing/PricingCards";
import { PricingFAQ } from "@/components/pricing/PricingFAQ";
import { ArrowRight, Code, Globe, Smartphone, Share2, XCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/hooks/useScrollReveal";

const Pricing = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
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

  const whyRebalPoints = [
    { icon: Code, text: "No coding needed" },
    { icon: Globe, text: "Works on all social platforms" },
    { icon: Smartphone, text: "Mobile & SEO optimized" },
    { icon: Share2, text: "Built for property businesses" },
    { icon: XCircle, text: "Cancel anytime" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar isDark={isDark} toggleTheme={toggleTheme} />

      {/* Pricing Hero Section - Always Dark */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-slate-900">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl floating-element" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl floating-element-delayed" />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <ScrollReveal className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-white">Simple & Transparent</span>
            </div>

            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold font-heading text-white mb-6">
              Simple pricing for{" "}
              <span className="text-gradient-primary">property businesses</span>
            </h1>
            <p className="text-lg lg:text-xl text-white/70 mb-4">
              Create your mini-website, share properties anywhere, and track inquiries.
            </p>
            <p className="text-base text-white/60 mb-10">
              No hidden fees. No credit card required to start.
            </p>

            {/* Monthly/Yearly Toggle */}
            <div className="inline-flex items-center gap-2 p-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <button
                onClick={() => setIsYearly(false)}
                className={cn(
                  "px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                  !isYearly
                    ? "bg-white text-slate-900 shadow-lg"
                    : "text-white/70 hover:text-white"
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={cn(
                  "px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2",
                  isYearly
                    ? "bg-white text-slate-900 shadow-lg"
                    : "text-white/70 hover:text-white"
                )}
              >
                Yearly
                <span className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-full font-semibold">
                  Save 17%
                </span>
              </button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Pricing Cards Section */}
      <section className="py-16 lg:py-24 relative">
        <div className="container mx-auto px-4 lg:px-8">
          <PricingCards isYearly={isYearly} />
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-16 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-muted/30" />
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <ScrollReveal className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Detailed Breakdown
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold font-heading text-foreground mb-4">
              Compare plans
            </h2>
            <p className="text-lg text-muted-foreground">
              See which plan is right for your business
            </p>
          </ScrollReveal>
          
          <ScrollReveal delay={200}>
            <div className="bg-card rounded-2xl border border-border/50 shadow-xl p-6 lg:p-8 backdrop-blur-sm">
              <ComparisonTable />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Why REBAL Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <ScrollReveal className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-extrabold font-heading text-foreground mb-4">
                Why <span className="text-gradient-primary">REBAL</span>?
              </h2>
            </ScrollReveal>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {whyRebalPoints.map((point, index) => (
                <ScrollReveal key={point.text} delay={index * 100}>
                  <div className="group flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <point.icon className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-foreground">{point.text}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-muted/30" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <ScrollReveal className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              FAQ
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold font-heading text-foreground mb-4">
              Frequently asked questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about REBAL
            </p>
          </ScrollReveal>
          
          <ScrollReveal delay={200}>
            <PricingFAQ />
          </ScrollReveal>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 lg:py-32 hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-foreground/10 rounded-full blur-3xl floating-element" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-secondary/20 rounded-full blur-3xl floating-element-delayed" />
        </div>

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <ScrollReveal className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-5xl font-extrabold font-heading text-primary-foreground mb-6">
              Start sharing your properties professionally today
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-10">
              Join hundreds of real estate professionals who trust REBAL.
            </p>
            <Button
              variant="hero"
              size="xl"
              className="group bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-2xl shine-effect"
              onClick={() => navigate("/auth")}
            >
              Start 14-Day Free Trial
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <p className="mt-6 text-sm text-primary-foreground/60">
              No credit card required • Cancel anytime
            </p>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
