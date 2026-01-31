import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Eye, Heart, Sparkles, Globe, Users, ArrowRight, Building2 } from "lucide-react";
import { ScrollReveal } from "@/hooks/useScrollReveal";
import founderImage from "@/assets/founder.jpg";

const About = () => {
  const [isDark, setIsDark] = useState(false);

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

  const values = [
    {
      icon: Target,
      title: "Mission-Driven",
      description: "We're committed to helping SMEs succeed online with accessible, powerful tools."
    },
    {
      icon: Eye,
      title: "Visionary",
      description: "We see the future of digital presence and build tools that prepare you for it."
    },
    {
      icon: Heart,
      title: "Customer First",
      description: "Your success is our success. We build with your needs at the center."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar isDark={isDark} toggleTheme={toggleTheme} />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden hero-gradient">
        {/* Background Effects */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary-foreground/10 rounded-full blur-3xl floating-element" />
        <div className="absolute bottom-10 left-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl floating-element-delayed" />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <ScrollReveal className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 backdrop-blur-sm mb-6">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
              <span className="text-sm font-medium text-primary-foreground">About REBAL</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-heading text-primary-foreground mb-6">
              Empowering Businesses to{" "}
              <span className="text-gradient-hero">Grow Online</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-3xl mx-auto">
              REBAL was founded to help small, cottage, and medium enterprises achieve strong
              online visibility without technical hassle.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Mission & Story Section */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-muted/30" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <ScrollReveal>
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                Our Story
              </span>
              <h2 className="text-3xl lg:text-4xl font-bold font-heading text-foreground mb-6">
                Our Mission
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed text-lg">
                REBAL was founded by <strong className="text-foreground">Olatunbosun Oluwafemi Seyi</strong>, the visionary
                behind <strong className="text-foreground">LightOrb Innovations</strong>. Our mission is to empower small,
                cottage, and medium enterprises to achieve strong online visibility.
              </p>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                With REBAL, businesses can create professional property pages, manage inquiries,
                track analytics, and integrate with social media — all without technical hassle.
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="py-2 px-4 bg-card border-border/50">
                  <Globe className="h-4 w-4 mr-2 text-primary" />
                  Website Design
                </Badge>
                <Badge variant="outline" className="py-2 px-4 bg-card border-border/50">
                  <Sparkles className="h-4 w-4 mr-2 text-primary" />
                  Branding
                </Badge>
                <Badge variant="outline" className="py-2 px-4 bg-card border-border/50">
                  <Users className="h-4 w-4 mr-2 text-primary" />
                  Growth Solutions
                </Badge>
              </div>
            </ScrollReveal>

            {/* Founder Card */}
            <ScrollReveal delay={200}>
              <Card className="overflow-hidden border-border/50 shadow-2xl">
                <CardContent className="p-0">
                  <div className="aspect-square relative group">
                    <img
                      src={founderImage}
                      alt="Olatunbosun Oluwafemi Seyi - Founder"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                      <Badge className="mb-3 bg-primary/90 hover:bg-primary">Founder & CEO</Badge>
                      <h3 className="text-2xl lg:text-3xl font-bold">Olatunbosun Oluwafemi Seyi</h3>
                      <p className="text-white/80 text-lg">LightOrb Innovations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4 lg:px-8">
          <ScrollReveal className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Our Values
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold font-heading text-foreground mb-4">
              What We Stand For
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Our core values guide everything we do at REBAL
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <ScrollReveal key={value.title} delay={index * 150}>
                <Card className="group text-center p-8 h-full border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                  <CardContent className="pt-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                      <value.icon className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">{value.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* LightOrb Promotion Section */}
      <section className="py-20 lg:py-28 hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-foreground/10 rounded-full blur-3xl floating-element" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-secondary/20 rounded-full blur-3xl floating-element-delayed" />
        </div>

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <ScrollReveal className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 mb-6">
              <Building2 className="h-4 w-4 text-primary-foreground" />
              <span className="text-sm font-medium text-primary-foreground">Powered By</span>
            </div>

            <h2 className="text-3xl lg:text-5xl font-bold font-heading text-primary-foreground mb-6">
              Built by LightOrb Innovations
            </h2>
            <p className="text-lg lg:text-xl text-primary-foreground/80 mb-10 leading-relaxed">
              At LightOrb Innovations, we help small and medium enterprises design websites,
              build branding, and grow their online presence. Let us help your business
              reach more customers today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-xl shine-effect">
                <Link to="/auth">
                  Start 14-Day Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <ScrollReveal className="max-w-4xl mx-auto">
            <div className="grid sm:grid-cols-3 gap-8 text-center">
              <div className="p-6 rounded-2xl bg-card border border-border/50">
                <p className="font-semibold text-foreground mb-2">Email</p>
                <a href="mailto:rebalpros@gmail.com" className="text-muted-foreground hover:text-primary transition-colors">
                  rebalpros@gmail.com
                </a>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-border/50">
                <p className="font-semibold text-foreground mb-2">Phone</p>
                <a href="tel:+2348025100844" className="text-muted-foreground hover:text-primary transition-colors">
                  +234 802 510 0844
                </a>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-border/50">
                <p className="font-semibold text-foreground mb-2">Address</p>
                <p className="text-muted-foreground">FCT, Abuja, Nigeria</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
