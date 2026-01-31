import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Building2,
    Phone,
    Mail,
    MapPin,
    MessageCircle,
    CreditCard,
    Loader2,
    Save,
    CheckCircle,
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
    CardFooter,
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
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useProfileCompletion, getProfileCompletionMessage } from "@/hooks/useProfileCompletion";
import type { Company } from "@/types/company";
import { ServiceSelector } from "../ServiceSelector";

interface BusinessProfileSectionProps {
    company: Company;
    onUpdate: () => void;
}

const businessProfileSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Business name must be at least 2 characters")
        .max(100, "Business name must be less than 100 characters"),
    tagline: z
        .string()
        .trim()
        .min(5, "Tagline must be at least 5 characters")
        .max(150, "Tagline must be less than 150 characters")
        .optional()
        .or(z.literal("")),
    description: z
        .string()
        .trim()
        .min(20, "Description must be at least 20 characters")
        .max(2000, "Description must be less than 2000 characters")
        .optional()
        .or(z.literal("")),
    phone: z
        .string()
        .trim()
        .regex(/^[+]?[\d\s\-()]{7,20}$/, "Please enter a valid phone number"),
    email: z
        .string()
        .trim()
        .email("Please enter a valid email address"),
    address: z
        .string()
        .trim()
        .min(5, "Address must be at least 5 characters")
        .max(500, "Address must be less than 500 characters"),
    whatsapp: z
        .string()
        .trim()
        .regex(/^[+]?[\d\s\-()]{7,20}$/, "Please enter a valid WhatsApp number")
        .optional()
        .or(z.literal("")),
    // Bank details for withdrawals
    bank_name: z
        .string()
        .trim()
        .max(100, "Bank name must be less than 100 characters")
        .optional()
        .or(z.literal("")),
    bank_account_number: z
        .string()
        .trim()
        .regex(/^\d{10}$/, "Please enter a valid 10-digit account number")
        .optional()
        .or(z.literal("")),
    bank_account_name: z
        .string()
        .trim()
        .max(100, "Account name must be less than 100 characters")
        .optional()
        .or(z.literal("")),
    // Social Media Links
    facebook: z
        .string()
        .trim()
        .url("Please enter a valid URL")
        .optional()
        .or(z.literal("")),
    instagram: z
        .string()
        .trim()
        .url("Please enter a valid URL")
        .optional()
        .or(z.literal("")),
    twitter: z
        .string()
        .trim()
        .url("Please enter a valid URL")
        .optional()
        .or(z.literal("")),
    linkedin: z
        .string()
        .trim()
        .url("Please enter a valid URL")
        .optional()
        .or(z.literal("")),
    telegram: z
        .string()
        .trim()
        .url("Please enter a valid URL")
        .optional()
        .or(z.literal("")),
    // Services & Stats
    services: z.array(z.string()).default([]),
    years_experience: z.coerce.number().min(0).max(100).default(0),
    satisfaction_rate: z.coerce.number().min(0).max(100).default(100),
    total_applicants: z.coerce.number().min(0).default(0),
});

type BusinessProfileFormValues = z.infer<typeof businessProfileSchema>;

