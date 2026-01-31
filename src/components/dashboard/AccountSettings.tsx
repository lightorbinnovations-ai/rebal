import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CreditCard,
  User,
  Shield,
  Loader2,
  ExternalLink,
  Key,
  Check,
  Receipt,
  Sparkles,
  Building2,
  Clock,
  AlertTriangle,
  Copy,
  XCircle,
  MessageSquare,
  BadgeCheck,
  Lock,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast as sonnerToast } from "sonner";
import { getDisplayUrl } from "@/lib/socialPreview";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { usePaystack } from "@/hooks/usePaystack";
import { useSubscription } from "@/hooks/useSubscription";
import { PLAN_TIER_ORDER, useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { SupportTickets } from "./SupportTickets";
import { VerificationBadgeSettings } from "./VerificationBadgeSettings";
import { UpgradePrompt } from "./UpgradePrompt";
import { PaymentStatusIndicator } from "./settings/PaymentStatusIndicator";
import { BusinessProfileForm } from "./settings/BusinessProfileForm";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { Company } from "@/types/company";

interface AccountSettingsProps {
  user: SupabaseUser | null;
  company: Company;
  onUpdate?: () => void;
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

import { AffiliateUpgradeCard } from "./AffiliateUpgradeCard";

export const AccountSettings = ({ user, company, onUpdate }: AccountSettingsProps) => {
  const { toast } = useToast();
  const [isYearly, setIsYearly] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<"customDomain" | "verificationBadge" | null>(null);
  const { redirectToPayment, processingPlanId, verifyPayment, cancelSubscription } = usePaystack();
  const { features } = useSubscriptionLimits(company);
  const {
    subscription,
    plans,
    payments,
    currentPlan,
    isLoading: isSubLoading,
    isTrialing,
    isActive,
    isPastDue,
    daysRemaining,
    formatPrice,
  } = useSubscription(company);

  // Verify payment on return from Paystack
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get("reference");
    if (reference) {
      verifyPayment(reference).then(() => {
        // Clean up URL
        const url = new URL(window.location.href);
        url.searchParams.delete("reference");
        url.searchParams.delete("trxref");
        window.history.replaceState({}, "", url.toString());
      });
    }
  }, []);

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handlePasswordChange = async (data: PasswordFormValues) => {
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      setShowPasswordDialog(false);
      passwordForm.reset();
    } catch (error: any) {
      toast({
        title: "Failed to update password",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (planId === "trial") return;

    await redirectToPayment({
      planId,
      billingInterval: isYearly ? "yearly" : "monthly",
    });
  };

  const handleCancelSubscription = async () => {
    const result = await cancelSubscription();
    if (result.success) {
      setShowCancelDialog(false);
      // Reload to reflect changes
      window.location.reload();
    }
  };

  const getAuthProvider = () => {
    const provider = user?.app_metadata?.provider;
    if (provider === "google") return "Google";
    if (provider === "github") return "GitHub";
    return "Email";
  };

  const canChangePassword = user?.app_metadata?.provider === "email";
  const isLoading = isSubLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Account & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your account details and subscription plan
        </p>
      </div>

      {/* Affiliate Upgrade Prompt */}
      {company.account_type === "affiliate" && (
        <AffiliateUpgradeCard
          company={company}
          onUpgrade={() => window.location.reload()}
        />
      )}

      {/* Payment Status Indicator - Shows when payment is pending */}
      <PaymentStatusIndicator
        companyId={company.id}
        onPaymentComplete={() => {
          // Reload to reflect subscription changes
          window.location.reload();
        }}
      />

      {/* Trial/Status Banner */}
      {(isTrialing || isPastDue) && (
        <Card className={cn(
          "border-2",
          isTrialing && "border-primary bg-primary/5",
          isPastDue && "border-destructive bg-destructive/5"
        )}>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              {isTrialing ? (
                <Clock className="h-5 w-5 text-primary" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              )}
              <div className="flex-1">
                <p className="font-medium">
                  {isTrialing
                    ? `${daysRemaining} days left in your free trial`
                    : "Your payment is past due"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isTrialing
                    ? "Upgrade now to continue using all features after your trial ends."
                    : "Please update your payment method to avoid service interruption."}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  // Switch to subscription tab instead of directly initiating payment
                  const tabTrigger = document.querySelector('[value="subscription"]') as HTMLElement;
                  tabTrigger?.click();
                }}
              >
                {isPastDue ? "Update Payment" : "Upgrade Now"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="business" className="flex-1 min-w-[60px] text-xs sm:text-sm py-2">
            <Briefcase className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Business</span>
            <span className="sm:hidden">Biz</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex-1 min-w-[60px] text-xs sm:text-sm py-2">
            <User className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
            <span className="sm:hidden">Acct</span>
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex-1 min-w-[60px] text-xs sm:text-sm py-2">
            <CreditCard className="mr-1 sm:mr-2 h-4 w-4" />
            Plan
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex-1 min-w-[60px] text-xs sm:text-sm py-2">
            <Receipt className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Billing</span>
            <span className="sm:hidden">Bills</span>
          </TabsTrigger>
          <TabsTrigger value="support" className="flex-1 min-w-[60px] text-xs sm:text-sm py-2">
            <MessageSquare className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Support</span>
            <span className="sm:hidden">Help</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="flex-1 min-w-[60px] text-xs sm:text-sm py-2">
            <Sparkles className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Features</span>
            <span className="sm:hidden">More</span>
          </TabsTrigger>
        </TabsList>

        {/* Business Profile Tab - Most important for profile completion */}
        <TabsContent value="business" className="space-y-6">
          <BusinessProfileForm company={company} onUpdate={onUpdate || (() => window.location.reload())} />
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Profile Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>Your personal account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={user?.user_metadata?.full_name || user?.user_metadata?.name || "Not provided"}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input value={user?.email || ""} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{getAuthProvider()} Account</Badge>
                    {user?.email_confirmed_at && (
                      <Badge variant="outline" className="text-green-600 border-green-500/20 bg-green-500/10">
                        <Check className="mr-1 h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>

                {canChangePassword && (
                  <div className="pt-2">
                    <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Key className="mr-2 h-4 w-4" />
                          Change Password
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Change Password</DialogTitle>
                          <DialogDescription>
                            Enter your current password and choose a new one.
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...passwordForm}>
                          <form
                            onSubmit={passwordForm.handleSubmit(handlePasswordChange)}
                            className="space-y-4"
                          >
                            <FormField
                              control={passwordForm.control}
                              name="currentPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Current Password</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="password"
                                      placeholder="••••••••"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={passwordForm.control}
                              name="newPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>New Password</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="password"
                                      placeholder="••••••••"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Min 8 characters with uppercase, lowercase, and number
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={passwordForm.control}
                              name="confirmPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Confirm New Password</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="password"
                                      placeholder="••••••••"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <DialogFooter>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowPasswordDialog(false)}
                              >
                                Cancel
                              </Button>
                              <Button type="submit" disabled={isChangingPassword}>
                                {isChangingPassword && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Update Password
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Company Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Status
                </CardTitle>
                <CardDescription>Your company account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <p className="font-medium text-lg">{company.name}</p>
                </div>
                <div className="space-y-2">
                  <Label>Public Page URL</Label>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <code className="flex-1 text-xs sm:text-sm bg-muted px-2 sm:px-3 py-2 rounded truncate min-w-0">
                      {getDisplayUrl(`/${company.slug}`)}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={async () => {
                        const url = getDisplayUrl(`/${company.slug}`);
                        await navigator.clipboard.writeText(url);
                        sonnerToast.success("Link copied!");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <a
                        href={getDisplayUrl(`/${company.slug}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Verification Status</Label>
                  <Badge
                    variant="outline"
                    className={cn(
                      company.is_verified
                        ? "text-green-600 border-green-500/20 bg-green-500/10"
                        : "text-yellow-600 border-yellow-500/20 bg-yellow-500/10"
                    )}
                  >
                    <Shield className="mr-1 h-3 w-3" />
                    {company.is_verified ? "Verified Business" : "Pending Verification"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label>Member Since</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(company.created_at).toLocaleDateString("en-NG", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-6">
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 py-2">
            <span className={cn("text-sm", !isYearly && "font-medium")}>Monthly</span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} />
            <span className={cn("text-sm", isYearly && "font-medium")}>
              Yearly
              <Badge variant="secondary" className="ml-2 text-xs">
                Save 17%
              </Badge>
            </span>
          </div>

          {/* Plans Grid */}
          {/* Plans Grid */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 items-stretch">
            {plans.map((plan) => {
              const isCurrent = plan.id === currentPlan?.id;
              const price = isYearly ? plan.yearly_price : plan.monthly_price;
              const period = isYearly ? "/year" : "/month";
              const isPopular = plan.id === "pro";

              // Determine upgrade/downgrade based on plan tier
              const currentTier = PLAN_TIER_ORDER[currentPlan?.id || "trial"] || 0;
              const planTier = PLAN_TIER_ORDER[plan.id] || 0;
              const isUpgrade = planTier > currentTier;
              const isDowngrade = planTier < currentTier;

              // Get button text
              const getButtonText = () => {
                if (isCurrent) return "Current Plan";
                if (plan.id === "trial") return "Free Trial";
                if (isUpgrade) return "Upgrade";
                if (isDowngrade) return "Downgrade";
                return "Select";
              };

              return (
                <Card
                  key={plan.id}
                  className={cn(
                    "relative flex flex-col h-full",
                    isCurrent && "border-primary border-2",
                    isPopular && !isCurrent && "border-primary/50"
                  )}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">
                        <Sparkles className="mr-1 h-3 w-3" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    {isCurrent && (
                      <Badge variant="secondary" className="absolute top-4 right-4">
                        Current
                      </Badge>
                    )}
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="pt-4">
                      <span className="text-4xl font-bold">{formatPrice(price)}</span>
                      {price > 0 && (
                        <span className="text-muted-foreground">{period}</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1">
                    <ul className="space-y-2">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant={isCurrent ? "outline" : isPopular ? "default" : isDowngrade ? "ghost" : "outline"}
                      className={cn("w-full", isDowngrade && "text-muted-foreground")}
                      disabled={isCurrent || processingPlanId !== null || plan.id === "trial"}
                      onClick={() => handleUpgrade(plan.id)}
                    >
                      {processingPlanId === plan.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {getButtonText()}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-sm text-muted-foreground">
                💳 Secure payment processing powered by{" "}
                <span className="font-semibold text-foreground">Paystack</span>
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          {/* Current Plan Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    {currentPlan?.name || "Free Trial"} Plan
                  </h3>
                  <p className="text-muted-foreground">
                    {isTrialing ? (
                      `${daysRemaining} days remaining in your free trial`
                    ) : subscription?.current_period_end ? (
                      <>
                        Next billing date:{" "}
                        <span className="font-medium">
                          {new Date(subscription.current_period_end).toLocaleDateString("en-NG", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </>
                    ) : (
                      "No active subscription"
                    )}
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <Badge variant={isActive ? "default" : isTrialing ? "secondary" : "destructive"}>
                    {subscription?.status || "trialing"}
                  </Badge>
                  {(isActive || isTrialing) && (
                    <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <XCircle className="mr-1 h-4 w-4" />
                          Cancel
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Cancel Subscription</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to cancel your subscription? You will lose access to premium features and your property limit will be reduced to 3.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            Your properties will remain, but you won't be able to add more beyond the limit.
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            You can resubscribe anytime to regain full access.
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                            Keep Subscription
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleCancelSubscription}
                            disabled={processingPlanId === "cancelling"}
                          >
                            {processingPlanId === "cancelling" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Yes, Cancel Subscription
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Payment History
              </CardTitle>
              <CardDescription>
                View your past payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p>No billing history yet</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-mono text-sm">
                            {payment.paystack_reference.slice(0, 16)}...
                          </TableCell>
                          <TableCell>
                            {new Date(payment.created_at).toLocaleDateString("en-NG", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </TableCell>
                          <TableCell>{formatPrice(payment.amount / 100)}</TableCell>
                          <TableCell className="capitalize">
                            {payment.payment_method || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                payment.status === "success" &&
                                "text-green-600 border-green-500/20 bg-green-500/10",
                                payment.status === "pending" &&
                                "text-yellow-600 border-yellow-500/20 bg-yellow-500/10",
                                payment.status === "failed" &&
                                "text-red-600 border-red-500/20 bg-red-500/10"
                              )}
                            >
                              {payment.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-medium">Need help with billing?</h4>
                  <p className="text-sm text-muted-foreground">
                    Contact our support team for any billing inquiries
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <a href="mailto:support@rebal.app">Contact Support</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="space-y-6">
          <SupportTickets
            companyId={company.id}
            userId={user?.id || ""}
            isPrioritySupport={features.prioritySupport}
          />
        </TabsContent>

        {/* Features Tab - Verification Badge Only (Custom Domain moved to sidebar) */}
        <TabsContent value="features" className="space-y-8">
          {/* Verification Badge - Business Only */}
          <div>
            {features.verificationBadge ? (
              <VerificationBadgeSettings companyId={company.id} isVerified={company.is_verified} />
            ) : (
              <Card
                className="border-dashed cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setUpgradeFeature("verificationBadge")}
              >
                <CardContent className="py-8">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <BadgeCheck className="h-8 w-8 text-muted-foreground mb-2" />
                    <h3 className="font-semibold mb-1">Verification Badge</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Get verified to build trust with your customers. Available on Business plan.
                    </p>
                    <Badge variant="outline" className="cursor-pointer">Click to Unlock</Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Upgrade Prompt for Locked Features */}
      {
        upgradeFeature && (
          <UpgradePrompt
            open={!!upgradeFeature}
            onOpenChange={(open) => !open && setUpgradeFeature(null)}
            featureKey={upgradeFeature}
            currentPlan={currentPlan?.id || "trial"}
          />
        )
      }
    </div >
  );
};
