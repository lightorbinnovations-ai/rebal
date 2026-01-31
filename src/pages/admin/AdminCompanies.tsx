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
import { TablePagination } from "@/components/admin/TablePagination";
import { useServerPagination } from "@/hooks/useServerPagination";
import { Search, MoreHorizontal, ExternalLink, Eye, Ban, Shield } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface CompanyWithCount {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  is_verified: boolean;
  is_suspended: boolean;
  created_at: string;
  properties_count: number;
}

export default function AdminCompanies() {
  const { signOut, isLoading: authLoading } = useAdminAuth();
  const [companies, setCompanies] = useState<CompanyWithCount[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  const pagination = useServerPagination({ initialPageSize: 10 });

  // Debounce search
  const { toast } = useToast();
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      pagination.resetToFirstPage();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleToggleSuspension = async (companyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ is_suspended: !currentStatus })
        .eq('id', companyId);

      if (error) throw error;

      toast({
        title: !currentStatus ? "Account Suspended" : "Account Reactivated",
        description: !currentStatus
          ? "The company has been blocked from accessing the platform."
          : "Access has been restored for this company.",
        variant: !currentStatus ? "destructive" : "default"
      });

      fetchCompanies();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const fetchCompanies = useCallback(async () => {
    if (authLoading) return;

    pagination.setLoading(true);
    try {
      const { from, to } = pagination.getRange();

      // Get count first
      let countQuery = supabase
        .from("companies")
        .select("*", { count: "exact", head: true });

      if (debouncedSearch) {
        countQuery = countQuery.or(
          `name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%,slug.ilike.%${debouncedSearch}%`
        );
      }

      const { count } = await countQuery;
      setTotalCount(count || 0);
      pagination.setTotalItems(count || 0);

      // Then get paginated data
      let dataQuery = supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (debouncedSearch) {
        dataQuery = dataQuery.or(
          `name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%,slug.ilike.%${debouncedSearch}%`
        );
      }

      const { data: companiesData, error } = await dataQuery;
      if (error) throw error;

      // Fetch property counts for each company
      const companiesWithCounts = await Promise.all(
        (companiesData || []).map(async (company) => {
          const { count } = await supabase
            .from("properties")
            .select("id", { count: "exact", head: true })
            .eq("company_id", company.id);

          return {
            ...company,
            properties_count: count || 0,
          };
        })
      );

      setCompanies(companiesWithCounts);
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      pagination.setLoading(false);
    }
  }, [authLoading, debouncedSearch, pagination.currentPage, pagination.pageSize]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Real-time subscription for companies table
  useRealtimeSubscription({
    table: "companies",
    onChange: fetchCompanies,
  });

  return (
    <AdminLayout
      title="Companies Management"
      description="View and manage all companies on REBAL"
      isLoading={pagination.isLoading || authLoading}
      onSignOut={signOut}
    >
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>All Companies ({totalCount})</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6">
            <div className="min-w-[700px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Properties</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No companies found
                      </TableCell>
                    </TableRow>
                  ) : (
                    companies.map((company) => (
                      <TableRow key={company.id} className={company.is_suspended ? "bg-destructive/5" : ""}>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{company.name}</span>
                              {company.is_suspended && (
                                <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">Suspended</Badge>
                              )}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              /{company.slug}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <span>{company.email || "—"}</span>
                            <span className="text-muted-foreground">
                              {company.phone || "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{company.properties_count}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={company.is_verified ? "default" : "secondary"}>
                            {company.is_verified ? "Verified" : "Unverified"}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(company.created_at), "MMM d, yyyy")}
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
                                <a href={`/${company.slug}`} target="_blank" rel="noreferrer">
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  View Public Page
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a href={`/${company.slug}/properties`} target="_blank" rel="noreferrer">
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Properties
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleSuspension(company.id, company.is_suspended)}
                                className={company.is_suspended ? "text-green-600 focus:text-green-600" : "text-destructive focus:text-destructive"}
                              >
                                {company.is_suspended ? (
                                  <>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Unsuspend Account
                                  </>
                                ) : (
                                  <>
                                    <Ban className="mr-2 h-4 w-4" />
                                    Suspend Account
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
