import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CompanyProfile, Property } from "@/types/company";
import { BASE_URL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { CompanyButton } from "@/components/company/CompanyButton";
import { CompanyFooter } from "@/components/company/CompanyFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { RecentlyViewed } from "@/components/company/RecentlyViewed";
import { toast } from "sonner";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Send,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  ImageIcon,
  X,
  CheckCircle2,
  Building,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShareSection } from "@/components/share/ShareSection";
import { getFeatureIcon } from "@/lib/featureIcons";
import { ScrollReveal } from "@/hooks/useScrollReveal";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";
import { useSEO } from "@/hooks/useSEO";
import { useLeadTracking } from "@/hooks/useLeadTracking";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { submitInquiry, trackAnalytics } from "@/lib/publicApi";
import { useTheme } from "@/contexts/ThemeContext";
import { useCustomDomainContext } from "@/contexts/CustomDomainContext";
import {
  SEOStructuredData,
  getPropertyListingSchema,
  getBreadcrumbSchema
} from "@/components/SEOStructuredData";
import ReactPlayer from "react-player";
import { cn } from "@/lib/utils";

const PropertyDetailsPage = () => {
  const { companySlug: urlCompanySlug, propertySlug } = useParams<{
    companySlug: string;
    propertySlug: string;
  }>();
  const { isCustomDomain, companySlug: customDomainSlug } = useCustomDomainContext();

  // Use custom domain slug if available, otherwise fall back to URL params
  const companySlug = isCustomDomain && customDomainSlug ? customDomainSlug : urlCompanySlug;
  const navigate = useNavigate();
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  // Use global theme context
  const { toggleTheme } = useTheme();

  // Apply Company Branding
  useCompanyBranding(company);

  // Lead tracking
  const { linkToInquiry } = useLeadTracking({
    companyId: company?.id || "",
    propertyId: property?.id,
  });

  // Recently viewed tracking
  const { addToRecentlyViewed } = useRecentlyViewed();

  useEffect(() => {
    if (property && companySlug) {
      addToRecentlyViewed(property, companySlug);
    }
  }, [property, companySlug, addToRecentlyViewed]);

  useEffect(() => {
    const fetchData = async () => {
      if (!companySlug || !propertySlug) {
        setError("Property not found");
        setLoading(false);
        return;
      }

      try {
        const { data: companyArray, error: companyError } = await supabase
          .rpc("get_public_company_profile_safe", { company_slug: companySlug });

        if (companyError) throw companyError;
        const companyData = companyArray?.[0];
        if (!companyData) {
          setError("Company not found");
          setLoading(false);
          return;
        }

        setCompany(companyData as CompanyProfile);

        const { data: propertyData, error: propertyError } = await supabase
          .from("properties")
          .select("*")
          .eq("company_id", companyData.id)
          .eq("slug", propertySlug)
          .single();

        if (propertyError) throw propertyError;
        if (!propertyData) {
          setError("Property not found");
          setLoading(false);
          return;
        }

        setProperty(propertyData as Property);

        trackAnalytics({
          company_id: companyData.id!,
          property_id: propertyData.id,
          event_type: "property_view",
        });
      } catch (err) {
        console.error("Error fetching property:", err);
        setError("Failed to load property data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companySlug, propertySlug]);

  const pageTitle = property?.meta_title || property?.title || "Property";
  const pageDescription = property?.meta_description || property?.description ||
    `${property?.title || "Property"} - ${property?.property_type || ""} for ${property?.purpose || ""}`;

  useSEO({
    title: property && company ? `${pageTitle} | ${company.name} | REBAL` : "Loading... | REBAL",
    description: pageDescription,
    image: property?.main_image_url || "/og-image.png",
    keywords: property?.keywords || undefined,
    type: "article",
    url: property && company ? `/${companySlug}/property/${propertySlug}` : undefined,
  });

  const propertySchema = property ? getPropertyListingSchema({
    title: property.title,
    description: property.description || undefined,
    image: property.main_image_url || undefined,
    url: `${BASE_URL}/${companySlug}/property/${propertySlug}`,
    price: property.price,
    location: property.location || undefined,
    state: property.state || undefined,
    city: property.city || undefined,
    address: property.address || undefined,
  }) : null;

  const breadcrumbSchema = property && company ? getBreadcrumbSchema([
    { name: "Home", url: BASE_URL },
    { name: "Properties", url: `${BASE_URL}/properties` },
    { name: company.name, url: `${BASE_URL}/${companySlug}` },
    { name: property.title, url: `${BASE_URL}/${companySlug}/property/${propertySlug}` },
  ]) : null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const allImages = property
    ? [property.main_image_url, ...(property.gallery_urls || [])].filter(Boolean) as string[]
    : [];

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) =>
      prev === 0 ? allImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) =>
      prev === allImages.length - 1 ? 0 : prev + 1
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !property) return;

    setIsSubmitting(true);
    try {
      const result = await submitInquiry({
        company_id: company.id!,
        property_id: property.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        message: formData.message,
      });

      if (result?.id) {
        await linkToInquiry(result.id);
      }

      toast.success("Your inquiry has been sent successfully!");
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (err: any) {
      console.error("Error submitting inquiry:", err);
      if (err.message?.includes("Too many requests")) {
        toast.error("You're sending too many inquiries. Please wait a few minutes and try again.");
      } else {
        toast.error("Failed to send inquiry. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-20" />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-1/3 mb-8" />
          <Skeleton className="h-[500px] w-full mb-8 rounded-2xl" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-40 w-full" />
            </div>
            <Skeleton className="h-[400px] rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !property || !company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-heading mb-4">Property Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The property you're looking for doesn't exist or has been removed.
          </p>
          <CompanyButton onClick={() => navigate(`/${companySlug}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Company
          </CompanyButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
      {propertySchema && <SEOStructuredData data={propertySchema} />}
      {breadcrumbSchema && <SEOStructuredData data={breadcrumbSchema} />}

      {/* Hero / Header Section */}
      <section className="pt-12 pb-16 bg-gradient-to-b from-muted/30 to-background relative border-b border-border/50 overflow-hidden">
        {/* Subtle grid pattern for texture */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <ScrollReveal>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary dark:hover:text-secondary transition-colors mb-8 group"
            >
              <div className="h-8 w-8 rounded-full bg-background border border-border flex items-center justify-center mr-2 shadow-sm group-hover:scale-105 transition-transform duration-300">
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              </div>
              Back to Listings
            </button>

            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
              <div className="space-y-6 max-w-3xl">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary" className="bg-primary/10 text-primary dark:text-secondary dark:bg-secondary/10 border-0 rounded-full px-4 py-1.5 text-sm font-medium hover:bg-primary/20 dark:hover:bg-secondary/20 transition-colors">
                    {property.property_type}
                  </Badge>
                  <Badge variant="outline" className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium border border-primary/20",
                    property.purpose.toLowerCase().includes("sale")
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20"
                      : "bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-500/20"
                  )}>
                    {property.purpose.toLowerCase().startsWith('for') ? property.purpose : `For ${property.purpose}`}
                  </Badge>
                  {property.featured && (
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 rounded-full px-4 py-1.5 text-sm shadow-md">
                      Featured
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-heading tracking-tight leading-[1.1]">
                    {property.title}
                  </h1>

                  {property.location && (
                    <div className="flex items-center gap-2 text-muted-foreground text-lg md:text-xl font-light">
                      <MapPin className="h-5 w-5 text-primary dark:text-secondary shrink-0" />
                      <span>{property.location}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-start md:items-end gap-4 mt-2 md:mt-0">
                <div className="text-4xl lg:text-5xl font-bold text-primary dark:text-secondary tracking-tight">
                  {formatPrice(property.price)}
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-muted-foreground hidden md:block">Share this property:</p>
                  <ShareSection
                    url={`/${companySlug}/property/${propertySlug}`}
                    title={`${property.title} - ${formatPrice(property.price)}`}
                    description={property.description || `${property.property_type} for ${property.purpose}`}
                    variant="compact"
                    customDomain={company.custom_domain}
                  />
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <main className="container mx-auto px-4 lg:px-8 py-16">
        {/* Gallery Section */}
        <ScrollReveal delay={100} className="mb-20">
          <div className="relative group rounded-[2rem] overflow-hidden shadow-2xl border border-border/50 bg-muted">
            <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
              <DialogTrigger asChild>
                <div className="cursor-pointer relative aspect-video md:aspect-[21/9]">
                  {allImages.length > 0 ? (
                    <>
                      <div className="absolute inset-0 bg-black/5 z-10 transition-colors group-hover:bg-black/0" />
                      <OptimizedImage
                        src={allImages[selectedImageIndex]}
                        alt={property.title}
                        aspectRatio="21/9"
                        priority={true}
                        className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                        fallback={
                          <div className="flex items-center justify-center h-full">
                            <ImageIcon className="h-16 w-16 text-muted-foreground opacity-50" />
                          </div>
                        }
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500 z-20 flex items-end justify-center pb-10">
                        <div className="bg-white/10 backdrop-blur-xl text-white px-8 py-4 rounded-full border border-white/20 flex items-center gap-3 hover:bg-white/20 transition-all hover:scale-105 shadow-xl">
                          <ImageIcon className="h-5 w-5" />
                          <span className="font-semibold tracking-wide text-sm uppercase">View Gallery ({allImages.length})</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/50">
                      <div className="flex flex-col items-center gap-3">
                        <ImageIcon className="h-16 w-16 opacity-20" />
                        <span className="text-lg">No images available</span>
                      </div>
                    </div>
                  )}
                </div>
              </DialogTrigger>
              {/* Dialog Content (Gallery Modal) */}
              <DialogContent className="max-w-[100vw] w-full h-[100vh] p-0 bg-black/95 border-none duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
                <DialogTitle className="sr-only">Image Gallery</DialogTitle>
                <div className="relative h-full w-full flex items-center justify-center">
                  <DialogClose className="absolute top-6 right-6 z-50 rounded-full bg-white/10 hover:bg-white/20 p-3 text-white transition-all backdrop-blur-md">
                    <X className="h-6 w-6" />
                    <span className="sr-only">Close</span>
                  </DialogClose>

                  {allImages.length > 0 && (
                    <div className="relative h-full w-full flex flex-col items-center justify-center p-4">
                      <img
                        src={allImages[selectedImageIndex]}
                        alt={`Gallery ${selectedImageIndex + 1}`}
                        className="max-h-[85vh] max-w-full object-contain shadow-2xl rounded-sm"
                      />

                      {allImages.length > 1 && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-4 lg:left-10 top-1/2 -translate-y-1/2 rounded-full bg-white/10 hover:bg-white/20 text-white h-16 w-16 backdrop-blur-md transition-all hover:scale-110 border border-white/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrevImage();
                            }}
                          >
                            <ChevronLeft className="h-8 w-8" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-4 lg:right-10 top-1/2 -translate-y-1/2 rounded-full bg-white/10 hover:bg-white/20 text-white h-16 w-16 backdrop-blur-md transition-all hover:scale-110 border border-white/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNextImage();
                            }}
                          >
                            <ChevronRight className="h-8 w-8" />
                          </Button>

                          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] p-2 bg-black/40 rounded-full backdrop-blur-md border border-white/10">
                            {allImages.map((_, index) => (
                              <button
                                key={index}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedImageIndex(index);
                                }}
                                className={cn(
                                  "w-2.5 h-2.5 rounded-full transition-all duration-300",
                                  index === selectedImageIndex ? "bg-white w-8" : "bg-white/40 hover:bg-white/70"
                                )}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {allImages.length > 1 && (
            <div className="flex gap-4 overflow-x-auto py-6 px-1 scrollbar-hide snap-x">
              {allImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={cn(
                    "relative flex-shrink-0 w-32 h-20 rounded-xl overflow-hidden transition-all duration-500 snap-start border-2",
                    index === selectedImageIndex
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 border-primary shadow-lg"
                      : "border-transparent opacity-60 hover:opacity-100 hover:scale-105 grayscale hover:grayscale-0"
                  )}
                >
                  <img src={image} alt={`Thumbnail ${index}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </ScrollReveal>

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
          <div className="lg:col-span-8 space-y-16">

            {property.description && (
              <ScrollReveal delay={200}>
                <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-heading prose-headings:tracking-tight prose-a:text-primary dark:prose-a:text-secondary prose-p:text-muted-foreground prose-p:leading-loose">
                  <h2 className="flex items-center gap-3 text-3xl mb-8 pb-4 border-b border-border/50">
                    <div className="p-2 rounded-xl bg-primary/10 dark:bg-secondary/10 text-primary dark:text-secondary">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    About This Property
                  </h2>
                  <div
                    className="text-muted-foreground leading-relaxed space-y-4"
                    dangerouslySetInnerHTML={{ __html: property.description }}
                  />
                </div>
              </ScrollReveal>
            )}

            {property.features && property.features.length > 0 && (
              <ScrollReveal delay={300}>
                <h2 className="flex items-center gap-3 text-3xl font-bold text-heading mb-8 pb-4 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-primary/10 dark:bg-secondary/10 text-primary dark:text-secondary">
                    <Building className="w-6 h-6" />
                  </div>
                  Features & Amenities
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {property.features.map((feature, index) => {
                    const FeatureIcon = getFeatureIcon(feature);
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border/40 hover:border-primary/30 dark:hover:border-secondary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5 text-primary dark:bg-secondary/5 dark:text-secondary group-hover:bg-primary/10 dark:group-hover:bg-secondary/10 transition-colors">
                          <FeatureIcon className="h-6 w-6 transition-transform duration-500 group-hover:scale-110" />
                        </div>
                        <span className="font-medium text-foreground text-sm leading-tight">{feature}</span>
                      </div>
                    );
                  })}
                </div>
              </ScrollReveal>
            )}

            {property.video_url && (
              <ScrollReveal delay={400}>
                <h2 className="flex items-center gap-3 text-3xl font-bold text-heading mb-8 pb-4 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-primary/10 dark:bg-secondary/10 text-primary dark:text-secondary">
                    <div className="w-6 h-6 flex items-center justify-center">
                      <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-current border-b-[5px] border-b-transparent ml-1" />
                    </div>
                  </div>
                  Video Tour
                </h2>
                <div className="rounded-3xl overflow-hidden shadow-2xl bg-black border border-border/50 aspect-video relative group ring-1 ring-white/10">
                  {property.video_url.includes("drive.google.com") ? (
                    <iframe
                      src={property.video_url.replace("/view", "/preview").replace("/open", "/preview")}
                      className="w-full h-full"
                      allow="autoplay; encrypted-media; fullscreen"
                      allowFullScreen
                    />
                  ) : (
                    <ReactPlayer
                      url={property.video_url}
                      width="100%"
                      height="100%"
                      controls={true}
                      light={property.main_image_url || true}
                      playIcon={
                        <div className="relative z-10">
                          <div className="absolute inset-0 bg-primary/30 dark:bg-secondary/30 rounded-full blur-xl animate-pulse"></div>
                          <div className="rounded-full bg-white/20 backdrop-blur-md p-6 hover:scale-110 transition-transform duration-500 cursor-pointer group shadow-2xl border border-white/40">
                            <div className="h-0 w-0 border-t-[14px] border-t-transparent border-l-[26px] border-l-white border-b-[14px] border-b-transparent ml-1.5" />
                          </div>
                        </div>
                      }
                    />
                  )}
                </div>
              </ScrollReveal>
            )}

            {property.address && (
              <ScrollReveal delay={500}>
                <h2 className="flex items-center gap-3 text-3xl font-bold text-heading mb-8 pb-4 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-primary/10 dark:bg-secondary/10 text-primary dark:text-secondary">
                    <MapPin className="w-6 h-6" />
                  </div>
                  Location
                </h2>
                <Card className="bg-muted/30 border-border/50 rounded-3xl overflow-hidden">
                  <CardContent className="p-0">
                    {/* Placeholder map visual could go here, for now just stylish address */}
                    <div className="p-8 flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 dark:bg-secondary/10 flex items-center justify-center shrink-0">
                        <MapPin className="h-5 w-5 text-primary dark:text-secondary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg mb-1">Property Address</h4>
                        <p className="text-xl text-muted-foreground font-light">
                          {property.address}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            )}
          </div>

          <div className="lg:col-span-4 pl-0 lg:pl-4">
            <div className="sticky top-28 space-y-8">
              <ScrollReveal direction="left" delay={200}>
                <div className="relative">
                  {/* Decorative blurred background for the card */}
                  <div className="absolute inset-0 bg-primary/5 dark:bg-secondary/5 blur-3xl rounded-full -z-10 transform scale-110 opacity-50" />

                  <Card className="border-border/60 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden bg-white/80 dark:bg-card/80 backdrop-blur-md rounded-[2rem]">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50 dark:from-secondary dark:to-secondary/50" />
                    <CardContent className="p-8">
                      <div className="mb-8">
                        <h3 className="text-2xl font-bold text-heading mb-2">Interested?</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          Fill out the form below and our agents will get back to you shortly.
                        </p>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-foreground font-medium pl-1">Full Name</Label>
                          <Input
                            id="name"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="bg-muted/50 border-border/60 focus:ring-2 focus:ring-primary/20 focus:border-primary h-14 rounded-2xl px-5 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-foreground font-medium pl-1">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="bg-muted/50 border-border/60 focus:ring-2 focus:ring-primary/20 focus:border-primary h-14 rounded-2xl px-5 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-foreground font-medium pl-1">Phone Number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+234..."
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="bg-muted/50 border-border/60 focus:ring-2 focus:ring-primary/20 focus:border-primary h-14 rounded-2xl px-5 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="message" className="text-foreground font-medium pl-1">Message</Label>
                          <Textarea
                            id="message"
                            placeholder={`I am interested in ${property.title}. Please contact me.`}
                            rows={4}
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            required
                            className="bg-muted/50 border-border/60 focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-2xl resize-none px-5 py-4 transition-all"
                          />
                        </div>

                        <CompanyButton
                          type="submit"
                          size="lg"
                          className="w-full gap-2 rounded-2xl h-14 mt-4 shadow-lg hover:shadow-primary/25 hover:scale-[1.02] transition-all duration-300 text-base font-semibold"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>Sending...</>
                          ) : (
                            <>
                              <Send className="h-5 w-5" />
                              Send Inquiry
                            </>
                          )}
                        </CompanyButton>
                      </form>

                      <div className="mt-8 pt-8 border-t border-border/60 flex flex-col gap-4">
                        <p className="text-sm font-semibold text-muted-foreground text-center uppercase tracking-wider text-[10px]">Direct Contact</p>
                        <div className="grid grid-cols-2 gap-4">
                          {company.phone && (
                            <a
                              href={`tel:${company.phone}`}
                              className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-muted/50 hover:bg-primary/10 hover:text-primary dark:hover:text-white dark:hover:bg-primary/20 transition-all text-sm font-medium border border-border/50 hover:border-primary/30"
                            >
                              <Phone className="h-4 w-4" />
                              Call
                            </a>
                          )}
                          {company.whatsapp ? (
                            <a
                              href={`https://wa.me/${company.whatsapp.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-muted/50 hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400 transition-all text-sm font-medium border border-border/50 hover:border-green-500/30"
                            >
                              <MessageCircle className="h-4 w-4" />
                              WhatsApp
                            </a>
                          ) : (
                            <CompanyButton variant="outline" className="w-full rounded-2xl" onClick={() => navigate(`/${companySlug}/contact`)}>
                              Contact
                            </CompanyButton>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>

        <div className="mt-32">
          <RecentlyViewed companySlug={company.slug} currentPropertyId={property.id} />
        </div>
      </main>

      <CompanyFooter company={company} />
    </div>
  );
};

export default PropertyDetailsPage;
