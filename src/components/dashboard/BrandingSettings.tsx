import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  Loader2,
  Save,
  Phone,
  Eye,
  Image,
  Share2,
  Palette,
  Sparkles,
  X,
  RotateCcw,
  User,
  Briefcase,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BrandingPreview } from "./BrandingPreview";
import { ImageUpload } from "./ImageUpload";
import { OGPreviewCard } from "./OGPreviewCard";
import { ServiceSelector } from "./ServiceSelector";
import { DEFAULT_HERO_OPTIONS } from "@/lib/defaultHeroImages";
import { extractColorsFromImage } from "@/lib/colorExtractor";
import type { Company } from "@/types/company";

interface BrandingSettingsProps {
  company: Company;
  onUpdate: () => void;
}

// Default branding values
const DEFAULT_BRANDING = {
  primary_color: "#0F172A",
  secondary_color: "#3B82F6",
  font_heading: "Inter",
  font_body: "Open Sans",
  button_style: "rounded" as const,
  footer_bg_color: "#0F172A",
  footer_text_color: "#FFFFFF",
};

// Predefined color palettes
const COLOR_PRESETS = [
  { name: "Navy Blue", primary: "#0F172A", secondary: "#3B82F6" },
  { name: "Emerald", primary: "#064E3B", secondary: "#10B981" },
  { name: "Purple", primary: "#4C1D95", secondary: "#8B5CF6" },
  { name: "Rose", primary: "#881337", secondary: "#F43F5E" },
  { name: "Amber", primary: "#78350F", secondary: "#F59E0B" },
  { name: "Teal", primary: "#134E4A", secondary: "#14B8A6" },
  { name: "Slate", primary: "#1E293B", secondary: "#64748B" },
  { name: "Indigo", primary: "#312E81", secondary: "#6366F1" },
];

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter", category: "Sans-serif" },
  { value: "Open Sans", label: "Open Sans", category: "Sans-serif" },
  { value: "Roboto", label: "Roboto", category: "Sans-serif" },
  { value: "Poppins", label: "Poppins", category: "Sans-serif" },
  { value: "Montserrat", label: "Montserrat", category: "Sans-serif" },
  { value: "Lato", label: "Lato", category: "Sans-serif" },
  { value: "Playfair Display", label: "Playfair Display", category: "Serif" },
  { value: "Merriweather", label: "Merriweather", category: "Serif" },
  { value: "Georgia", label: "Georgia", category: "Serif" },
  { value: "Bebas Neue", label: "Bebas Neue", category: "Display" },
  { value: "Oswald", label: "Oswald", category: "Display" },
];

const BUTTON_STYLES = [
  { value: "rounded", label: "Rounded", description: "Softly rounded corners", radius: "0.5rem" },
  { value: "pill", label: "Pill", description: "Fully rounded ends", radius: "9999px" },
  { value: "square", label: "Square", description: "Sharp corners", radius: "0" },
];

const brandingFormSchema = z.object({
  name: z.string().trim().min(2, "Company name must be at least 2 characters").max(100),
  tagline: z.string().trim().optional(),
  description: z.string().trim().optional(),
  logo_url: z.string().trim().optional(),
  hero_image_url: z.string().trim().optional(),
  profile_picture_url: z.string().trim().optional(),
  personal_bio: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  address: z.string().trim().optional(),
  whatsapp: z.string().trim().optional(),
  telegram: z.string().trim().optional(),
  facebook: z.string().trim().url("Invalid URL").optional().or(z.literal("")),
  instagram: z.string().trim().url("Invalid URL").optional().or(z.literal("")),
  twitter: z.string().trim().url("Invalid URL").optional().or(z.literal("")),
  linkedin: z.string().trim().url("Invalid URL").optional().or(z.literal("")),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color").optional(),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color").optional(),
  font_heading: z.string().optional(),
  font_body: z.string().optional(),
  button_style: z.enum(["rounded", "pill", "square"]).optional(),
  footer_bg_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color").optional(),
  footer_text_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color").optional(),
  og_image_url: z.string().trim().optional(),

  // New Fields
  services: z.array(z.string()).default([]),
  years_experience: z.coerce.number().min(0).max(100).default(0),
  satisfaction_rate: z.coerce.number().min(0).max(100).default(100),
  total_applicants: z.coerce.number().min(0).default(0), // Using this for Total Clients/Applicants
});

