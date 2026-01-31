import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, X, Moon, Sun, Home, Sparkles, DollarSign, Info, Mail, LogIn, LogOut, ArrowRight, ChevronRight, Building2, Search, LayoutDashboard, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface NavbarProps {
  isDark: boolean;
  toggleTheme: () => void;
}

export const Navbar = ({ isDark, toggleTheme }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth(false);

  const isHomePage = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/", isRoute: true, icon: Home },
    { name: "Properties", href: "/properties", isRoute: true, icon: Building2 },
    { name: "Features", href: "/#features", isRoute: false, icon: Sparkles },
    { name: "Pricing", href: "/pricing", isRoute: true, icon: DollarSign },
    { name: "About", href: "/about", isRoute: true, icon: Info },
    { name: "Contact", href: "/contact", isRoute: true, icon: Mail },
  ];

  const handleNavClick = (href: string, isRoute: boolean) => {
    setIsMobileMenuOpen(false);

    if (isRoute) {
      navigate(href);
      window.scrollTo(0, 0);
    } else {
      // Handle hash links
      const hash = href.split("#")[1];
      if (hash) {
        if (isHomePage) {
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
        } else {
          navigate("/" + "#" + hash);
        }
      }
    }
  };

  const handleLogoClick = () => {
    if (isHomePage) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/properties?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  // Determine navbar style based on scroll and page
  const showSolidNav = isScrolled || !isHomePage;

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          showSolidNav
            ? "bg-background/80 backdrop-blur-lg border-b border-border/50 shadow-sm"
            : "bg-transparent"
        )}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <button
              onClick={handleLogoClick}
              className={cn(
                "text-2xl font-extrabold font-heading tracking-tight transition-colors",
                showSolidNav ? "text-foreground" : "text-primary-foreground"
              )}
            >
              REBAL
            </button>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = link.href === location.pathname ||
                  (link.href === "/" && location.pathname === "/");
                return (
                  <Button
                    key={link.name}
                    variant={showSolidNav ? "nav" : "navHero"}
                    onClick={() => handleNavClick(link.href, link.isRoute)}
                    className={cn(
                      isActive && showSolidNav && "bg-background/90 text-primary shadow-sm",
                      isActive && !showSolidNav && "bg-primary-foreground/20 text-primary-foreground"
                    )}
                  >
                    {link.name}
                  </Button>
                );
              })}
            </div>

            {/* Desktop Actions with Search */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="relative">
                <div className={cn(
                  "flex items-center transition-all duration-300 rounded-full overflow-hidden",
                  isSearchOpen
                    ? "w-64 bg-background/90 border border-border shadow-sm"
                    : "w-10"
                )}>
                  {isSearchOpen && (
                    <Input
                      type="text"
                      placeholder="Search properties..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-10 pl-4 pr-10"
                      autoFocus
                      onBlur={() => {
                        if (!searchQuery) {
                          setTimeout(() => setIsSearchOpen(false), 150);
                        }
                      }}
                    />
                  )}
                  <Button
                    type={isSearchOpen ? "submit" : "button"}
                    variant="ghost"
                    size="icon"
                    onClick={() => !isSearchOpen && setIsSearchOpen(true)}
                    className={cn(
                      "rounded-full shrink-0",
                      isSearchOpen
                        ? "absolute right-0 text-foreground"
                        : showSolidNav ? "text-foreground" : "text-primary-foreground"
                    )}
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                </div>
              </form>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className={cn(
                  "rounded-full",
                  showSolidNav ? "text-foreground" : "text-primary-foreground"
                )}
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "relative h-10 gap-2 rounded-full pl-2 pr-3",
                        showSolidNav ? "hover:bg-muted" : "hover:bg-primary-foreground/10"
                      )}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name || "User"} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                          {(user.user_metadata?.full_name || user.email || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className={cn(
                        "hidden sm:block text-sm font-medium",
                        showSolidNav ? "text-foreground" : "text-primary-foreground"
                      )}>
                        {user.user_metadata?.full_name?.split(" ")[0] || "Account"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-popover border border-border shadow-lg z-50">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          Welcome back, {user.user_metadata?.full_name?.split(" ")[0] || "there"}!
                        </p>
                        <p className="text-xs leading-none text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard/settings")} className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button
                    variant={showSolidNav ? "ghost" : "navHero"}
                    onClick={() => navigate("/auth")}
                  >
                    Login
                  </Button>
                  <Button
                    variant={showSolidNav ? "default" : "hero"}
                    size="lg"
                    onClick={() => navigate("/auth")}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex lg:hidden items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className={cn(
                  "rounded-full",
                  showSolidNav ? "text-foreground" : "text-primary-foreground"
                )}
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(true)}
                className={cn(
                  showSolidNav ? "text-foreground" : "text-primary-foreground"
                )}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop with blur */}
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-md"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Sidebar with glassmorphism */}
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-card/95 backdrop-blur-xl border-l border-border/50 shadow-2xl animate-slide-in-right overflow-hidden">
            {/* Decorative gradient orbs */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-20 left-0 w-32 h-32 bg-secondary/20 rounded-full blur-3xl -translate-x-1/2" />

            <div className="flex flex-col h-full relative z-10">
              {/* Header with gradient border */}
              <div className="flex items-center justify-between p-5 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                    <span className="text-primary-foreground font-bold text-lg">R</span>
                  </div>
                  <div>
                    <span className="text-xl font-extrabold font-heading bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">REBAL</span>
                    <p className="text-xs text-muted-foreground">Property Platform</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Mobile Search Bar */}
              <div className="p-4 border-b border-border/50">
                <form onSubmit={handleSearch} className="relative">
                  <Input
                    type="text"
                    placeholder="Search properties..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10 bg-muted/50 border-border/50"
                  />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full text-muted-foreground hover:text-foreground"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
              </div>

              {/* Navigation Links */}
              <div className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">Navigation</p>
                {navLinks.map((link, index) => {
                  const isActive = link.href === location.pathname;
                  const Icon = link.icon;
                  return (
                    <button
                      key={link.name}
                      onClick={() => handleNavClick(link.href, link.isRoute)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
                        isActive
                          ? "bg-primary/10 text-primary shadow-sm border border-primary/20"
                          : "text-foreground hover:bg-muted/80"
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                        isActive
                          ? "bg-primary/20 text-primary"
                          : "bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
                      )}>{/*  */}
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-medium flex-1 text-left">{link.name}</span>
                      <ChevronRight className={cn(
                        "h-4 w-4 transition-transform",
                        isActive ? "text-primary" : "text-muted-foreground/50 group-hover:translate-x-0.5"
                      )} />
                    </button>
                  );
                })}

                {/* Account Links */}
                <div className="pt-2 mt-2 border-t border-border/50">
                  {user ? (
                    <>
                      {/* User Profile Header */}
                      <div className="flex items-center gap-3 px-3 py-3 mb-2">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name || "User"} />
                          <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                            {(user.user_metadata?.full_name || user.email || "U").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            Welcome back, {user.user_metadata?.full_name?.split(" ")[0] || "there"}!
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setIsMobileMenuOpen(false); navigate("/dashboard"); }}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-foreground hover:bg-muted/80 transition-all duration-200 group"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                          <LayoutDashboard className="h-4 w-4" />
                        </div>
                        <span className="font-medium flex-1 text-left">Dashboard</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                      <button
                        onClick={() => { setIsMobileMenuOpen(false); navigate("/dashboard/settings"); }}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-foreground hover:bg-muted/80 transition-all duration-200 group"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:text-foreground transition-colors">
                          <Settings className="h-4 w-4" />
                        </div>
                        <span className="font-medium flex-1 text-left">Settings</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                      <button
                        onClick={() => { setIsMobileMenuOpen(false); signOut(); }}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-foreground hover:bg-destructive/10 transition-all duration-200 group"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-destructive/10 group-hover:text-destructive transition-colors">
                          <LogOut className="h-4 w-4" />
                        </div>
                        <span className="font-medium flex-1 text-left">Logout</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3 mt-3">Account</p>
                      <button
                        onClick={() => { setIsMobileMenuOpen(false); navigate("/auth"); }}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-foreground hover:bg-muted/80 transition-all duration-200 group"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:text-foreground transition-colors">
                          <LogIn className="h-4 w-4" />
                        </div>
                        <span className="font-medium flex-1 text-left">Login</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* CTA Footer */}
              <div className="p-4 border-t border-border/50 bg-gradient-to-t from-muted/30 to-transparent">
                <Button
                  variant="default"
                  size="lg"
                  className="w-full rounded-xl h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20 group"
                  onClick={() => { setIsMobileMenuOpen(false); navigate("/auth"); }}
                >
                  <span>Get Started</span>
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-3">
                  Start your 14-day free trial
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
