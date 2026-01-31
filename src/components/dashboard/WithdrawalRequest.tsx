import { useState, useEffect } from "react";
import { Banknote, Plus, Clock, CheckCircle, XCircle, Loader2, AlertCircle, PartyPopper, MessageSquare } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Company } from "@/types/company";
import { format } from "date-fns";

interface WithdrawalRequestProps {
  company: Company;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: string;
  admin_note: string | null;
  created_at: string;
}

const MINIMUM_WITHDRAWAL = 3000; // ₦3,000 minimum

export const WithdrawalRequest = ({ company }: WithdrawalRequestProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [submittedAmount, setSubmittedAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [hasSavedBankDetails, setHasSavedBankDetails] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    bank_name: "",
    account_number: "",
    account_name: "",
  });

  const walletBalance = company.wallet_balance || 0;

  useEffect(() => {
    fetchRequests();
    // Pre-fill bank details from company profile if available
    if (company.bank_name && company.bank_account_number && company.bank_account_name) {
      setFormData(prev => ({
        ...prev,
        bank_name: company.bank_name || "",
        account_number: company.bank_account_number || "",
        account_name: company.bank_account_name || "",
      }));
      setHasSavedBankDetails(true);
    }
  }, [company.id, company.bank_name, company.bank_account_number, company.bank_account_name]);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRequests(data);
    }
  };

  const handleSubmit = async () => {
    const amount = parseFloat(formData.amount);

    if (!amount || amount <= 0) {
      toast({ title: "Error", description: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    if (amount < MINIMUM_WITHDRAWAL) {
      toast({ title: "Error", description: `Minimum withdrawal is ${formatCurrency(MINIMUM_WITHDRAWAL)}`, variant: "destructive" });
      return;
    }

    if (amount > availableBalance) {
      toast({ title: "Error", description: "Amount exceeds available balance", variant: "destructive" });
      return;
    }

    if (!formData.bank_name || !formData.account_number || !formData.account_name) {
      toast({ title: "Error", description: "Please fill all bank details", variant: "destructive" });
      return;
    }

    if (formData.account_number.length !== 10) {
      toast({ title: "Error", description: "Account number must be 10 digits", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    // Save bank details to company profile for future use
    const { error: updateError } = await supabase
      .from("companies")
      .update({
        bank_name: formData.bank_name,
        bank_account_number: formData.account_number,
        bank_account_name: formData.account_name,
      })
      .eq("id", company.id);

    if (updateError) {
      console.error("Failed to save bank details:", updateError);
    } else {
      setHasSavedBankDetails(true);
    }

    const { error } = await supabase.from("withdrawal_requests").insert({
      company_id: company.id,
      amount,
      bank_name: formData.bank_name,
      account_number: formData.account_number,
      account_name: formData.account_name,
    });

    if (error) {
      toast({ title: "Error", description: "Failed to submit request", variant: "destructive" });
    } else {
      // Store amount for success dialog
      setSubmittedAmount(amount);
      // Only reset amount, keep bank details
      setFormData(prev => ({ ...prev, amount: "" }));
      setIsOpen(false);
      setShowSuccessDialog(true);
      fetchRequests();
    }

    setIsLoading(false);
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
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case "processing":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const pendingAmount = requests
    .filter(r => r.status === "pending" || r.status === "processing")
    .reduce((sum, r) => sum + r.amount, 0);

  const availableBalance = walletBalance - pendingAmount;
  const canWithdraw = availableBalance >= MINIMUM_WITHDRAWAL;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Wallet Withdrawals
            </CardTitle>
            <CardDescription>
              Request to withdraw your referral earnings to your bank
            </CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                disabled={!canWithdraw}
                className="w-full sm:w-auto"
                size="default"
              >
                <Plus className="h-4 w-4 mr-2" />
                Request Withdrawal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Request Withdrawal</DialogTitle>
                <DialogDescription>
                  Available balance: {formatCurrency(availableBalance)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Minimum withdrawal: {formatCurrency(MINIMUM_WITHDRAWAL)}. Processed within 1-3 business days.
                  </AlertDescription>
                </Alert>
                <div>
                  <Label>Amount (₦)</Label>
                  <Input
                    type="text"
                    placeholder={`Min: ${MINIMUM_WITHDRAWAL.toLocaleString()}`}
                    value={formData.amount ? Number(formData.amount).toLocaleString() : ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, '');
                      if (raw === "" || /^\d+$/.test(raw)) {
                        setFormData(prev => ({ ...prev, amount: raw }));
                      }
                    }}
                  // max/min props don't work on text inputs, handled in validation
                  />
                </div>
                {hasSavedBankDetails && (
                  <Alert className="bg-muted border-muted-foreground/20">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-sm">
                      Using your saved bank details. You can edit them if needed.
                    </AlertDescription>
                  </Alert>
                )}
                <div>
                  <Label>Bank Name</Label>
                  <Input
                    placeholder="e.g. GTBank, First Bank, Access Bank"
                    value={formData.bank_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Account Number</Label>
                  <Input
                    placeholder="10-digit account number"
                    value={formData.account_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    maxLength={10}
                  />
                </div>
                <div>
                  <Label>Account Name</Label>
                  <Input
                    placeholder="Name on account"
                    value={formData.account_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, account_name: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isLoading} className="w-full sm:w-auto">
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Submit Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Success Dialog */}
          <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
            <DialogContent className="sm:max-w-md text-center">
              <DialogHeader className="items-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                  <PartyPopper className="h-8 w-8 text-green-600" />
                </div>
                <DialogTitle className="text-xl">Withdrawal Request Submitted!</DialogTitle>
                <DialogDescription className="text-center space-y-2">
                  <p>
                    Your request for <strong>{formatCurrency(submittedAmount)}</strong> has been submitted successfully.
                  </p>
                  <p className="text-primary font-medium">
                    💰 You will receive your payment within 1-3 business days.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Our admin team will review and process your withdrawal shortly.
                    You'll be notified once the transfer is complete.
                  </p>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="sm:justify-center">
                <Button onClick={() => setShowSuccessDialog(false)} className="w-full sm:w-auto">
                  Got it!
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Balance Cards - Stack on mobile */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 mb-6">
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">Total Balance</p>
            <p className="text-2xl font-bold">{formatCurrency(walletBalance)}</p>
          </div>
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">Available to Withdraw</p>
            <p className={`text-2xl font-bold ${canWithdraw ? 'text-green-600' : 'text-muted-foreground'}`}>
              {formatCurrency(availableBalance)}
            </p>
            {pendingAmount > 0 && (
              <p className="text-xs text-muted-foreground">{formatCurrency(pendingAmount)} pending</p>
            )}
            {!canWithdraw && availableBalance > 0 && (
              <p className="text-xs text-orange-600 mt-1">
                Need {formatCurrency(MINIMUM_WITHDRAWAL - availableBalance)} more to withdraw
              </p>
            )}
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Banknote className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No withdrawal requests yet</p>
            <p className="text-sm">
              {canWithdraw
                ? "You can request a withdrawal now"
                : `You need at least ${formatCurrency(MINIMUM_WITHDRAWAL)} to withdraw`
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Date</TableHead>
                  <TableHead className="text-xs sm:text-sm">Amount</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Bank</TableHead>
                  <TableHead className="text-xs sm:text-sm">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                      {format(new Date(request.created_at), "MMM d")}
                    </TableCell>
                    <TableCell className="font-medium text-xs sm:text-sm">
                      {formatCurrency(request.amount)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div>
                        <p className="text-sm">{request.bank_name}</p>
                        <p className="text-xs text-muted-foreground">{request.account_number}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {getStatusBadge(request.status)}
                        {request.admin_note && request.status === "rejected" && (
                          <p className="text-xs text-destructive mt-1 max-w-[150px] truncate" title={request.admin_note}>
                            {request.admin_note}
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};