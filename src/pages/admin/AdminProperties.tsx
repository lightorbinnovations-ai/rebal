import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TablePagination } from "@/components/admin/TablePagination";
import { useServerPagination } from "@/hooks/useServerPagination";
import { Search, MoreHorizontal, ExternalLink, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";

interface PropertyWithCompany {
  id: string;
  title: string;
  slug: string;
  property_type: string;
  purpose: string;
  price: number;
  location: string | null;
  status: string;
  is_active: boolean;
  created_at: string;
  company: {
    id: string;
    name: string;
    slug: string;
  };
}

const PROPERTY_TYPES = ["Land", "House", "Apartment", "Commercial", "Warehouse"];
const PURPOSES = ["Sale", "Rent", "Lease", "Shortlet"];

export default function AdminProperties() {
  const { signOut, isLoading: authLoading } = useAdminAuth();
  const [properties, setProperties] = useState<PropertyWithCompany[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPurpose, setFilterPurpose] = useState<string>("all");
  const [totalCount, setTotalCount] = useState(0);
  
  const pagination = useServerPagination({ initialPageSize: 10 });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      pagination.resetToFirstPage();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    pagination.resetToFirstPage();
  }, [filterType, filterPurpose]);

  const fetchProperties = useCallback(async () => {
    if (authLoading) return;
    
    pagination.setLoading(true);
    try {
      const { from, to } = pagination.getRange();
      
      // Build base query for count
      let countQuery = supabase
        .from("properties")
        .select("*", { count: "exact", head: true });

      if (debouncedSearch) {
        countQuery = countQuery.or(
          `title.ilike.%${debouncedSearch}%,location.ilike.%${debouncedSearch}%`
        );
      }
      if (filterType !== "all") {
        countQuery = countQuery.eq("property_type", filterType);
      }
      if (filterPurpose !== "all") {
        countQuery = countQuery.eq("purpose", filterPurpose);
      }

      const { count } = await countQuery;
      setTotalCount(count || 0);
      pagination.setTotalItems(count || 0);

      // Build data query
      let dataQuery = supabase
        .from("properties")
        .select(`
          *,
          company:companies(id, name, slug)
        `)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (debouncedSearch) {
        dataQuery = dataQuery.or(
          `title.ilike.%${debouncedSearch}%,location.ilike.%${debouncedSearch}%`
        );
      }
      if (filterType !== "all") {
        dataQuery = dataQuery.eq("property_type", filterType);
      }
      if (filterPurpose !== "all") {
        dataQuery = dataQuery.eq("purpose", filterPurpose);
      }

      const { data, error } = await dataQuery;
      if (error) throw error;

      setProperties(
        (data || []).map((p) => ({
          ...p,
          company: p.company as { id: string; name: string; slug: string },
        }))
      );
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      pagination.setLoading(false);
    }
  }, [authLoading, debouncedSearch, filterType, filterPurpose, pagination.currentPage, pagination.pageSize]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Real-time subscription for properties table
  useRealtimeSubscription({
    table: "properties",
    onChange: fetchProperties,
  });

  const handleToggleActive = async (propertyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("properties")
        .update({ is_active: !currentStatus })
        .eq("id", propertyId);

      if (error) throw error;

      setProperties((prev) =>
        prev.map((p) =>
          p.id === propertyId ? { ...p, is_active: !currentStatus } : p
        )
      );
    } catch (error) {
      console.error("Error updating property:", error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <AdminLayout
      title="Properties Management"
      description="View and moderate all properties across the platform"
      isLoading={pagination.isLoading || authLoading}
      onSignOut={signOut}
    >
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>All Properties ({totalCount})</CardTitle>
          <div className="flex flex-wrap gap-2">
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-36">
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
            <Select value={filterPurpose} onValueChange={setFilterPurpose}>
              <SelectTrigger className="w-full sm:w-36">
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6">
            <div className="min-w-[900px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Type / Purpose</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No properties found
                      </TableCell>
                    </TableRow>
                  ) : (
                    properties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium line-clamp-1">{property.title}</span>
                            <span className="text-sm text-muted-foreground line-clamp-1">
                              {property.location || "No location"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{property.company?.name}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline" className="w-fit">
                              {property.property_type}
                            </Badge>
                            <Badge variant="secondary" className="w-fit">
                              {property.purpose}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">
                          {formatPrice(property.price)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={property.is_active ? "default" : "destructive"}
                          >
                            {property.is_active ? "Active" : "Hidden"}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(property.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <a
                                  href={`/${property.company?.slug}/property/${property.slug}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  View Property
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleToggleActive(property.id, property.is_active)
                                }
                              >
                                {property.is_active ? (
                                  <>
                                    <EyeOff className="mr-2 h-4 w-4" />
                                    Hide Property
                                  </>
                                ) : (
                                  <>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Show Property
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <TablePagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            onPageChange={pagination.setCurrentPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
