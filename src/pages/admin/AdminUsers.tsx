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
import { Search, MoreHorizontal, Ban, Check, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface UserWithCompany {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  email: string | null;
  created_at: string;
  is_verified: boolean;
  referred_by: string | null;
}

export default function AdminUsers() {
  const { signOut, isLoading: authLoading } = useAdminAuth();
  const [users, setUsers] = useState<UserWithCompany[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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

  const fetchUsers = useCallback(async () => {
    if (authLoading) return;
    
    pagination.setLoading(true);
    try {
      const { from, to } = pagination.getRange();
      
      let query = supabase
        .from("companies")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      // Apply search filter
      if (debouncedSearch) {
        query = query.or(
          `name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%,slug.ilike.%${debouncedSearch}%`
        );
      }

      // Get total count first
      const { count } = await query;
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

      const { data, error } = await dataQuery;
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      pagination.setLoading(false);
    }
  }, [authLoading, debouncedSearch, pagination.currentPage, pagination.pageSize]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Real-time subscription for companies table (users are tied to companies)
  useRealtimeSubscription({
    table: "companies",
    onChange: fetchUsers,
  });

  const handleToggleVerified = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("companies")
        .update({ is_verified: !currentStatus })
        .eq("id", userId);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_verified: !currentStatus } : u
        )
      );
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  return (
    <AdminLayout
      title="Users Management"
      description="View and manage all platform users"
      isLoading={pagination.isLoading || authLoading}
      onSignOut={signOut}
    >
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>All Users ({totalCount})</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
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
                    <TableHead>User / Company</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Referral Source</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.name}</span>
                            <span className="text-sm text-muted-foreground">
                              /{user.slug}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={user.is_verified ? "default" : "secondary"}>
                            {user.is_verified ? "Verified" : "Unverified"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.referred_by ? (
                            <Badge variant="outline">Referred</Badge>
                          ) : (
                            <span className="text-muted-foreground">Direct</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(user.created_at), "MMM d, yyyy")}
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
                                <a href={`/${user.slug}`} target="_blank" rel="noreferrer">
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  View Public Page
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleVerified(user.id, user.is_verified)}
                              >
                                {user.is_verified ? (
                                  <>
                                    <Ban className="mr-2 h-4 w-4" />
                                    Remove Verification
                                  </>
                                ) : (
                                  <>
                                    <Check className="mr-2 h-4 w-4" />
                                    Verify User
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
