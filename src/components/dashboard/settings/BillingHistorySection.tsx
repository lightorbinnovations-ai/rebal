import { CreditCard, Receipt, Loader2, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { cn } from "@/lib/utils";

id: string;
paystack_reference: string;
created_at: string;
amount: number;
payment_method: string | null;
status: string;
metadata: any;
}

interface Plan {
  id: string;
  name: string;
}

interface Subscription {
  status: string;
  current_period_end: string | null;
}

interface BillingHistorySectionProps {
  currentPlan: Plan | undefined;
  subscription: Subscription | undefined;
  payments: Payment[];
  isTrialing: boolean;
  isActive: boolean;
  daysRemaining: number;
  formatPrice: (amount: number) => string;
  showCancelDialog: boolean;
  setShowCancelDialog: (show: boolean) => void;
  processingPlanId: string | null;
  handleCancelSubscription: () => Promise<void>;
}

export const BillingHistorySection = ({
  currentPlan,
  subscription,
  payments,
  isTrialing,
  isActive,
  daysRemaining,
  formatPrice,
  showCancelDialog,
  setShowCancelDialog,
  processingPlanId,
  handleCancelSubscription,
}: BillingHistorySectionProps) => {
  return (
    <div className="space-y-6">
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
                    <TableHead>Description</TableHead>
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
                      <TableCell>
                        {payment.metadata?.payment_type === "domain" ? (
                          <span className="flex flex-col">
                            <span className="font-medium">Domain Registration</span>
                            <span className="text-xs text-muted-foreground">{payment.metadata.domain_name}</span>
                          </span>
                        ) : (
                          <span className="flex flex-col">
                            <span className="font-medium">Subscription</span>
                            <span className="text-xs text-muted-foreground capitalize">
                              {payment.metadata?.plan_name || "Pro"} Plan ({payment.metadata?.billing_interval || "Monthly"})
                            </span>
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{formatPrice(payment.amount)}</TableCell>
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
    </div>
  );
};

export default BillingHistorySection;
