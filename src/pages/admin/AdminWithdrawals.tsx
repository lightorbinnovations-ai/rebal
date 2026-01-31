import { useState, useEffect } from "react";
import { Banknote, CheckCircle, XCircle, Clock, Loader2, MessageSquare } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { TablePagination } from "@/components/admin/TablePagination";
import { useServerPagination } from "@/hooks/useServerPagination";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { TableSkeleton } from "@/components/ui/skeletons";

interface WithdrawalRequest {
  id: string;
  company_id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  company?: { name: string; slug: string; user_id: string };
}

export default function AdminWithdrawals() {
  const { signOut, isLoading: authLoading } = useAdminAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [rejectReason, setRejectReason] = useState("");
  const [messageDialog, setMessageDialog] = useState<{ open: boolean; request: WithdrawalRequest | null }>({ open: false, request: null });
  const [messageSubject, setMessageSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [stats, setStats] = useState({ pending: 0, pendingAmount: 0, completed: 0, completedAmount: 0 });

  const pagination = useServerPagination({ initialPageSize: 10 });

  useEffect(() => {
    fetchStats();
    fetchRequests();
  }, [pagination.currentPage]);

  const fetchStats = async () => {
    const { data } = await supabase.from("withdrawal_requests").select("status, amount");
    if (data) {
      const pending = data.filter(r => r.status === "pending");
      const completed = data.filter(r => r.status === "completed");
      setStats({
        pending: pending.length,
        pendingAmount: pending.reduce((sum, r) => sum + r.amount, 0),
        completed: completed.length,
        completedAmount: completed.reduce((sum, r) => sum + r.amount, 0),
      });
    }
  };

  const fetchRequests = async () => {
    setIsLoading(true);

    const { count } = await supabase
      .from("withdrawal_requests")
      .select("*", { count: "exact", head: true });

    pagination.setTotalItems(count || 0);

    const { from, to } = pagination.getRange();
    const { data, error } = await supabase
      .from("withdrawal_requests")
      .select(`*, company:companies(name, slug, user_id)`)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (!error && data) {
      setRequests(data.map((r: any) => ({ ...r, company: r.company })));
    }
    setIsLoading(false);
  };

  const handleSendMessage = async () => {
    if (!messageDialog.request || !messageContent.trim()) return;

    setSendingMessage(true);

    const subject = messageSubject.trim() || `Regarding your withdrawal request for ${formatCurrency(messageDialog.request.amount)}`;

    // Create an inquiry from admin to user (will appear in their inquiries tab)
    const { error } = await supabase.from("inquiries").insert({
      company_id: messageDialog.request.company_id,
      name: "Rebal Support",
      email: "support@rebal.site",
      message: `**Subject: ${subject}**\n\n${messageContent}`,
      status: "New",
    });

    if (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    } else {
      toast({ title: "Message Sent", description: "The user will see this in their Inquiries tab" });
      setMessageDialog({ open: false, request: null });
      setMessageSubject("");
      setMessageContent("");
    }

    setSendingMessage(false);
  };

  const handleApprove = async (request: WithdrawalRequest) => {
    setProcessing(request.id);

    // Get current wallet balance first
    const { data: companyData } = await supabase
      .from("companies")
      .select("wallet_balance")
      .eq("id", request.company_id)
      .single();

    const currentBalance = companyData?.wallet_balance || 0;
    const newBalance = Math.max(0, currentBalance - request.amount);

    // Update wallet balance
    await supabase
      .from("companies")
      .update({ wallet_balance: newBalance })
      .eq("id", request.company_id);

    // Update request status
    const { error } = await supabase
      .from("withdrawal_requests")
      .update({ status: "completed", processed_at: new Date().toISOString() })
      .eq("id", request.id);

    if (error) {
      toast({ title: "Error", description: "Failed to process withdrawal", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Withdrawal marked as completed" });
      fetchRequests();
      fetchStats();
    }
    setProcessing(null);
  };

  const handleReject = async () => {
    if (!rejectDialog.id) return;
    setProcessing(rejectDialog.id);

    const { error } = await supabase
      .from("withdrawal_requests")
      .update({ status: "rejected", admin_note: rejectReason, processed_at: new Date().toISOString() })
      .eq("id", rejectDialog.id);

    if (error) {
      toast({ title: "Error", description: "Failed to reject withdrawal", variant: "destructive" });
    } else {
      toast({ title: "Done", description: "Withdrawal request rejected" });
      fetchRequests();
      fetchStats();
    }
    setRejectDialog({ open: false, id: null });
    setRejectReason("");
    setProcessing(null);
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
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Loader2 className="h-3 w-3 mr-1" />Processing</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <AdminLayout
      title="Withdrawal Requests"
      description="Manage user withdrawal requests"
      isLoading={authLoading}
      onSignOut={signOut}
    >
      <div className="space-y-6">
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
          <AdminStatCard
            title="Pending Requests"
            value={stats.pending.toString()}
            icon={Clock}
          />
          <AdminStatCard
            title="Pending Amount"
            value={formatCurrency(stats.pendingAmount)}
            icon={Banknote}
          />
          <AdminStatCard
            title="Completed"
            value={stats.completed.toString()}
            icon={CheckCircle}
          />
          <AdminStatCard
            title="Total Paid Out"
            value={formatCurrency(stats.completedAmount)}
            icon={Banknote}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton rows={5} columns={6} />
            ) : (
              <>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="min-w-[700px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Bank Details</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requests.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No withdrawal requests yet
                            </TableCell>
                          </TableRow>
                        ) : (
                          requests.map((request) => (
                            <TableRow key={request.id}>
                              <TableCell>{format(new Date(request.created_at), "MMM d, yyyy")}</TableCell>
                              <TableCell className="font-medium">{request.company?.name || "Unknown"}</TableCell>
                              <TableCell className="font-bold">{formatCurrency(request.amount)}</TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <p className="font-medium">{request.bank_name}</p>
                                  <p className="text-muted-foreground">{request.account_number}</p>
                                  <p className="text-muted-foreground">{request.account_name}</p>
                                </div>
                              </TableCell>
                              <TableCell>{getStatusBadge(request.status)}</TableCell>
                              <TableCell>
                                {request.status === "pending" ? (
                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleApprove(request)}
                                      disabled={processing === request.id}
                                    >
                                      {processing === request.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                      )}
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => setRejectDialog({ open: true, id: request.id })}
                                      disabled={processing === request.id}
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Reject
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setMessageDialog({ open: true, request })}
                                    >
                                      <MessageSquare className="h-4 w-4 mr-1" />
                                      Message
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setMessageDialog({ open: true, request })}
                                  >
                                    <MessageSquare className="h-4 w-4 mr-1" />
                                    Message
                                  </Button>
                                )}
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
              </>
            )}
          </CardContent>
        </Card>

        <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, id: open ? rejectDialog.id : null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Withdrawal</DialogTitle>
              <DialogDescription>Provide a reason for rejecting this withdrawal request.</DialogDescription>
            </DialogHeader>
            <div>
              <Label>Reason</Label>
              <Textarea
                placeholder="e.g. Invalid bank details, insufficient verification..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialog({ open: false, id: null })}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject} disabled={!rejectReason}>
                Reject Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Message User Dialog */}
        <Dialog open={messageDialog.open} onOpenChange={(open) => setMessageDialog({ open, request: open ? messageDialog.request : null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Message User</DialogTitle>
              <DialogDescription>
                Send a message to {messageDialog.request?.company?.name || "this user"} about their withdrawal request.
                They will see it in their Inquiries tab.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Subject (optional)</Label>
                <Input
                  placeholder={`Regarding withdrawal of ${messageDialog.request ? formatCurrency(messageDialog.request.amount) : ""}`}
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea
                  placeholder="e.g. We noticed an issue with your bank details. Please verify your account number..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setMessageDialog({ open: false, request: null });
                setMessageSubject("");
                setMessageContent("");
              }}>Cancel</Button>
              <Button onClick={handleSendMessage} disabled={!messageContent.trim() || sendingMessage}>
                {sendingMessage && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
