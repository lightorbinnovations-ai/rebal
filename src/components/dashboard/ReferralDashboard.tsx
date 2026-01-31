import { useState, useEffect } from "react";
import { Copy, Users, Wallet, Gift, CheckCircle, Clock, Banknote, TrendingUp, Eye, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Company, Referral } from "@/types/company";
import { format } from "date-fns";
import { WithdrawalRequest } from "./WithdrawalRequest";
import { ReferralTableSkeleton } from "@/components/ui/skeletons";

interface ReferralDashboardProps {
  company: Company;
}

interface CommissionTransaction {
  id: string;
  referred_id: string;
  payment_amount: number;
  commission_amount: number;
  commission_rate: number;
  created_at: string;
  referred_company?: { name: string } | null;
}

export const ReferralDashboard = ({ company }: ReferralDashboardProps) => {
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [commissions, setCommissions] = useState<CommissionTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0, // Referrals who have made at least one payment
    totalEarned: 0,
    walletBalance: 0,
    totalVisits: 0,
    totalSignups: 0,
    conversionRate: 0,
  });

  useEffect(() => {
    fetchData();
  }, [company.id]);

  const fetchData = async () => {
    try {
      // Fetch referrals
      const { data: referralData, error: referralError } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", company.id)
        .order("created_at", { ascending: false });

      if (referralError) throw referralError;

      // Fetch commission transactions
      const { data: commissionData, error: commissionError } = await supabase
        .from("referral_commissions")
        .select("*")
        .eq("referrer_id", company.id)
        .order("created_at", { ascending: false });

      if (commissionError) throw commissionError;

      // Collect all unique referred_ids from both referrals and commissions
      const allReferredIds = new Set<string>();
      (referralData || []).forEach((r: any) => {
        if (r.referred_id) allReferredIds.add(r.referred_id);
      });
      (commissionData || []).forEach((c: any) => {
        if (c.referred_id) allReferredIds.add(c.referred_id);
      });

      // Fetch all company names using the public view (bypasses RLS for referred companies)
      let companyMap: Record<string, { name: string; slug?: string; created_at?: string }> = {};
      
      if (allReferredIds.size > 0) {
        // Use public_company_profiles_safe view which is publicly readable
        const { data: companiesData, error: companiesError } = await supabase
          .from("public_company_profiles_safe")
          .select("id, name, slug, created_at")
          .in("id", Array.from(allReferredIds));
        
        if (!companiesError && companiesData) {
          companiesData.forEach((c: any) => {
            if (c.id) {
              // Use actual business name, fallback to traceable Agent ID if missing
              const displayName = c.name && c.name.trim() ? c.name : `Agent #${c.id.slice(0, 8).toUpperCase()}`;
              companyMap[c.id] = { name: displayName, slug: c.slug, created_at: c.created_at };
            }
          });
        }
        
        // For any referred_id not found in public profiles, add traceable fallback
        allReferredIds.forEach((refId) => {
          if (!companyMap[refId]) {
            companyMap[refId] = { name: `Agent #${refId.slice(0, 8).toUpperCase()}`, slug: undefined, created_at: undefined };
          }
        });
      }

      // Fetch visit/signup stats from referral_events
      const { data: visitEvents } = await supabase
        .from("referral_events")
        .select("id")
        .eq("referrer_company_id", company.id)
        .eq("event_type", "visit");

      const { data: signupEvents } = await supabase
        .from("referral_events")
        .select("id")
        .eq("referrer_company_id", company.id)
        .eq("event_type", "signup");

      // Map referrals with company names
      const referralsWithNames = (referralData || []).map((r: any) => ({
        ...r,
        referred_company: companyMap[r.referred_id] || null,
      }));

      // Map commissions with company names
      const commissionsWithNames = (commissionData || []).map((c: any) => ({
        ...c,
        referred_company: companyMap[c.referred_id] || null,
      }));

      console.log("Referrals with names:", referralsWithNames);
      console.log("Commissions with names:", commissionsWithNames);

      setReferrals(referralsWithNames);
      setCommissions(commissionsWithNames);

      // Calculate stats
      const totalEarned = (commissionData || [])
        .reduce((sum: number, c: CommissionTransaction) => sum + (c.commission_amount || 0), 0);
      
      // Active referrals are those with status "completed" or "paid" (made a payment)
      const activeReferrals = referralsWithNames.filter(
        (r: any) => r.status === "completed" || r.status === "paid"
      ).length;

      const totalVisits = visitEvents?.length || 0;
      const totalSignups = signupEvents?.length || 0;
      const conversionRate = totalVisits > 0 ? (totalSignups / totalVisits) * 100 : 0;

      setStats({
        totalReferrals: referralsWithNames.length,
        activeReferrals,
        totalEarned,
        walletBalance: company.wallet_balance || 0,
        totalVisits,
        totalSignups,
        conversionRate,
      });
    } catch (error) {
      console.error("Error fetching referral data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/auth?ref=${company.referral_code}`;
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    });
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(company.referral_code || "");
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
      case "completed":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Wallet className="h-3 w-3 mr-1" />Active</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Awaiting Payment</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Referral Program</h1>
        <p className="text-muted-foreground">
          Earn 10% commission on every payment your referrals make — forever!
        </p>
      </div>

      {/* Referral Link Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Your Referral Code
          </CardTitle>
          <CardDescription>
            Share this code with other agents to start earning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-background rounded-lg px-4 py-3 font-mono text-lg font-bold tracking-wider border">
              {company.referral_code || "Loading..."}
            </div>
            <Button variant="outline" size="icon" onClick={copyReferralCode}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={copyReferralLink} className="w-full">
            <Copy className="h-4 w-4 mr-2" />
            Copy Referral Link
          </Button>
        </CardContent>
      </Card>

      {/* Conversion Stats Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Conversion Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="text-center p-2 sm:p-3 rounded-lg bg-muted/50 min-w-0">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </div>
              <div className="text-lg sm:text-2xl font-bold">{stats.totalVisits}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Link Clicks</p>
            </div>
            <div className="text-center p-2 sm:p-3 rounded-lg bg-muted/50 min-w-0">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </div>
              <div className="text-lg sm:text-2xl font-bold">{stats.totalSignups}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Signups</p>
            </div>
            <div className="text-center p-2 sm:p-3 rounded-lg bg-primary/10 min-w-0 overflow-hidden">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Percent className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              </div>
              <div className="text-base sm:text-2xl font-bold text-primary truncate">
                {stats.conversionRate.toFixed(0)}%
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Conversion</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold">{stats.totalReferrals}</div>
            <p className="text-xs text-muted-foreground hidden sm:block">Agents signed up</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.activeReferrals}</div>
            <p className="text-xs text-muted-foreground hidden sm:block">Paid subscribers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(stats.totalEarned)}</div>
            <p className="text-xs text-muted-foreground hidden sm:block">Lifetime earnings</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20 col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Wallet Balance</CardTitle>
            <Banknote className="h-4 w-4 text-green-600 hidden sm:block" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(stats.walletBalance)}</div>
            <p className="text-xs text-muted-foreground hidden sm:block">Available to withdraw</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral History with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
          <CardDescription>
            Track all the agents you've referred and your commission earnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="commissions" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 h-auto p-1">
              <TabsTrigger value="commissions" className="text-xs sm:text-sm py-2">
                <TrendingUp className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Commission History</span>
                <span className="sm:hidden">Commissions</span>
              </TabsTrigger>
              <TabsTrigger value="referrals" className="text-xs sm:text-sm py-2">
                <Users className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Referred Agents</span>
                <span className="sm:hidden">Agents</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="commissions">
              {isLoading ? (
                <ReferralTableSkeleton />
              ) : commissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No commission earnings yet</p>
                  <p className="text-sm">You'll earn 10% when your referrals make payments</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Date</TableHead>
                        <TableHead className="text-xs sm:text-sm">Agent</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm hidden sm:table-cell">Payment</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Commission (10%)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions.map((commission) => (
                        <TableRow key={commission.id}>
                          <TableCell className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">
                            {format(new Date(commission.created_at), "MMM d")}
                          </TableCell>
                          <TableCell className="font-medium text-xs sm:text-sm">
                            <span className="truncate max-w-[80px] sm:max-w-none inline-block">
                              {commission.referred_company?.name || "Unknown"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-xs sm:text-sm hidden sm:table-cell">
                            {formatCurrency(commission.payment_amount)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600 text-xs sm:text-sm whitespace-nowrap">
                            +{formatCurrency(commission.commission_amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="referrals">
              {isLoading ? (
                <ReferralTableSkeleton />
              ) : referrals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No referrals yet</p>
                  <p className="text-sm">Share your referral link to start earning!</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Agent</TableHead>
                        <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Joined</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Earned</TableHead>
                        <TableHead className="text-xs sm:text-sm">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referrals.map((referral) => (
                        <TableRow key={referral.id}>
                          <TableCell className="font-medium text-xs sm:text-sm">
                            <span className="truncate max-w-[80px] sm:max-w-none inline-block">
                              {referral.referred_company?.name || "Unknown"}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs sm:text-sm hidden sm:table-cell">
                            {format(new Date(referral.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right font-medium text-xs sm:text-sm">
                            {referral.reward_amount > 0 ? (
                              <span className="text-green-600">{formatCurrency(referral.reward_amount)}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">{getStatusBadge(referral.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Withdrawal Requests */}
      <WithdrawalRequest company={company} />

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <span className="text-xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold mb-1">Share Your Link</h3>
              <p className="text-sm text-muted-foreground">
                Copy your unique referral link and share it with other agents
              </p>
            </div>
            <div className="text-center p-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <span className="text-xl font-bold text-primary">2</span>
              </div>
              <h3 className="font-semibold mb-1">They Sign Up</h3>
              <p className="text-sm text-muted-foreground">
                When they create an account using your link, they're linked to you
              </p>
            </div>
            <div className="text-center p-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <span className="text-xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold mb-1">They Subscribe</h3>
              <p className="text-sm text-muted-foreground">
                When they pay for any subscription plan
              </p>
            </div>
            <div className="text-center p-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                <span className="text-xl font-bold text-green-600">4</span>
              </div>
              <h3 className="font-semibold mb-1 text-green-600">You Earn 10%</h3>
              <p className="text-sm text-muted-foreground">
                Get 10% of every payment they make, forever — withdraw to your bank
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};