type BrandingFormValues = z.infer<typeof brandingFormSchema>;

export const BrandingSettings = ({
  company,
  onUpdate,
}: BrandingSettingsProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [extractedColors, setExtractedColors] = useState<{ primary: string; secondary: string } | null>(null);
  const [isExtractingColors, setIsExtractingColors] = useState(false);
  const [statsId, setStatsId] = useState<string | null>(null);

  const form = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingFormSchema),
    defaultValues: {
      name: company.name || "",
      tagline: company.tagline || "",
      description: company.description || "",
      logo_url: company.logo_url || "",
      hero_image_url: company.hero_image_url || "",
      profile_picture_url: company.profile_picture_url || "",
      personal_bio: company.personal_bio || "",
      phone: company.phone || "",
      email: company.email || "",
      address: company.address || "",
      whatsapp: company.whatsapp || "",
      telegram: company.telegram || "",
      facebook: company.facebook || "",
      instagram: company.instagram || "",
      twitter: company.twitter || "",
      linkedin: company.linkedin || "",
      primary_color: company.primary_color || DEFAULT_BRANDING.primary_color,
      secondary_color: company.secondary_color || DEFAULT_BRANDING.secondary_color,
      font_heading: company.font_heading || DEFAULT_BRANDING.font_heading,
      font_body: company.font_body || DEFAULT_BRANDING.font_body,
      button_style: (company.button_style as "rounded" | "pill" | "square") || DEFAULT_BRANDING.button_style,
      footer_bg_color: company.footer_bg_color || DEFAULT_BRANDING.footer_bg_color,
      footer_text_color: company.footer_text_color || DEFAULT_BRANDING.footer_text_color,
      og_image_url: company.og_image_url || "",
      services: company.services || [],
      years_experience: 0,
      satisfaction_rate: 100,
      total_applicants: 0,
    },
    mode: "onChange",
  });

  const watchedValues = form.watch();

  // Load Realtor Stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .from("realtor_stats")
          .select("*")
          .eq("company_id", company.id)
          .single();

        if (error && error.code !== "PGRST116") throw error;

        if (data) {
          setStatsId(data.id);
          form.setValue("years_experience", data.years_experience);
          form.setValue("satisfaction_rate", data.satisfaction_rate);
          form.setValue("total_applicants", data.total_applicants);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };

    fetchStats();
  }, [company.id, form]);

  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      setHasChanges(form.formState.isDirty);
    });
    return () => subscription.unsubscribe();
  }, [form.watch, form.formState.isDirty]);

  const handleLogoChange = useCallback(async (logoUrl: string) => {
    form.setValue("logo_url", logoUrl, { shouldDirty: true });
    if (logoUrl && logoUrl.startsWith("http")) {
      setIsExtractingColors(true);
      try {
        const colors = await extractColorsFromImage(logoUrl);
        if (colors) setExtractedColors(colors);
      } catch (error) {
        console.error("Failed to extract colors:", error);
      } finally {
        setIsExtractingColors(false);
      }
    } else {
      setExtractedColors(null);
    }
  }, [form]);

  const applyExtractedColors = () => {
    if (extractedColors) {
      form.setValue("primary_color", extractedColors.primary, { shouldDirty: true });
      form.setValue("secondary_color", extractedColors.secondary, { shouldDirty: true });
      toast({ title: "Colors applied", description: "Brand colors extracted from your logo have been applied." });
      setExtractedColors(null);
    }
  };

  const resetToDefaults = () => {
    form.setValue("primary_color", DEFAULT_BRANDING.primary_color, { shouldDirty: true });
    form.setValue("secondary_color", DEFAULT_BRANDING.secondary_color, { shouldDirty: true });
    form.setValue("font_heading", DEFAULT_BRANDING.font_heading, { shouldDirty: true });
    form.setValue("font_body", DEFAULT_BRANDING.font_body, { shouldDirty: true });
    form.setValue("button_style", DEFAULT_BRANDING.button_style, { shouldDirty: true });
    form.setValue("footer_bg_color", DEFAULT_BRANDING.footer_bg_color, { shouldDirty: true });
    form.setValue("footer_text_color", DEFAULT_BRANDING.footer_text_color, { shouldDirty: true });
    setExtractedColors(null);
    toast({ title: "Defaults restored", description: "Styling options reset to default." });
  };

  const onSubmit = async (data: BrandingFormValues) => {
    setIsLoading(true);
    try {
      // 1. Update Company Profile
      const { error: companyError } = await supabase
        .from("companies")
        .update({
          name: data.name.trim(),
          tagline: data.tagline?.trim() || null,
          description: data.description?.trim() || null,
          logo_url: data.logo_url?.trim() || null,
          hero_image_url: data.hero_image_url?.trim() || null,
          profile_picture_url: data.profile_picture_url?.trim() || null,
          personal_bio: data.personal_bio?.trim() || null,
          phone: data.phone?.trim() || null,
          email: data.email?.trim() || null,
          address: data.address?.trim() || null,
          whatsapp: data.whatsapp?.trim() || null,
          telegram: data.telegram?.trim() || null,
          facebook: data.facebook?.trim() || null,
          instagram: data.instagram?.trim() || null,
          twitter: data.twitter?.trim() || null,
          linkedin: data.linkedin?.trim() || null,
          primary_color: data.primary_color,
          secondary_color: data.secondary_color,
          font_heading: data.font_heading,
          font_body: data.font_body,
          button_style: data.button_style,
          footer_bg_color: data.footer_bg_color,
          footer_text_color: data.footer_text_color,
          og_image_url: data.og_image_url?.trim() || null,
          services: data.services, // Save Services
        })
        .eq("id", company.id);

      if (companyError) throw companyError;

      // 2. Upsert Realtor Stats
      // Check if user is owner of company
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const statsPayload = {
          company_id: company.id,
          user_id: user.id, // Only works if current user is owner. Assuming RLS allows insert/update for company owner.
          years_experience: data.years_experience,
          satisfaction_rate: data.satisfaction_rate,
          total_applicants: data.total_applicants,
          updated_at: new Date().toISOString(),
        };

        if (statsId) {
          // Update existing
          const { error: statsError } = await supabase
            .from("realtor_stats")
            .update(statsPayload)
            .eq("id", statsId);
          if (statsError) console.error("Stats update failed", statsError);
        } else {
          // Insert new
          const { error: statsError } = await supabase
            .from("realtor_stats")
            .insert(statsPayload);
          if (statsError) console.error("Stats insert failed", statsError);
        }
      }

      toast({ title: "Settings saved", description: "Your profile has been updated." });
      setHasChanges(false);
      onUpdate();
    } catch (error: any) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const publicUrl = `${window.location.origin}/${company.slug}`;

  return (
    <div className="space-y-6 overflow-hidden max-w-full">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Business Profile & Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your company information, branding, and services
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild className="flex-1 sm:flex-none min-w-0">
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <Eye className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="truncate">View Public Page</span>
            </a>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={isLoading} className="flex-shrink-0">
                <RotateCcw className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Reset Styling</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset to default styling?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will restore all colors, fonts, and button styles to their default values.
                  Your company information and logo will not be affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={resetToDefaults}>
                  Reset Styling
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isLoading}
            className="flex-1 sm:flex-none"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-lg">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          You have unsaved changes
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Form Section */}
        <div className="xl:col-span-2">
          <Form {...form}>
            <form className="space-y-6">
              <Tabs defaultValue="services" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 h-auto p-1">
                  <TabsTrigger value="services" className="text-xs sm:text-sm py-2">
                    <Briefcase className="mr-1 sm:mr-2 h-4 w-4" />
                    <span className="hidden xs:inline">Services</span>
                    <span className="xs:hidden">Svcs</span>
                  </TabsTrigger>
                  <TabsTrigger value="company" className="text-xs sm:text-sm py-2">
                    <Building2 className="mr-1 sm:mr-2 h-4 w-4" />
                    <span className="hidden xs:inline">Company</span>
                    <span className="xs:hidden">Info</span>
                  </TabsTrigger>
                  <TabsTrigger value="contact" className="text-xs sm:text-sm py-2">
                    <Phone className="mr-1 sm:mr-2 h-4 w-4" />
                    Contact
                  </TabsTrigger>
                  <TabsTrigger value="social" className="text-xs sm:text-sm py-2">
                    <Share2 className="mr-1 sm:mr-2 h-4 w-4" />
                    Social
                  </TabsTrigger>
                </TabsList>

                {/* Services & Experience Tab */}
                <TabsContent value="services" className="space-y-6">
                  <div className="p-4 bg-muted/30 rounded-lg border flex gap-3 items-start">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-1">Boost Your Visibility</h3>
                      <p className="text-sm text-muted-foreground">Select the services you offer and update your track record. These appear on your homepage and help clients trust your expertise.</p>
                    </div>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Professional Services</CardTitle>
                      <CardDescription>Select all the services you provide to clients</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="services"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <ServiceSelector
                                selectedServices={field.value}
                                onChange={field.onChange}
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Track Record Stats</CardTitle>
                      <CardDescription>Key metrics displayed on your homepage</CardDescription>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="years_experience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Years Experience</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormDescription>How long needed?</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="satisfaction_rate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Satisfaction (%)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" max="100" {...field} />
                            </FormControl>
                            <FormDescription>Client satisfaction rate</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="total_applicants"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Clients</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormDescription>Happy clients served</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Company Info Tab */}
                <TabsContent value="company" className="space-y-6">
                  {/* ... (Existing Company Fields) */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Business Information</CardTitle>
                      <CardDescription>Basic details about you or your business</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business / Display Name <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Your company name" disabled={isLoading} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="tagline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tagline</FormLabel>
                            <FormControl>
                              <Input placeholder="Your trusted property partner" disabled={isLoading} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>About</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Tell clients about your company..." disabled={isLoading} rows={5} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Branding Assets</CardTitle>
                      <CardDescription>Logo, Colors, and Typography</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="logo_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Logo</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                <ImageUpload
                                  value={field.value}
                                  onChange={handleLogoChange}
                                  onRemove={() => { field.onChange(""); setExtractedColors(null); }}
                                  aspectRatio="square"
                                  folder="logos"
                                  thumbnail
                                />
                                {/* Extracted colors suggestion */}
                                {extractedColors && !isExtractingColors && (
                                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs">Detected Colors</span>
                                      <Button type="button" variant="ghost" size="sm" onClick={applyExtractedColors} className="h-6 text-xs">Apply</Button>
                                    </div>
                                    <div className="flex gap-1 h-6">
                                      <div className="flex-1 rounded-l" style={{ backgroundColor: extractedColors.primary }} />
                                      <div className="flex-1 rounded-r" style={{ backgroundColor: extractedColors.secondary }} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="hero_image_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cover Image</FormLabel>
                            <FormControl>
                              <ImageUpload
                                value={field.value}
                                onChange={field.onChange}
                                onRemove={() => field.onChange("")}
                                aspectRatio="video"
                                folder="hero"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="primary_color"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Primary Color</FormLabel>
                              <FormControl>
                                <div className="flex gap-2">
                                  <input type="color" className="h-10 w-10 cursor-pointer rounded border" {...field} />
                                  <Input {...field} placeholder="#000000" />
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="secondary_color"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Secondary Color</FormLabel>
                              <FormControl>
                                <div className="flex gap-2">
                                  <input type="color" className="h-10 w-10 cursor-pointer rounded border" {...field} />
                                  <Input {...field} placeholder="#000000" />
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Contact Tab */}
                <TabsContent value="contact" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Contact Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
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
                            <FormLabel>Address</FormLabel>
                            <FormControl><Textarea {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Social Tab */}
                <TabsContent value="social" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Social Media</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="whatsapp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>WhatsApp Number</FormLabel>
                            <FormControl><Input {...field} placeholder="+234..." /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="facebook"
                          render={({ field }) => (
                            <FormItem><FormLabel>Facebook</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="instagram"
                          render={({ field }) => (
                            <FormItem><FormLabel>Instagram</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="twitter"
                          render={({ field }) => (
                            <FormItem><FormLabel>Twitter / X</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="linkedin"
                          render={({ field }) => (
                            <FormItem><FormLabel>LinkedIn</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </div>

        {/* Live Preview Panel */}
        <div className="xl:col-span-1 space-y-6">
          <BrandingPreview
            company={company}
            watchedValues={watchedValues}
            publicUrl={publicUrl}
          />
          <OGPreviewCard
            title={watchedValues.tagline ? `${watchedValues.name} - ${watchedValues.tagline}` : watchedValues.name || company.name}
            description={watchedValues.description?.substring(0, 160) || "Your trusted real estate partner"}
            imageUrl={watchedValues.og_image_url || company.og_image_url || watchedValues.hero_image_url || watchedValues.logo_url}
            pageType="company"
            pageUrl={`/${company.slug}`}
            hasCustomOG={!!(company.og_title || company.og_image_url)}
          />
        </div>
      </div>
    </div>
  );
};
