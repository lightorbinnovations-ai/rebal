import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { useOptimisticList } from "@/hooks/useOptimisticMutation";
import { useBoostPayment } from "@/hooks/useBoostPayment";
import { useShortLinks } from "@/hooks/useShortLinks";
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  MapPin,
  Tag,
  Lock,
  Crown,
  Link2,
  MousePointerClick,
  Loader2,
  Rocket,
} from "lucide-react";
import { CopyShortLinkButton } from "@/components/share/CopyShortLinkButton";
import { PropertyBoostRequest } from "./PropertyBoostRequest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Company, Property, PropertyStatus } from "@/types/company";

interface PropertiesListProps {
  company: Company;
}

const STATUS_CONFIG: Record<PropertyStatus, { label: string; color: string }> = {
  Available: { label: "Available", color: "bg-green-500/10 text-green-600 border-green-500/20" },
  Sold: { label: "Sold", color: "bg-red-500/10 text-red-600 border-red-500/20" },
  Reserved: { label: "Reserved", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  "Under Offer": { label: "Under Offer", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
};

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

export const PropertiesList = ({ company }: PropertiesListProps) => {
  const { toast: toastHook } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canAddProperty, maxProperties, currentProperties, planName, isTrialing } = useSubscriptionLimits(company);
  const { shortLinks, getOrCreatePropertyLink, isCreating } = useShortLinks(company.id);
  const { verifyBoostPayment } = useBoostPayment();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [purposeFilter, setPurposeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteProperty, setDeleteProperty] = useState<Property | null>(null);

  // Verify boost payment on return from Paystack
  useEffect(() => {
    const boostVerify = searchParams.get("boost_verify");
    const reference = searchParams.get("reference");

    if (boostVerify === "1" && reference) {
      verifyBoostPayment(reference).then(() => {
        // Clear the URL params
        searchParams.delete("boost_verify");
        searchParams.delete("reference");
        searchParams.delete("trxref");
        setSearchParams(searchParams);
      });
    }
  }, [searchParams, setSearchParams, verifyBoostPayment]);

  // Get click count for a property from short links
  const getPropertyClickCount = (propertyId: string): number => {
    const link = shortLinks.find((l) => l.property_id === propertyId);
    return link?.click_count || 0;
  };

  // Check if property has a short link
  const hasShortLink = (propertyId: string): boolean => {
    return shortLinks.some((l) => l.property_id === propertyId);
  };

  // Bulk generate short links for all properties without one
  const handleBulkGenerateLinks = async () => {
    const propertiesWithoutLinks = properties.filter(
      (p) => !shortLinks.some((l) => l.property_id === p.id)
    );

    if (propertiesWithoutLinks.length === 0) {
      toast.info("All properties already have short links!");
      return;
    }

    setIsBulkGenerating(true);
    let successCount = 0;
    let errorCount = 0;

    for (const property of propertiesWithoutLinks) {
      try {
        await getOrCreatePropertyLink(
          property.id,
          `/${company.slug}/property/${property.slug}`
        );
        successCount++;
      } catch {
        errorCount++;
      }
    }

    setIsBulkGenerating(false);

    if (errorCount === 0) {
      toast.success(`Generated ${successCount} short links!`);
    } else {
      toast.warning(`Generated ${successCount} links, ${errorCount} failed`);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProperties((data as Property[]) || []);
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    } finally {
      setIsLoading(false);
    }
  }, [company.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useRealtimeSubscription({
    table: "properties",
    onChange: fetchData,
  });

  // Optimistic list operations
  const { optimisticDelete } = useOptimisticList(properties, setProperties);

  const handleDelete = async () => {
    if (!deleteProperty) return;

    const propertyToDelete = deleteProperty;
    setDeleteProperty(null); // Close dialog immediately for better UX

    try {
      await optimisticDelete(
        propertyToDelete.id,
        async () => {
          const { error } = await supabase
            .from("properties")
            .delete()
            .eq("id", propertyToDelete.id);
          if (error) throw error;
        },
        {
          successMessage: "Property deleted",
          errorMessage: "Failed to delete property",
        }
      );
    } catch {
      // Error already handled by optimisticDelete
    }
  };

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.address?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === "all" || property.property_type === typeFilter;
    const matchesPurpose = purposeFilter === "all" || property.purpose === purposeFilter;
    const matchesStatus = statusFilter === "all" || property.status === statusFilter;

    return matchesSearch && matchesType && matchesPurpose && matchesStatus;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Property Limit Banner */}
      {!canAddProperty && (
        <Card className="border-2 border-primary bg-primary/5">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Crown className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base">
                  Property limit reached ({currentProperties}/{maxProperties})
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {isTrialing
                    ? "Free trial includes 1 property listing. Upgrade to add more properties."
                    : `Your ${planName} plan allows ${maxProperties} properties. Upgrade to add more.`}
                </p>
              </div>
              <Button size="sm" asChild className="w-full sm:w-auto flex-shrink-0">
                <Link to="/dashboard/settings">
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade Plan
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Properties</h1>
          <p className="text-sm text-muted-foreground">
            Manage your property listings ({properties.length}/{maxProperties === 999 ? "∞" : maxProperties})
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {properties.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={handleBulkGenerateLinks}
                    disabled={isBulkGenerating}
                    className="w-full sm:w-auto"
                  >
                    {isBulkGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Link2 className="mr-2 h-4 w-4" />
                    )}
                    <span className="truncate">{isBulkGenerating ? "Generating..." : "Generate All Links"}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Generate short links for all properties at once</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {canAddProperty ? (
            <Button asChild className="w-full sm:w-auto">
              <Link to="/dashboard/properties/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Property
              </Link>
            </Button>
          ) : (
            <Button disabled className="cursor-not-allowed w-full sm:w-auto">
              <Lock className="mr-2 h-4 w-4" />
              Limit Reached
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {PROPERTY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={purposeFilter} onValueChange={setPurposeFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Purposes</SelectItem>
                  {PURPOSES.map((purpose) => (
                    <SelectItem key={purpose} value={purpose}>
                      {purpose}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full col-span-2 sm:col-span-1">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.keys(STATUS_CONFIG).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-video bg-muted" />
              <CardContent className="pt-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProperties.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No properties found</h3>
            <p className="text-muted-foreground mb-4">
              {properties.length === 0
                ? "You haven't added any properties yet."
                : "No properties match your filter criteria."}
            </p>
            {properties.length === 0 && (
              <Button asChild>
                <Link to="/dashboard/properties/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Property
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((property) => {
            const statusConfig = STATUS_CONFIG[property.status];

            return (
              <Card key={property.id} className="overflow-hidden group">
                <div className="relative aspect-video bg-muted">
                  {property.main_image_url ? (
                    <img
                      src={property.main_image_url}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-2">
                    <Badge className={cn("text-xs", statusConfig.color)}>
                      {statusConfig.label}
                    </Badge>
                    {!property.is_active && (
                      <Badge variant="secondary" className="text-xs">
                        Hidden
                      </Badge>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <a
                          href={`/${company.slug}/property/${property.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Live
                        </a>
                      </DropdownMenuItem>
                      <CopyShortLinkButton
                        companyId={company.id}
                        propertyId={property.id}
                        fullPath={`/${company.slug}/property/${property.slug}`}
                        variant="dropdown"
                      />
                      <DropdownMenuItem asChild>
                        <Link to={`/dashboard/properties/${property.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteProperty(property)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardContent className="pt-4">
                  <h3 className="font-semibold line-clamp-1 mb-1">{property.title}</h3>
                  <p className="text-lg font-bold text-primary mb-2">
                    {formatPrice(property.price)}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {property.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {property.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {property.property_type} • {property.purpose}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">
                      Added {format(new Date(property.created_at), "MMM d, yyyy")}
                    </p>
                    <div className="flex items-center gap-2">
                      {hasShortLink(property.id) && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1 text-xs text-primary font-medium">
                                <MousePointerClick className="h-3 w-3" />
                                {getPropertyClickCount(property.id)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Short link clicks</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                  {/* Boost Button */}
                  <div className="mt-3 pt-3 border-t">
                    <PropertyBoostRequest
                      propertyId={property.id}
                      propertyTitle={property.title}
                      companyId={company.id}
                      currentPriorityScore={property.priority_score || 1}
                      subscriptionTier={planName || "trialing"}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProperty} onOpenChange={() => setDeleteProperty(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteProperty?.title}"? This action cannot be
              undone and will also remove all associated inquiries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
