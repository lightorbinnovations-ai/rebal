import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CompanyProfile } from "@/types/company";
import { CompanyNavbar } from "@/components/company/CompanyNavbar";
import { CompanyFooter } from "@/components/company/CompanyFooter";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CompanyButton } from "@/components/company/CompanyButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  MessageCircle,
  Mails,
  Clock,
  Send,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";
import { useSEO } from "@/hooks/useSEO";
import { ScrollReveal } from "@/hooks/useScrollReveal";
import { useTheme } from "@/contexts/ThemeContext";
import { useCustomDomainContext } from "@/contexts/CustomDomainContext";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

const ContactInfoCard = ({ icon: Icon, title, value, href, actionLabel }: {
  icon: React.ElementType;
  title: string;
  value: string;
  href?: string;
  actionLabel?: string;
}) => (
  // Strict Theme: Border Button (matches Primary/Secondary), Icon text-icon
  <Card className="h-full border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-card group">
    <CardContent className="p-6">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-button/10 flex items-center justify-center shrink-0 group-hover:bg-button group-hover:text-button-foreground transition-colors">
          <Icon className="h-6 w-6 text-icon group-hover:text-button-foreground transition-colors" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-heading mb-1">{title}</h3>
          <p className="text-muted-foreground mb-3 leading-relaxed break-all">{value}</p>
          {href && (
            <a
              href={href}
              className="inline-flex items-center text-sm font-medium text-button hover:underline"
            >
              {actionLabel || "Connect"} <ArrowRight className="ml-1 h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

// Import ArrowRight safely if not imported
import { ArrowRight } from "lucide-react";

const CompanyContactPage = () => {
  const { companySlug: urlSlug } = useParams<{ companySlug: string }>();
  const { isCustomDomain, companySlug: customDomainSlug } = useCustomDomainContext();
  const companySlug = isCustomDomain && customDomainSlug ? customDomainSlug : urlSlug;

  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { isDark, toggleTheme } = useTheme();
  useCompanyBranding(company);

  const form = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  useEffect(() => {
    const fetchCompany = async () => {
      if (!companySlug) {
        setError("Company not found");
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
      } catch (err) {
        console.error("Error fetching company:", err);
        setError("Failed to load company data");
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [companySlug]);

  useSEO({
    title: company ? `Contact Us | ${company.name} | REBAL` : "Contact Us | REBAL",
    description: company?.description || "Get in touch with us for your real estate needs.",
    image: company?.logo_url || company?.hero_image_url || "/og-image.png",
  });

  const onSubmit = async (values: z.infer<typeof contactFormSchema>) => {
    if (!company) return;

    try {
      const { error } = await supabase.from("inquiries").insert({
        company_id: company.id,
        name: values.name,
        email: values.email,
        phone: values.phone,
        message: values.message,
        status: "New",
      });

      if (error) throw error;

      toast.success("Message sent successfully!");
      setIsSubmitted(true);
      form.reset();
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Failed to send message. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-20" />
        <div className="container mx-auto px-4 py-20">
          <Skeleton className="h-10 w-64 mb-8 mx-auto" />
          <div className="grid lg:grid-cols-2 gap-12">
            <Skeleton className="h-[500px] rounded-3xl" />
            <Skeleton className="h-[500px] rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="h-20 w-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
            <Building2 className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-heading mb-4">Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The company you're looking for doesn't exist.
          </p>
          <CompanyButton
            onClick={() => window.location.href = "/"}
            className="rounded-full px-8"
          >
            Go to Homepage
          </CompanyButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CompanyNavbar company={company} isDark={isDark} toggleTheme={toggleTheme} />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-muted/50 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 lg:px-8 text-center relative">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 bg-button/10 text-button px-4 py-2 rounded-full text-sm font-medium mb-4">
              <MessageCircle className="h-4 w-4" />
              Get in Touch
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-heading mb-4">
              Contact Us
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Have questions or ready to start your journey? We're here to help.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">

            {/* Contact Info Column */}
            <div className="space-y-8">
              <ScrollReveal>
                <div className="grid sm:grid-cols-2 gap-6">
                  {company.phone && (
                    <ContactInfoCard
                      icon={Phone}
                      title="Phone"
                      value={company.phone}
                      href={`tel:${company.phone}`}
                      actionLabel="Call Now"
                    />
                  )}
                  {company.email && (
                    <ContactInfoCard
                      icon={Mail}
                      title="Email"
                      value={company.email}
                      href={`mailto:${company.email}`}
                      actionLabel="Send Email"
                    />
                  )}
                  {company.address && (
                    <ContactInfoCard
                      icon={MapPin}
                      title="Office"
                      value={company.address}
                      href={`https://maps.google.com/?q=${encodeURIComponent(company.address)}`}
                      actionLabel="Get Directions"
                    />
                  )}
                  {/* WhatsApp needs strict token but branding matters? 
                       ContactInfoCard enforces theme. 
                       If I want branding, I'd need custom card.
                       I'll use ContactInfoCard for consistency.
                   */}
                  {company.whatsapp && (
                    <ContactInfoCard
                      icon={MessageCircle}
                      title="WhatsApp"
                      value="Chat with us"
                      href={`https://wa.me/${company.whatsapp.replace(/\D/g, "")}`}
                      actionLabel="Open Chat"
                    />
                  )}
                </div>
              </ScrollReveal>

              {/* Response Time Banner */}
              <ScrollReveal delay={100}>
                <div className="rounded-2xl bg-button/5 border border-button/10 p-6 flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-button/10 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-button" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-heading mb-1">Fast Response Time</h4>
                    <p className="text-sm text-muted-foreground">
                      We typically respond to all inquiries within 24 hours during business days.
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Contact Form Column */}
            <ScrollReveal delay={200}>
              <Card className="border-border/50 shadow-xl bg-card">
                <CardContent className="p-8 lg:p-10">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-heading mb-2">Send us a Message</h2>
                    <p className="text-muted-foreground">
                      Fill out the form below and we'll get back to you shortly.
                    </p>
                  </div>

                  {isSubmitted ? (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center animate-fade-in">
                      <div className="h-16 w-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-bold text-heading mb-2">Message Sent!</h3>
                      <p className="text-muted-foreground mb-6">
                        Thank you for contacting us. We have received your message and will respond as soon as possible.
                      </p>
                      <CompanyButton
                        onClick={() => setIsSubmitted(false)}
                        className="rounded-full"
                      >
                        Send Another Message
                      </CompanyButton>
                    </div>
                  ) : (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-heading">Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} className="h-12 rounded-xl bg-background border-input focus:border-button focus:ring-button/20" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid sm:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-heading">Email Address</FormLabel>
                                <FormControl>
                                  <Input placeholder="john@example.com" {...field} className="h-12 rounded-xl bg-background border-input focus:border-button focus:ring-button/20" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-heading">Phone Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="+1234567890" {...field} className="h-12 rounded-xl bg-background border-input focus:border-button focus:ring-button/20" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-heading">Message</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="How can we help you?"
                                  className="min-h-[150px] resize-none rounded-xl bg-background border-input focus:border-button focus:ring-button/20"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <CompanyButton
                          type="submit"
                          className="w-full h-12 rounded-xl text-lg hover:shadow-lg transition-all"
                          disabled={form.formState.isSubmitting}
                        >
                          {form.formState.isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-5 w-5" />
                              Send Message
                            </>
                          )}
                        </CompanyButton>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <CompanyFooter company={company} />
    </div>
  );
};

export default CompanyContactPage;
