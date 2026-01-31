import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { BASE_URL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { BadgeCheck, Clock, Loader2, Search, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface VerificationRequest {
  id: string;
  company_id: string;
  status: "pending" | "approved" | "rejected";
  business_registration: string | null;
  additional_info: string | null;
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
  company?: { name: string; slug: string; is_verified: boolean };
}

const statusColors = {
  pending: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  approved: "bg-green-500/20 text-green-700 dark:text-green-400",
  rejected: "bg-destructive/20 text-destructive",
};

const AdminVerifications = () => {
  const { isAdmin, isLoading: authLoading, user, signOut } = useAdminAuth();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const fetchRequests = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("verification_requests")
      .select("*, company:companies(name, slug, is_verified)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRequests(data as VerificationRequest[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchRequests();
    }
  }, [isAdmin]);

  const handleApprove = async (request: VerificationRequest) => {
    setIsSubmitting(true);

    // Get company owner email
    const { data: companyData } = await supabase
      .from("companies")
      .select("user_id, name")
      .eq("id", request.company_id)
      .single();

    let userEmail = "";
    if (companyData?.user_id) {
      // Use secure RPC function instead of client-side admin API
      const { data: emailData } = await supabase.rpc('get_user_email_for_admin', {
        p_user_id: companyData.user_id
      });
      userEmail = emailData || "";
    }

    // Update request status
    const { error: requestError } = await supabase
      .from("verification_requests")
      .update({
        status: "approved",
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", request.id);

    if (requestError) {
      toast.error("Failed to approve verification");
      setIsSubmitting(false);
      return;
    }

    // Update company verified status
    const { error: companyError } = await supabase
      .from("companies")
      .update({ is_verified: true })
      .eq("id", request.company_id);

    if (companyError) {
      toast.error("Failed to update company verification");
    } else {
      // Send email notification
      try {
        await supabase.functions.invoke("send-notification-email", {
          body: {
            type: "verification_approved",
            recipientEmail: userEmail,
            recipientName: request.company?.name || "Customer",
            companyName: request.company?.name || companyData?.name,
          },
        });
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
      }

      toast.success("Verification approved! Company badge activated.");
      fetchRequests();
    }

    setSelectedRequest(null);
    setIsSubmitting(false);
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    setIsSubmitting(true);

    // Get company owner email
    const { data: companyData } = await supabase
      .from("companies")
      .select("user_id, name")
      .eq("id", selectedRequest.company_id)
      .single();

    let userEmail = "";
    if (companyData?.user_id) {
      // Use secure RPC function instead of client-side admin API
      const { data: emailData } = await supabase.rpc('get_user_email_for_admin', {
        p_user_id: companyData.user_id
      });
      userEmail = emailData || "";
    }

    const { error } = await supabase
      .from("verification_requests")
      .update({
        status: "rejected",
        rejection_reason: rejectionReason,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", selectedRequest.id);

    if (error) {
      toast.error("Failed to reject verification");
    } else {
      // Send email notification
      try {
        await supabase.functions.invoke("send-notification-email", {
          body: {
            type: "verification_rejected",
            recipientEmail: userEmail,
            recipientName: selectedRequest.company?.name || "Customer",
            companyName: selectedRequest.company?.name || companyData?.name,
            rejectionReason: rejectionReason,
          },
        });
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
      }

      toast.success("Verification rejected");
      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectionReason("");
      fetchRequests();
    }
    setIsSubmitting(false);
  };

  const filteredRequests = requests.filter((req) =>
    req.company?.name.toLowerCase().includes(search.toLowerCase()) ||
    req.business_registration?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  if (authLoading || isLoading) {
    return (
      <AdminLayout title="Verification Requests" onSignOut={signOut} isLoading>
        <div />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Verification Requests" description="Review and approve business verifications" onSignOut={signOut}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Verification Requests</h1>
          <p className="text-muted-foreground">Review and approve business verifications</p>
        </div>

        {/* Stats */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">{stats.rejected}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by company name or registration..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 max-w-md"
          />
        </div>

        {/* Requests Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Registration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <BadgeCheck className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                          <p className="text-muted-foreground">No verification requests found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{request.company?.name}</span>
                              {request.company?.is_verified && (
                                <BadgeCheck className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {request.business_registration || "Not provided"}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[request.status]} variant="secondary">
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {format(new Date(request.created_at), "MMM d, yyyy")}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedRequest(request)}
                            >
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedRequest?.company?.name}
              {selectedRequest?.company?.is_verified && (
                <BadgeCheck className="h-5 w-5 text-green-500" />
              )}
            </DialogTitle>
            <DialogDescription>
              Submitted {selectedRequest && format(new Date(selectedRequest.created_at), "MMMM d, yyyy")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Business Registration</label>
              <p className="text-sm bg-muted p-3 rounded-lg mt-1">
                {selectedRequest?.business_registration || "Not provided"}
              </p>
            </div>

            {selectedRequest?.additional_info && (
              <div>
                <label className="text-sm font-medium">Additional Information</label>
                <p className="text-sm bg-muted p-3 rounded-lg mt-1">
                  {selectedRequest.additional_info}
                </p>
              </div>
            )}

            {selectedRequest?.rejection_reason && (
              <div>
                <label className="text-sm font-medium text-destructive">Rejection Reason</label>
                <p className="text-sm bg-destructive/10 p-3 rounded-lg mt-1 text-destructive">
                  {selectedRequest.rejection_reason}
                </p>
              </div>
            )}

            <div>
              <a
                href={`${BASE_URL}/${selectedRequest?.company?.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-secondary hover:underline flex items-center gap-1"
              >
                View Company Page <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <DialogFooter className="gap-2">
            {selectedRequest?.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={isSubmitting}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  onClick={() => selectedRequest && handleApprove(selectedRequest)}
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </>
            )}
            {selectedRequest?.status !== "pending" && (
              <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Verification</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this verification request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter rejection reason..."
            rows={3}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={!rejectionReason.trim() || isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminVerifications;