export const BusinessProfileForm = ({ company, onUpdate }: BusinessProfileSectionProps) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const profileStatus = useProfileCompletion(company);
    const [statsId, setStatsId] = useState<string | null>(null);

    const form = useForm<BusinessProfileFormValues>({
        resolver: zodResolver(businessProfileSchema),
        defaultValues: {
            name: company.name || "",
            tagline: company.tagline || "",
            description: company.description || "",
            phone: company.phone || "",
            email: company.email || "",
            address: company.address || "",
            whatsapp: company.whatsapp || "",
            bank_name: company.bank_name || "",
            bank_account_number: company.bank_account_number || "",
            bank_account_name: company.bank_account_name || "",
            facebook: company.facebook || "",
            instagram: company.instagram || "",
            twitter: company.twitter || "",
            linkedin: company.linkedin || "",
            telegram: company.telegram || "",
            services: company.services || [],
            years_experience: 0,
            satisfaction_rate: 100,
            total_applicants: 0,
        },
    });

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

    const onSubmit = async (data: BusinessProfileFormValues) => {
        setIsLoading(true);
        try {
            // 1. Update Company
            const { error } = await supabase
                .from("companies")
                .update({
                    name: data.name,
                    tagline: data.tagline || null,
                    description: data.description || null,
                    phone: data.phone,
                    email: data.email,
                    address: data.address,
                    whatsapp: data.whatsapp || null,
                    bank_name: data.bank_name || null,
                    bank_account_number: data.bank_account_number || null,
                    bank_account_name: data.bank_account_name || null,
                    facebook: data.facebook || null,
                    instagram: data.instagram || null,
                    twitter: data.twitter || null,
                    linkedin: data.linkedin || null,
                    telegram: data.telegram || null,
                    updated_at: new Date().toISOString(),
                    services: data.services,
                })
                .eq("id", company.id);

            if (error) throw error;

            // 2. Upsert Realtor Stats
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const statsPayload = {
                    company_id: company.id,
                    user_id: user.id,
                    years_experience: data.years_experience,
                    satisfaction_rate: data.satisfaction_rate,
                    total_applicants: data.total_applicants,
                    updated_at: new Date().toISOString(),
                };

                if (statsId) {
                    const { error: statsError } = await supabase
                        .from("realtor_stats")
                        .update(statsPayload)
                        .eq("id", statsId);
                    if (statsError) console.error("Stats update failed", statsError);
                } else {
                    const { error: statsError } = await supabase
                        .from("realtor_stats")
                        .insert(statsPayload);
                    if (statsError) console.error("Stats insert failed", statsError);
                }
            }

            toast({
                title: "Profile updated",
                description: "Your business profile has been saved successfully.",
            });
            onUpdate();
        } catch (error: any) {
            toast({
                title: "Failed to update profile",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const allMissingFields = [...profileStatus.missingBasicFields, ...profileStatus.missingSiteFields];

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Business Profile
                        </CardTitle>
                        <CardDescription>
                            Complete your profile to add properties and share your site
                        </CardDescription>
                    </div>
                    {profileStatus.canAddProperties ? (
                        <Badge variant="outline" className="border-green-500/20 bg-green-500/10 text-green-600">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Complete
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-600">
                            {profileStatus.completionPercentage}%
                        </Badge>
                    )}
                </div>
                {!profileStatus.canAddProperties && (
                    <div className="mt-3 space-y-2">
                        <Progress value={profileStatus.completionPercentage} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                            {getProfileCompletionMessage(profileStatus)}
                        </p>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <Accordion type="multiple" defaultValue={["basic", "services", "contact", "bank", "social"]} className="w-full">
                            {/* Basic Business Info */}
                            <AccordionItem value="basic">
                                <AccordionTrigger className="text-sm font-medium">
                                    <span className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4" />
                                        Business Information
                                        {(!profileStatus.hasBusinessName || !profileStatus.hasTagline || !profileStatus.hasDescription) && (
                                            <Badge variant="outline" className="ml-2 border-amber-500/20 bg-amber-500/5 text-amber-600 text-xs">Required</Badge>
                                        )}
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Business Name <span className="text-destructive">*</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Your Company or Personal Name"
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
                                        name="tagline"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Tagline <span className="text-destructive">*</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Your trusted real estate partner"
                                                        disabled={isLoading}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    A short phrase describing your business (min 5 characters)
                                                </FormDescription>
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
                                                        placeholder="Tell clients about your company, experience, and what makes you different..."
                                                        disabled={isLoading}
                                                        rows={4}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    A brief description of your business (min 20 characters)
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </AccordionContent>
                            </AccordionItem>

                            {/* Services & Experience */}
                            <AccordionItem value="services">
                                <AccordionTrigger className="text-sm font-medium">
                                    <span className="flex items-center gap-2">
                                        <Briefcase className="h-4 w-4" />
                                        Services & Experience
                                        {/* You can add required badge here if services check is needed */}
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-6 pt-4">
                                    <div className="p-4 bg-muted/30 rounded-lg border flex gap-3 items-start">
                                        <div className="bg-primary/10 p-2 rounded-full">
                                            <TrendingUp className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-sm mb-1">Boost Your Visibility</h3>
                                            <p className="text-sm text-muted-foreground">Select the services you offer and update your track record. These appear on your homepage and help clients trust your expertise.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-sm font-semibold">Professional Services</h4>
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
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-sm font-semibold">Track Record Stats</h4>
                                        <div className="grid sm:grid-cols-3 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="years_experience"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Years Experience</FormLabel>
                                                        <FormControl>
                                                            <Input type="number" min="0" {...field} />
                                                        </FormControl>
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
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Contact Information */}
                            <AccordionItem value="contact">
                                <AccordionTrigger className="text-sm font-medium">
                                    <span className="flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        Contact Information
                                        {(!profileStatus.hasPhone || !profileStatus.hasEmail || !profileStatus.hasAddress) && (
                                            <Badge variant="outline" className="ml-2 border-amber-500/20 bg-amber-500/5 text-amber-600 text-xs">Required</Badge>
                                        )}
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-4">
                                    <div className="grid gap-4 md:grid-cols-2">
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
                                                        placeholder="contact@yourbusiness.com"
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
                                        name="address"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Business Address <span className="text-destructive">*</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="123 Main Street, Victoria Island, Lagos"
                                                        disabled={isLoading}
                                                        rows={2}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </AccordionContent>
                            </AccordionItem>

                            {/* Bank Details */}
                            <AccordionItem value="bank">
                                <AccordionTrigger className="text-sm font-medium">
                                    <span className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4" />
                                        Bank Details (For Withdrawals)
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-4">
                                    <p className="text-sm text-muted-foreground">
                                        These details are used for referral commission payouts
                                    </p>

                                    <FormField
                                        control={form.control}
                                        name="bank_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Bank Name</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="First Bank, GTBank, Access Bank, etc."
                                                        disabled={isLoading}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="bank_account_number"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Account Number</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="text"
                                                            placeholder="0123456789"
                                                            maxLength={10}
                                                            disabled={isLoading}
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>10-digit account number</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="bank_account_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Account Holder Name</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="John Doe"
                                                            disabled={isLoading}
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            {/* Social Media Links */}
                            <AccordionItem value="social">
                                <AccordionTrigger className="text-sm font-medium">
                                    <span className="flex items-center gap-2">
                                        <MessageCircle className="h-4 w-4" />
                                        Social Media Links
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Add links to your social media profiles to help clients connect with you
                                    </p>

                                    <div className="grid gap-4 md:grid-cols-2">
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
                                                            placeholder="https://instagram.com/yourhandle"
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
                                                    <FormLabel>Twitter (X)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="https://twitter.com/yourhandle"
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
                                                            placeholder="https://linkedin.com/in/yourprofile"
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
                                                            placeholder="https://t.me/yourusername"
                                                            disabled={isLoading}
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            Save Profile
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};
