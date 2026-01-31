import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TablePagination } from "@/components/admin/TablePagination";
import { useServerPagination } from "@/hooks/useServerPagination";
import { Share2, DollarSign, Users, AlertTriangle, MoreHorizontal, Check, Loader2, Plus, ChevronsUpDown, Link2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: string;
  reward_amount: number;
  created_at: string;
  paid_at: string | null;
  referrer?: {
    name: string;
    slug: string;
  };
  referred?: {
    name: string;
    slug: string;
  };
}

interface CompanyOption {
  id: string;
  name: string;
  slug: string;
  referral_code: string | null;
}

export default function AdminReferrals() {
  const { signOut, isLoading: authLoading } = useAdminAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    totalEarnings: 0,
    paidOut: 0,
    pending: 0,
  });
  
  // Manual link state
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [selectedReferrer, setSelectedReferrer] = useState<CompanyOption | null>(null);
  const [selectedReferred, setSelectedReferred] = useState<CompanyOption | null>(null);
  const [rewardAmount, setRewardAmount] = useState("500");
  const [isLinking, setIsLinking] = useState(false);
  const [referrerOpen, setReferrerOpen] = useState(false);
  const [referredOpen, setReferredOpen] = useState(false);
  
  const pagination = useServerPagination({ initialPageSize: 10 });

  // Fetch companies for manual linking
  const fetchCompanies = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug, referral_code")
        .order("name");
      
      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  }, []);

  // Fetch stats separately
  const fetchStats = useCallback(async () => {
    try {
      const { data: allReferrals } = await supabase
        .from("referrals")
        .select("status, reward_amount");

      if (allReferrals) {
        const totalEarnings = allReferrals.reduce((sum, r) => sum + r.reward_amount, 0);
        const paidOut = allReferrals
          .filter((r) => r.status === "paid")
          .reduce((sum, r) => sum + r.reward_amount, 0);
        const pending = allReferrals.filter((r) => r.status === "pending").length;

        setStats({
          totalReferrals: allReferrals.length,
          totalEarnings,
          paidOut,
          pending,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  // Fetch paginated referrals
  const fetchReferrals = useCallback(async () => {
    if (authLoading) return;
    
    pagination.setLoading(true);
    try {
      const { from, to } = pagination.getRange();

      // Get count
      const { count } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true });

      pagination.setTotalItems(count || 0);

      // Get paginated referrals (basic data first)
      const { data: referralData, error: referralError } = await supabase
        .from("referrals")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (referralError) throw referralError;

      // Collect all company IDs to fetch names
      const allCompanyIds = new Set<string>();
      (referralData || []).forEach((r: any) => {
        if (r.referrer_id) allCompanyIds.add(r.referrer_id);
        if (r.referred_id) allCompanyIds.add(r.referred_id);
      });

      // Fetch company names directly from companies table (admin has access)
      let companyMap: Record<string, { name: string; slug: string; user_id?: string; wallet_balance?: number }> = {};
      
      if (allCompanyIds.size > 0) {
        const { data: companiesData, error: companiesError } = await supabase
          .from("companies")
          .select("id, name, slug, wallet_balance, user_id")
          .in("id", Array.from(allCompanyIds));
        
        if (!companiesError && companiesData) {
          companiesData.forEach((c: any) => {
            companyMap[c.id] = { 
              name: c.name || `Business #${c.id.slice(0, 6)}`, 
              slug: c.slug || "",
              wallet_balance: c.wallet_balance,
              user_id: c.user_id
            };
          });
        }
      }

      // Map referrals with company names - use business name if available
      const referralsWithNames = (referralData || []).map((r: any) => {
        const referrerInfo = companyMap[r.referrer_id];
        const referredInfo = companyMap[r.referred_id];
        
        return {
          ...r,
          referrer: referrerInfo ? { 
            ...referrerInfo,
            name: referrerInfo.name || `Business #${r.referrer_id.slice(0, 8)}`
          } : { 
            name: `Business #${r.referrer_id.slice(0, 8)}`, 
            slug: "" 
          },
          referred: referredInfo ? {
            ...referredInfo,
            name: referredInfo.name || `Business #${r.referred_id.slice(0, 8)}`
          } : { 
            name: `Business #${r.referred_id.slice(0, 8)}`, 
            slug: "" 
          },
        };
      });

      setReferrals(referralsWithNames);
    } catch (error) {
      console.error("Error fetching referrals:", error);
      setReferrals([]);
    } finally {
      pagination.setLoading(false);
    }
  }, [authLoading, pagination.currentPage, pagination.pageSize]);

  useEffect(() => {
    if (!authLoading) {
      fetchStats();
      fetchCompanies();
    }
  }, [authLoading, fetchStats, fetchCompanies]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  // Reset dialog state when opened
  useEffect(() => {
    if (isLinkDialogOpen) {
      setSelectedReferrer(null);
      setSelectedReferred(null);
      setRewardAmount("500");
    }
  }, [isLinkDialogOpen]);

  // Real-time subscription for referrals table
  useRealtimeSubscription({
    table: "referrals",
    onChange: () => {
      fetchReferrals();
      fetchStats();
    },
  });

  const handleMarkAsPaid = async (referral: Referral) => {
    if (referral.status === "paid") return;
    
    setProcessingId(referral.id);
    try {
      // 1. Update referral status to paid
      const { error: updateError } = await supabase
        .from("referrals")
        .update({ 
          status: "paid", 
          paid_at: new Date().toISOString() 
        })
        .eq("id", referral.id);

      if (updateError) throw updateError;

      // 2. Update referrer's wallet balance
      const currentBalance = (referral.referrer as any)?.wallet_balance || 0;
      const { error: walletError } = await supabase
        .from("companies")
        .update({ 
          wallet_balance: currentBalance + referral.reward_amount 
        })
        .eq("id", referral.referrer_id);

      if (walletError) throw walletError;

      // 3. Create notification for the referrer
      const referrerUserId = (referral.referrer as any)?.user_id;
      if (referrerUserId) {
        await supabase.from("notifications").insert({
          user_id: referrerUserId,
          company_id: referral.referrer_id,
          type: "referral",
          title: "Referral Reward Paid! 🎉",
          message: `Your referral reward of ₦${referral.reward_amount} for referring ${referral.referred?.name || "a new agent"} has been added to your wallet.`,
          metadata: { referral_id: referral.id, amount: referral.reward_amount },
        });
      }

      toast.success("Referral marked as paid and wallet updated!");
      fetchReferrals();
      fetchStats();
    } catch (error) {
      console.error("Error marking referral as paid:", error);
      toast.error("Failed to mark referral as paid");
    } finally {
      setProcessingId(null);
    }
  };

  // Handle manual referral linking
  const handleManualLink = async () => {
    if (!selectedReferrer || !selectedReferred) {
      toast.error("Please select both referrer and referred companies");
      return;
    }

    if (selectedReferrer.id === selectedReferred.id) {
      toast.error("Referrer and referred company cannot be the same");
      return;
    }

    const amount = parseInt(rewardAmount) || 500;
    if (amount < 0) {
      toast.error("Reward amount must be positive");
      return;
    }

    setIsLinking(true);
    try {
      // Check if referral already exists
      const { data: existing } = await supabase
        .from("referrals")
        .select("id")
        .eq("referrer_id", selectedReferrer.id)
        .eq("referred_id", selectedReferred.id)
        .single();

      if (existing) {
        toast.error("This referral relationship already exists");
        setIsLinking(false);
        return;
      }

      // Create the referral record
      const { error: referralError } = await supabase
        .from("referrals")
        .insert({
          referrer_id: selectedReferrer.id,
          referred_id: selectedReferred.id,
          status: "pending",
          reward_amount: amount,
        });

      if (referralError) throw referralError;

      // Update the referred company's referred_by field
      const { error: companyError } = await supabase
        .from("companies")
        .update({ referred_by: selectedReferrer.id })
        .eq("id", selectedReferred.id);

      if (companyError) {
        console.warn("Could not update company referred_by:", companyError);
      }

      toast.success(`Referral linked! ${selectedReferrer.name} → ${selectedReferred.name}`);
      setIsLinkDialogOpen(false);
      fetchReferrals();
      fetchStats();
    } catch (error) {
      console.error("Error creating manual referral:", error);
      toast.error("Failed to create referral link");
    } finally {
      setIsLinking(false);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      paid: { variant: "default", label: "Paid" },
      rejected: { variant: "destructive", label: "Rejected" },
    };
    return config[status] || { variant: "secondary", label: status };
  };

  // Filter out companies that already exist as referred in a referral
  const availableReferredCompanies = companies.filter(c => 
    c.id !== selectedReferrer?.id
  );

  return (
    <AdminLayout
      title="Referrals Management"
      description="Track and manage referral program"
      isLoading={pagination.isLoading || authLoading}
      onSignOut={signOut}
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Referrals</p>
                  <p className="text-2xl font-bold">{stats.totalReferrals}</p>
                </div>
                <Share2 className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold">{formatPrice(stats.totalEarnings)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Paid Out</p>
                  <p className="text-2xl font-bold">{formatPrice(stats.paidOut)}</p>
                </div>
                <Users className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payouts</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referrals Table */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Referral History</CardTitle>
              <CardDescription>All referrals and their payout status</CardDescription>
            </div>
            <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full sm:w-auto">
                  <Link2 className="h-4 w-4 mr-2" />
                  Manual Link
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Link2 className="h-5 w-5" />
                    Manual Referral Link
                  </DialogTitle>
                  <DialogDescription>
                    Create a referral relationship between two companies that wasn't tracked automatically.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Referrer Selection */}
                  <div className="space-y-2">
                    <Label>Referrer (Who referred)</Label>
                    <Popover open={referrerOpen} onOpenChange={setReferrerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={referrerOpen}
                          className="w-full justify-between"
                        >
                          {selectedReferrer ? selectedReferrer.name : "Select referrer..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search companies..." />
                          <CommandList>
                            <CommandEmpty>No company found.</CommandEmpty>
                            <CommandGroup>
                              {companies.map((company) => (
                                <CommandItem
                                  key={company.id}
                                  value={company.name}
                                  onSelect={() => {
                                    setSelectedReferrer(company);
                                    setReferrerOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedReferrer?.id === company.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span>{company.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      Code: {company.referral_code || "N/A"}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Referred Selection */}
                  <div className="space-y-2">
                    <Label>Referred (Who signed up)</Label>
                    <Popover open={referredOpen} onOpenChange={setReferredOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={referredOpen}
                          className="w-full justify-between"
                        >
                          {selectedReferred ? selectedReferred.name : "Select referred..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search companies..." />
                          <CommandList>
                            <CommandEmpty>No company found.</CommandEmpty>
                            <CommandGroup>
                              {availableReferredCompanies.map((company) => (
                                <CommandItem
                                  key={company.id}
                                  value={company.name}
                                  onSelect={() => {
                                    setSelectedReferred(company);
                                    setReferredOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedReferred?.id === company.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {company.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Reward Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="reward">Reward Amount (₦)</Label>
                    <Input
                      id="reward"
                      type="number"
                      value={rewardAmount}
                      onChange={(e) => setRewardAmount(e.target.value)}
                      placeholder="500"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleManualLink} 
                    disabled={isLinking || !selectedReferrer || !selectedReferred}
                  >
                    {isLinking ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Linking...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Link
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 && !pagination.isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Share2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No referrals yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Referrals will appear here when users sign up using referral codes.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto -mx-6 px-6">
                  <div className="min-w-[700px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Referrer</TableHead>
                          <TableHead>Referred</TableHead>
                          <TableHead>Reward</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Paid At</TableHead>
                          <TableHead className="w-12">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {referrals.map((referral) => {
                          const badge = getStatusBadge(referral.status);
                          const isProcessing = processingId === referral.id;
                          return (
                            <TableRow key={referral.id}>
                              <TableCell>
                                <span className="font-medium">
                                  {referral.referrer?.name || `Business #${referral.referrer_id?.slice(0, 8).toUpperCase()}`}
                                </span>
                              </TableCell>
                              <TableCell>
                                {referral.referred?.name || `Business #${referral.referred_id?.slice(0, 8).toUpperCase()}`}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">{formatPrice(referral.reward_amount)}</TableCell>
                              <TableCell>
                                <Badge variant={badge.variant}>{badge.label}</Badge>
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {format(new Date(referral.created_at), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {referral.paid_at
                                  ? format(new Date(referral.paid_at), "MMM d, yyyy")
                                  : "—"}
                              </TableCell>
                              <TableCell>
                                {referral.status === "pending" && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" disabled={isProcessing}>
                                        {isProcessing ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <MoreHorizontal className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleMarkAsPaid(referral)}>
                                        <Check className="mr-2 h-4 w-4 text-green-600" />
                                        Mark as Paid
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                                {referral.status === "paid" && (
                                  <Check className="h-4 w-4 text-green-600" />
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
