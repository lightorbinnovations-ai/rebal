import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { useOptimisticMutation } from "@/hooks/useOptimisticMutation";
import {
  ArrowLeft,
  Building2,
  Save,
  Loader2,
  Plus,
  X,
  ImageIcon,
  Lock,
  Crown,
  ExternalLink,
  Image,
} from "lucide-react";
import { CopyShortLinkButton } from "@/components/share/CopyShortLinkButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ImageUpload, MultiImageUpload } from "./ImageUpload";
import { OGPreviewCard } from "./OGPreviewCard";
import type { Company, Property, PropertyStatus } from "@/types/company";

interface PropertyFormProps {
  company: Company;
}

const PROPERTY_TYPES = [
  "Apartment",
  "Bungalow",
  "Duplex",
  "Detached House",
  "Semi-Detached",
  "Terrace",
  "Penthouse",
  "Land",
  "Commercial",
  "Warehouse",
  "Office Space",
];

const PURPOSES = ["For Sale", "For Rent", "For Lease", "Short Let"];

const STATUSES: PropertyStatus[] = ["Available", "Sold", "Reserved", "Under Offer"];

const propertySchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  property_type: z.string().min(1, "Property type is required"),
  purpose: z.string().min(1, "Purpose is required"),
  price: z.coerce.number().positive("Price must be a positive number"),
  description: z.string().optional(),
  location: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(["Available", "Sold", "Reserved", "Under Offer"]),
  is_active: z.boolean(),
  features: z.array(z.string()).optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  video_url: z.string().optional(),
});

type PropertyFormData = z.infer<typeof propertySchema>;

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .substring(0, 50);
};

