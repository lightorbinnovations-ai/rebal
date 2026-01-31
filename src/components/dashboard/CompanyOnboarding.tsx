import { useState } from "react";
import { Building2, Loader2, ArrowRight, ChevronDown, ChevronUp, Users, Home } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { AccountType } from "@/types/company";

// Validation schema - all essential fields are required
const companyFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name must be less than 100 characters"),
  tagline: z
    .string()
    .trim()
    .min(5, "Tagline must be at least 5 characters")
    .max(150, "Tagline must be less than 150 characters"),
  description: z
    .string()
    .trim()
    .min(20, "Please provide at least 20 characters about your business")
    .max(1000, "Description must be less than 1000 characters"),
  logo_url: z
    .string()
    .trim()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .regex(/^[+]?[\d\s\-()]{7,20}$/, "Please enter a valid phone number"),
  email: z
    .string()
    .trim()
    .min(1, "Business email is required")
    .email("Please enter a valid email address"),
  address: z
    .string()
    .trim()
    .min(5, "Please provide your business address")
    .max(300, "Address must be less than 300 characters"),
  whatsapp: z
    .string()
    .trim()
    .regex(/^[+]?[\d\s\-()]{7,20}$/, "Please enter a valid WhatsApp number")
    .optional()
    .or(z.literal("")),
  telegram: z
    .string()
    .trim()
    .max(100, "Telegram username must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  facebook: z
    .string()
    .trim()
    .url("Please enter a valid Facebook URL")
    .optional()
    .or(z.literal("")),
  instagram: z
    .string()
    .trim()
    .url("Please enter a valid Instagram URL")
    .optional()
    .or(z.literal("")),
  twitter: z
    .string()
    .trim()
    .url("Please enter a valid X (Twitter) URL")
    .optional()
    .or(z.literal("")),
  linkedin: z
    .string()
    .trim()
    .url("Please enter a valid LinkedIn URL")
    .optional()
    .or(z.literal("")),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

interface CompanyOnboardingProps {
  userId: string;
  userEmail?: string;
  onComplete: () => void;
}

export const CompanyOnboarding = ({
  userId,
  userEmail,
  onComplete,
}: CompanyOnboardingProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showSocialLinks, setShowSocialLinks] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [accountType, setAccountType] = useState<AccountType | null>(null);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      tagline: "",
      description: "",
      logo_url: "",
      phone: "",
      email: userEmail || "", // Default to user's login email
      address: "",
      whatsapp: "",
      telegram: "",
      facebook: "",
      instagram: "",
      twitter: "",
      linkedin: "",
    },
    mode: "onChange",
  });

  // Handle affiliate quick signup
  const handleAffiliateSignup = async () => {
    setIsLoading(true);
    try {
      // Generate a simple slug from user email or random
      const baseSlug = userEmail?.split("@")[0] || `affiliate-${Date.now()}`;
      const slug = baseSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      // Check for referral code
      const referralCode = localStorage.getItem("referral_code");
      let referredById: string | null = null;

      if (referralCode) {
        const { data: referrerCompany } = await supabase
          .from("companies")
          .select("id, name")
          .eq("referral_code", referralCode)
          .maybeSingle();

        if (referrerCompany) {
          referredById = referrerCompany.id;
        }
      }

      const { error } = await supabase.from("companies").insert({
        user_id: userId,
        slug,
        name: `Affiliate ${slug}`,
        email: userEmail || null,
        account_type: "affiliate" as AccountType,
        referred_by: referredById,
        last_email_confirmed_at: new Date().toISOString(),
      });

      if (error) {
        if (error.code === "23505") {
          // Slug conflict, try with timestamp
          const newSlug = `${slug}-${Date.now()}`;
          const { error: retryError } = await supabase.from("companies").insert({
            user_id: userId,
            slug: newSlug,
            name: `Affiliate ${newSlug}`,
            email: userEmail || null,
            account_type: "affiliate" as AccountType,
            referred_by: referredById,
            last_email_confirmed_at: new Date().toISOString(),
          });
          if (retryError) throw retryError;
        } else {
          throw error;
        }
      }

      // Get the newly created company ID for conversion tracking
      const { data: newCompany } = await supabase
        .from("companies")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      // Track referral conversion
      if (referralCode && newCompany) {
        const fingerprint = localStorage.getItem("visitor_fingerprint") || "";
        supabase.functions.invoke("track-referral", {
          body: {
            action: "convert",
            referral_code: referralCode,
            visitor_fingerprint: fingerprint,
            company_id: newCompany.id,
          },
        }).catch(console.error);
      }

      localStorage.removeItem("referral_code");
      localStorage.removeItem("visitor_fingerprint");

      toast({
        title: "Welcome, Affiliate!",
        description: "Your account is ready. Start earning by sharing your referral link!",
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: "Failed to create account",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const watchedName = form.watch("name");

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const onSubmit = async (data: CompanyFormValues) => {
    setIsLoading(true);

    try {
      const slug = generateSlug(data.name);

      // Check for referral code in localStorage
      const referralCode = localStorage.getItem("referral_code");
      let referredById: string | null = null;

      console.log("[Referral] Checking for referral code:", referralCode);

      if (referralCode) {
        // Look up the referrer company by their referral code
        // Use maybeSingle() to avoid throwing if no referrer found
        const { data: referrerCompany } = await supabase
          .from("companies")
          .select("id, name")
          .eq("referral_code", referralCode)
          .maybeSingle();

        if (referrerCompany) {
          referredById = referrerCompany.id;
          console.log("[Referral] Found referrer:", referrerCompany.name, "ID:", referredById);
        } else {
          console.log("[Referral] No referrer found for code:", referralCode);
        }
      }

      const { error } = await supabase.from("companies").insert({
        user_id: userId,
        slug,
        name: data.name.trim(),
        tagline: data.tagline?.trim() || null,
        description: data.description?.trim() || null,
        logo_url: data.logo_url?.trim() || null,
        phone: data.phone.trim(),
        email: data.email?.trim() || userEmail || null, // Fall back to user's login email
        address: data.address?.trim() || null,
        whatsapp: data.whatsapp?.trim() || null,
        telegram: data.telegram?.trim() || null,
        facebook: data.facebook?.trim() || null,
        instagram: data.instagram?.trim() || null,
        twitter: data.twitter?.trim() || null,
        linkedin: data.linkedin?.trim() || null,
        referred_by: referredById,
        account_type: "realtor" as AccountType,
        // Set last_email_confirmed_at on creation so new users don't need reverification immediately
        last_email_confirmed_at: new Date().toISOString(),
      });

      if (error) {
        if (error.code === "23505") {
          form.setError("name", {
            type: "manual",
            message: "This business name is already taken. Please choose a different name.",
          });
        } else {
          throw error;
        }
        return;
      }

      // Get the newly created company ID for conversion tracking
      const { data: newCompany } = await supabase
        .from("companies")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      // Track the referral conversion server-side (non-blocking)
      if (referralCode && newCompany) {
        const fingerprint = localStorage.getItem("visitor_fingerprint") || "";
        // Fire and forget - don't await to avoid blocking user experience
        supabase.functions.invoke("track-referral", {
          body: {
            action: "convert",
            referral_code: referralCode,
            visitor_fingerprint: fingerprint,
            company_id: newCompany.id,
          },
        }).then(() => {
          console.log("[Referral] Conversion tracked for company:", newCompany.id);
        }).catch((convError) => {
          console.error("[Referral] Failed to track conversion:", convError);
        });
      }

      // Clean up localStorage (always, regardless of conversion success)
      localStorage.removeItem("referral_code");
      localStorage.removeItem("visitor_fingerprint");

      toast({
        title: "Profile created!",
        description: referredById
          ? "Your profile is ready. You were referred - both you and your referrer will benefit!"
          : "Your profile is ready. Start adding properties.",
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: "Failed to create company",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Account type selection screen
  if (!accountType) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="w-full max-w-2xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome to REBAL
            </h1>
            <p className="text-muted-foreground">
              How would you like to use REBAL?
            </p>
          </div>

          {/* Account Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Realtor/Agent Option */}
            <Card
              className="border-border/50 shadow-lg cursor-pointer hover:border-primary/50 hover:shadow-xl transition-all group"
              onClick={() => setAccountType("realtor")}
            >
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                  <Home className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-lg">Realtor / Agent</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  I want to list and manage properties
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>✓ Create property listings</li>
                  <li>✓ Get a branded website</li>
                  <li>✓ Manage inquiries & leads</li>
                  <li>✓ Share properties with short links</li>
                  <li>✓ Earn referral commissions</li>
                </ul>
                <Button className="w-full mt-4" variant="outline">
                  <Home className="mr-2 h-4 w-4" />
                  I'm a Realtor
                </Button>
              </CardContent>
            </Card>

            {/* Affiliate Option */}
            <Card
              className="border-border/50 shadow-lg cursor-pointer hover:border-primary/50 hover:shadow-xl transition-all group"
              onClick={handleAffiliateSignup}
            >
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-14 h-14 rounded-full bg-accent/50 flex items-center justify-center mb-2 group-hover:bg-accent transition-colors">
                  <Users className="h-7 w-7 text-accent-foreground" />
                </div>
                <CardTitle className="text-lg">Affiliate Marketer</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  I want to earn by referring others
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>✓ Get your unique referral link</li>
                  <li>✓ Earn 10% on each referral</li>
                  <li>✓ Track your earnings</li>
                  <li>✓ Request withdrawals</li>
                  <li className="text-muted-foreground/60">○ No property listings</li>
                </ul>
                <Button className="w-full mt-4" variant="outline" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Users className="mr-2 h-4 w-4" />
                  )}
                  I'm an Affiliate
                </Button>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Affiliates can upgrade to Realtor anytime from Settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Set Up Your Profile
          </h1>
          <p className="text-muted-foreground">
            Create your business profile to start listing properties on REBAL.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAccountType(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Choose different account type
          </Button>
        </div>

        {/* Form */}
        <Card className="border-border/50 shadow-xl">
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>
              Fill in your details. Use your company name or your own name if you're an independent agent.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Required Section */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Business / Display Name <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Premium Properties or John Doe Realty"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        {watchedName && !form.formState.errors.name && (
                          <FormDescription>
                            Your public page: rebal.site/{generateSlug(watchedName)}
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tagline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Tagline <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Your trusted property partner"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>A short catchy phrase for your business</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          About Your Business <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell potential clients about your company, experience, and expertise..."
                            disabled={isLoading}
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Describe your business, services, and what makes you unique</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4 pt-2">
                  <h3 className="text-sm font-medium text-foreground">
                    Contact Information <span className="text-destructive">*</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Phone Number <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="+234 800 000 0000"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Business Email <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="contact@company.com"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Business Address <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 123 Main Street, Victoria Island, Lagos"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="whatsapp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp Number</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="+234 800 000 0000"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Social Links - Collapsible */}
                <Collapsible open={showSocialLinks} onOpenChange={setShowSocialLinks}>
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full justify-between px-0 hover:bg-transparent"
                    >
                      <span className="text-sm font-medium">Social Media Links</span>
                      {showSocialLinks ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="facebook"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Facebook</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://facebook.com/yourpage"
                                disabled={isLoading}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="instagram"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instagram</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://instagram.com/yourprofile"
                                disabled={isLoading}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="twitter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>X (Twitter)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://x.com/yourhandle"
                                disabled={isLoading}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="linkedin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LinkedIn</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://linkedin.com/company/yourcompany"
                                disabled={isLoading}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="telegram"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telegram</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="@yourusername"
                                disabled={isLoading}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Advanced Settings - Collapsible */}
                <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full justify-between px-0 hover:bg-transparent"
                    >
                      <span className="text-sm font-medium">Advanced Settings</span>
                      {showAdvanced ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-2">
                    <FormField
                      control={form.control}
                      name="logo_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logo URL</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://example.com/your-logo.png"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Paste a link to your logo image. You can upload directly from the dashboard later.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CollapsibleContent>
                </Collapsible>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading || !form.formState.isValid}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  Create Company & Continue
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          You can update your logo, branding, and settings anytime from your dashboard.
        </p>
      </div>
    </div>
  );
};
