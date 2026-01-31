import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CompanyButton } from "./CompanyButton";
import { Menu, X, Moon, Sun, Home, Building2, Info, Mail, ChevronRight, ArrowRight, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { CompanyProfile } from "@/types/company";
import { CompanyLogo } from "./CompanyLogo";

interface CompanyNavbarProps {
  company: CompanyProfile;
  isDark: boolean;
  toggleTheme: () => void;
}

export const CompanyNavbar = ({ company, isDark, toggleTheme }: CompanyNavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = `/${company.slug}`;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: basePath, icon: Home },
    { name: "Properties", href: `${basePath}/properties`, icon: Building2 },
    { name: "Services", href: `${basePath}/services`, icon: Info }, // Added Services Link
    { name: "About", href: `${basePath}/about`, icon: Info },
  ];

  const isHomePage = location.pathname === basePath || location.pathname === `${basePath}/`;

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    navigate(href);
    window.scrollTo(0, 0);
  };

  const handleLogoClick = () => {
    if (isHomePage) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate(basePath);
    }
  };

  // Check if company name is long (more than 15 characters)
  const isLongName = company.name.length > 15;
  // Check if company has a logo
  const hasLogo = !!company.logo_url;

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled || !isHomePage ? "glass-effect shadow-sm bg-background/80 backdrop-blur-md" : "bg-transparent"
        )}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-2 lg:gap-3 min-w-0 max-w-[50%] lg:max-w-none"
            >
              {hasLogo ? (
                <CompanyLogo company={company} size="sm" className="flex-shrink-0" />
              ) : (
                <CompanyLogo
                  company={company}
                  size="sm"
                  className={cn(
                    "flex-shrink-0",
                    isLongName && "hidden sm:flex"
                  )}
                />
              )}

              <span
                className={cn(
                  "font-extrabold font-heading tracking-tight transition-colors truncate",
                  isScrolled || !isHomePage
                    ? "text-heading"
                    : "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]",
                  hasLogo && "hidden sm:block",
                  isLongName
                    ? "text-sm sm:text-base lg:text-lg"
                    : "text-base sm:text-lg lg:text-xl"
                )}
              >
                {company.name}
              </span>

              {company.is_verified && (
                <span className="hidden sm:inline-flex bg-button text-button-foreground text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 shadow-sm border border-white/10">
                  Verified
                </span>
              )}
            </button>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <Button
                    key={link.name}
                    variant="ghost" // Using ghost but controlling colors
                    onClick={() => handleNavClick(link.href)}
                    className={cn(
                      "font-semibold transition-all",
                      isActive
                        ? (isScrolled || !isHomePage
                          ? "bg-button/10 text-icon"
                          : "bg-white/20 text-white")
                        : (isScrolled || !isHomePage
                          ? "text-muted-foreground hover:text-heading hover:bg-muted"
                          : "text-white/80 hover:text-white hover:bg-white/10")
                    )}
                  >
                    {link.name}
                  </Button>
                );
              })}
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className={cn(
                  "rounded-full",
                  isScrolled || !isHomePage
                    ? "text-muted-foreground hover:text-heading"
                    : "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] hover:bg-white/20"
                )}
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              {/* Strict Theme Button */}
              <CompanyButton
                onClick={() => handleNavClick(`${basePath}/contact`)}
                className={cn(
                  // Custom override if transparent state needed? No, CTA usually solid.
                  // But if transparent header, Solid button looks good.
                  // CompanyButton handles Primary/Secondary logic.
                  "shadow-lg"
                )}
              >
                Contact Us
              </CompanyButton>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex lg:hidden items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className={cn(
                  "rounded-full h-9 w-9",
                  isScrolled || !isHomePage
                    ? "text-muted-foreground"
                    : "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
                )}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(true)}
                className={cn(
                  "h-9 w-9",
                  isScrolled || !isHomePage
                    ? "text-heading"
                    : "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
                )}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-md"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Sidebar */}
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-card/95 backdrop-blur-xl border-l border-border/50 shadow-2xl animate-slide-in-right overflow-hidden">
            {/* Gradient Orbs - Strict Theme Colors */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-button/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-20 left-0 w-32 h-32 bg-button/10 rounded-full blur-3xl -translate-x-1/2" />

            <div className="flex flex-col h-full relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-border/50 bg-gradient-to-r from-button/5 to-transparent">
                <div className="flex items-center gap-3 min-w-0">
                  <CompanyLogo company={company} size="sm" className="flex-shrink-0" />
                  <div className="min-w-0">
                    <span className={cn(
                      "font-bold block truncate text-heading",
                      isLongName ? "text-sm" : "text-lg"
                    )}>
                      {company.name}
                    </span>
                    {company.is_verified && (
                      <span className="bg-button/10 text-icon text-xs px-2 py-0.5 rounded-full font-medium inline-block mt-1">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors flex-shrink-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation Links */}
              <div className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">Navigation</p>
                {navLinks.map((link, index) => {
                  const isActive = location.pathname === link.href;
                  const Icon = link.icon;
                  return (
                    <button
                      key={link.name}
                      onClick={() => handleNavClick(link.href)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
                        isActive
                          ? "bg-button/10 text-icon shadow-sm border border-button/20"
                          : "text-foreground hover:bg-muted/80"
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                        isActive
                          ? "bg-button/20 text-icon"
                          : "bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:text-heading"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-medium flex-1 text-left">{link.name}</span>
                      <ChevronRight className={cn(
                        "h-4 w-4 transition-transform",
                        isActive ? "text-icon" : "text-muted-foreground/50 group-hover:translate-x-0.5"
                      )} />
                    </button>
                  );
                })}
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-border/50 bg-gradient-to-t from-muted/30 to-transparent space-y-3">
                {(company.phone || company.email) && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 mb-3">
                    <div className="h-9 w-9 rounded-lg bg-button/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-4 w-4 text-icon" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {company.phone && (
                        <a href={`tel:${company.phone}`} className="text-sm font-medium text-heading hover:text-icon transition-colors block truncate">
                          {company.phone}
                        </a>
                      )}
                      {company.email && (
                        <a href={`mailto:${company.email}`} className="text-xs text-muted-foreground hover:text-icon transition-colors block truncate">
                          {company.email}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <CompanyButton
                  className="w-full rounded-xl h-12 shadow-lg"
                  onClick={() => handleNavClick(`${basePath}/contact`)}
                >
                  <span>Contact Us</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </CompanyButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