export const PropertyForm = ({ company }: PropertyFormProps) => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!propertyId;
  const { canAddProperty, maxProperties, currentProperties, planName, isTrialing, isLoading: limitsLoading } = useSubscriptionLimits(company);

  // Block new property creation if limit reached (editing is always allowed)
  const isBlocked = !isEditing && !canAddProperty;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditing);
  const [mainImage, setMainImage] = useState<string>("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [newFeature, setNewFeature] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [propertySlug, setPropertySlug] = useState<string>("");
  const [isGeneratingOG, setIsGeneratingOG] = useState(false);
  const [ogImageUrl, setOgImageUrl] = useState<string | null>(null);


  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: "",
      property_type: "",
      purpose: "",
      price: 0,
      description: "",
      location: "",
      address: "",
      status: "Available",
      is_active: true,
      features: [],
      meta_title: "",
      meta_description: "",
    },
  });

  useEffect(() => {
    if (isEditing && propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  const fetchProperty = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", propertyId)
        .eq("company_id", company.id)
        .single();

      if (error) throw error;

      const property = data as Property;
      form.reset({
        title: property.title,
        property_type: property.property_type,
        purpose: property.purpose,
        price: property.price,
        description: property.description || "",
        location: property.location || "",
        address: property.address || "",
        status: property.status,
        is_active: property.is_active,
        meta_title: property.meta_title || "",
        meta_description: property.meta_description || "",
      });

      setMainImage(property.main_image_url || "");
      setGalleryImages(property.gallery_urls || []);
      setVideoUrl(property.video_url || "");
      setFeatures(property.features || []);
      setPropertySlug(property.slug);
      setOgImageUrl(property.og_image_url || null);
    } catch (error: any) {
      toast({
        title: "Failed to load property",
        description: error.message,
        variant: "destructive",
      });
      navigate("/dashboard/properties");
    } finally {
      setIsFetching(false);
    }
  };

  // Optimistic mutation for form submission
  const { mutate: submitProperty, isPending: isSaving } = useOptimisticMutation({
    onMutate: async (data: PropertyFormData) => {
      const slug = generateSlug(data.title) + "-" + Date.now().toString(36);

      const propertyData = {
        title: data.title,
        property_type: data.property_type,
        purpose: data.purpose,
        price: data.price,
        description: data.description || null,
        location: data.location || null,
        address: data.address || null,
        status: data.status,
        is_active: data.is_active,
        meta_title: data.meta_title || null,
        meta_description: data.meta_description || null,
        company_id: company.id,
        main_image_url: mainImage || null,
        gallery_urls: galleryImages.length > 0 ? galleryImages : null,
        video_url: videoUrl || null,
        features: features.length > 0 ? features : null,
      };

      if (isEditing) {
        const { company_id: __, ...updateData } = propertyData;
        const { error } = await supabase
          .from("properties")
          .update(updateData)
          .eq("id", propertyId)
          .eq("company_id", company.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("properties").insert({
          ...propertyData,
          slug,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Property updated" : "Property created",
        description: isEditing
          ? "Your changes have been saved."
          : "Your new property listing is live.",
      });
      navigate("/dashboard/properties");
    },
    errorMessage: "Failed to save property",
  });

  const onSubmit = async (data: PropertyFormData) => {
    setIsLoading(true);
    try {
      await submitProperty(data);
    } catch {
      // Error handled by useOptimisticMutation
    } finally {
      setIsLoading(false);
    }
  };

  const addFeature = () => {
    if (newFeature.trim() && !features.includes(newFeature.trim())) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature("");
    }
  };

  const removeFeature = (feature: string) => {
    setFeatures(features.filter((f) => f !== feature));
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages(galleryImages.filter((_, i) => i !== index));
  };

  if (isFetching || limitsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Generate OG image for the property
  const generatePropertyOGImage = async () => {
    if (!propertyId) return;

    setIsGeneratingOG(true);
    try {
      const response = await supabase.functions.invoke("generate-property-og", {
        body: { propertyId },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to generate image");
      }

      const newOgImageUrl = response.data?.ogImageUrl;
      if (newOgImageUrl) {
        setOgImageUrl(newOgImageUrl);
      }

      toast({
        title: "Social Preview Generated!",
        description: "Your property preview image has been created for social sharing.",
      });
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message || "Could not generate social preview image",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingOG(false);
    }
  };

  // Block access for new property when limit reached
  if (isBlocked) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/properties")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Property Limit Reached</h1>
            <p className="text-muted-foreground">
              Upgrade your plan to add more properties
            </p>
          </div>
        </div>

        <Card className="border-2 border-primary">
          <CardContent className="py-12 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                You've reached your property limit ({currentProperties}/{maxProperties})
              </h2>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                {isTrialing
                  ? "Your free trial includes 1 property listing. Upgrade to a paid plan to add more properties and unlock additional features."
                  : `Your ${planName} plan allows ${maxProperties} properties. Upgrade to add more listings.`}
              </p>
            </div>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button variant="outline" asChild>
                <Link to="/dashboard/properties">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Properties
                </Link>
              </Button>
              <Button asChild>
                <Link to="/dashboard/settings">
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade Plan
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate("/dashboard/properties")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">
              {isEditing ? "Edit Property" : "Add New Property"}
            </h1>
            <p className="text-sm text-muted-foreground truncate">
              {isEditing ? "Update your property details" : "Create a new property listing"}
            </p>
          </div>
        </div>
        {isEditing && propertyId && propertySlug && (
          <div className="flex gap-2 ml-11 sm:ml-0">
            <CopyShortLinkButton
              companyId={company.id}
              propertyId={propertyId}
              fullPath={`/${company.slug}/property/${propertySlug}`}
              variant="outline"
              showLabel={false}
            />
            <Button variant="outline" size="sm" asChild>
              <a
                href={`/${company.slug}/property/${propertySlug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">View Live</span>
              </a>
            </Button>
          </div>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6 min-w-0">
              {/* Basic Info */}
              <Card className="overflow-hidden">
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="text-lg sm:text-xl">Basic Information</CardTitle>
                  <CardDescription>Property title, type, and pricing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-4 sm:px-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input className="w-full" placeholder="e.g., Luxury 4 Bedroom Duplex" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="property_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PROPERTY_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="purpose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purpose *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select purpose" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PURPOSES.map((purpose) => (
                                <SelectItem key={purpose} value={purpose}>
                                  {purpose}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (NGN) *</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="e.g., 50,000,000"
                            value={field.value ? Number(field.value).toLocaleString() : ""}
                            onChange={(e) => {
                              // customized onChange to handle comma formatting
                              const rawValue = e.target.value.replace(/,/g, '');

                              // Only allow numbers
                              if (rawValue === '' || /^\d+$/.test(rawValue)) {
                                field.onChange(rawValue === '' ? 0 : Number(rawValue));
                              }
                            }}
                          />
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Describe your property..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Location */}
              <Card className="overflow-hidden">
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="text-lg sm:text-xl">Location</CardTitle>
                  <CardDescription>Where is the property located?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-4 sm:px-6">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Area/Neighborhood</FormLabel>
                        <FormControl>
                          <Input className="w-full" placeholder="e.g., Lekki Phase 1, Lagos" {...field} />
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
                        <FormLabel>Full Address</FormLabel>
                        <FormControl>
                          <Input className="w-full" placeholder="e.g., 123 Example Street" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Features */}
              <Card className="overflow-hidden">
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="text-lg sm:text-xl">Features</CardTitle>
                  <CardDescription>List property features and amenities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-4 sm:px-6">
                  <div className="flex gap-2">
                    <Input
                      className="flex-1 min-w-0"
                      placeholder="e.g., Swimming Pool"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addFeature();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={addFeature}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {features.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {features.map((feature) => (
                        <Badge key={feature} variant="secondary" className="gap-1 max-w-full">
                          <span className="truncate">{feature}</span>
                          <button
                            type="button"
                            onClick={() => removeFeature(feature)}
                            className="ml-1 hover:text-destructive shrink-0"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Images & Video */}
              <Card className="overflow-hidden">
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="text-lg sm:text-xl">Media</CardTitle>
                  <CardDescription>Add photos and video of your property</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-4 sm:px-6">
                  <div>
                    <FormLabel className="mb-2 block">Main Image</FormLabel>
                    <ImageUpload
                      value={mainImage}
                      onChange={setMainImage}
                      folder={`properties/${company.id}`}
                    />
                  </div>

                  <div>
                    <FormLabel className="mb-2 block">Gallery Images</FormLabel>
                    <MultiImageUpload
                      value={galleryImages}
                      onChange={setGalleryImages}
                      maxImages={10}
                      folder={`properties/${company.id}`}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Max 10 images.
                    </p>
                  </div>

                  <div>
                    <FormLabel className="mb-2 block">Property Video URL</FormLabel>
                    <Input
                      placeholder="e.g. YouTube, Vimeo, Google Drive, or direct link"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Paste a link to your video (YouTube, Vimeo, Drive, etc.)
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* SEO */}
              <Card className="overflow-hidden">
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="text-lg sm:text-xl">SEO Settings</CardTitle>
                  <CardDescription>Optimize for search engines</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-4 sm:px-6">
                  <FormField
                    control={form.control}
                    name="meta_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Title</FormLabel>
                        <FormControl>
                          <Input className="w-full" placeholder="Leave blank to use property title" {...field} />
                        </FormControl>
                        <FormDescription>Max 60 characters recommended</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="meta_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Description</FormLabel>
                        <FormControl>
                          <Textarea
                            className="w-full"
                            placeholder="Brief description for search results"
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Max 160 characters recommended</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-4 sm:space-y-6 min-w-0">
              <Card className="overflow-hidden">
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="text-lg sm:text-xl">Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-4 sm:px-6">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Listing Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STATUSES.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3 gap-3">
                        <div className="min-w-0">
                          <FormLabel>Published</FormLabel>
                          <FormDescription className="text-xs">
                            Show on your public website
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch className="shrink-0" checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardContent className="pt-6 space-y-3 px-4 sm:px-6">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {isEditing ? "Save Changes" : "Create Property"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/dashboard/properties")}
                  >
                    Cancel
                  </Button>
                </CardContent>
              </Card>

              {/* OG Preview for existing properties */}
              {isEditing && propertySlug && (
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3 px-4 sm:px-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <CardTitle className="text-base sm:text-lg">Social Preview</CardTitle>
                    </div>
                    <CardDescription className="text-xs sm:text-sm">
                      Preview how this property appears when shared
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6">
                    <OGPreviewCard
                      title={`${form.watch("title")} - ₦${form.watch("price")?.toLocaleString() || "0"}`}
                      description={
                        form.watch("meta_description") ||
                        form.watch("description")?.substring(0, 160) ||
                        `${form.watch("property_type")} for ${form.watch("purpose")} in ${form.watch("location") || "Nigeria"}`
                      }
                      imageUrl={ogImageUrl || mainImage || null}
                      pageType="property"
                      pageUrl={`/${company.slug}/property/${propertySlug}`}
                      hasCustomOG={!!ogImageUrl}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};
