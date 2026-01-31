import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Clock, Send, Loader2, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface SupportTicket {
  id: string;
  company_id: string;
  user_id: string;
  subject: string;
  message: string;
  priority: "normal" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  admin_response: string | null;
  responded_at: string | null;
  created_at: string;
  company?: { name: string; slug: string; subscription_status: string };
}

const priorityColors = {
  normal: "bg-muted text-muted-foreground",
  high: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  urgent: "bg-destructive/20 text-destructive",
};

const statusColors = {
  open: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  in_progress: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  resolved: "bg-green-500/20 text-green-700 dark:text-green-400",
  closed: "bg-muted text-muted-foreground",
};

const AdminSupport = () => {
  const { isAdmin, isLoading: authLoading, signOut } = useAdminAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [response, setResponse] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchTickets = async () => {
    setIsLoading(true);
    let query = supabase
      .from("support_tickets")
      .select("*, company:companies(name, slug, subscription_status)")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    // Fetch support tickets
    const { data: ticketsData, error: ticketsError } = await query;

    // Fetch general contact messages (if filter allows)
    let contactQuery = supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all" && statusFilter !== "new") {
      // Map 'new' status of contact messages to 'open' equivalent if needed
      // For simplicity, fetch all and filter in memory or map statuses
      if (statusFilter === 'open') contactQuery = contactQuery.eq('status', 'new');
      else contactQuery = contactQuery.eq('status', statusFilter);
    }

    const { data: messagesData, error: messagesError } = await contactQuery;

    const allTickets: SupportTicket[] = [];

    if (ticketsError) {
      console.error("Support tickets query error:", ticketsError);
    }

    if (!ticketsError && ticketsData) {
      allTickets.push(...(ticketsData as SupportTicket[]));
    }

    if (!messagesError && messagesData) {
      const mappedMessages = messagesData.map((msg: any) => ({
        id: msg.id,
        company_id: "general",
        user_id: "general",
        subject: `Contact: ${msg.name}`, // Prefix to distinguish
        message: msg.message + `\n\nFrom: ${msg.email}`, // Append email to message
        priority: "normal",
        status: msg.status === 'new' ? 'open' : msg.status,
        admin_response: null, // contact_messages doesn't have this yet, maybe add later
        responded_at: null,
        created_at: msg.created_at,
        company: { name: "General Inquiry", slug: "", subscription_status: "free" }
      }));
      allTickets.push(...(mappedMessages as unknown as SupportTicket[]));
    }

    // Sort combined list
    allTickets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setTickets(allTickets);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchTickets();
    }
  }, [isAdmin, statusFilter]);

  const handleRespond = async () => {
    if (!selectedTicket) return;

    setIsSubmitting(true);

    // Use secure RPC function instead of client-side admin API
    const { data: userEmail } = await supabase.rpc('get_user_email_for_admin', {
      p_user_id: selectedTicket.user_id
    });

    const { error } = await supabase
      .from("support_tickets")
      .update({
        admin_response: response,
        responded_at: new Date().toISOString(),
        status: newStatus || selectedTicket.status,
      })
      .eq("id", selectedTicket.id);

    if (error) {
      toast.error("Failed to respond to ticket");
    } else {
      // Send email notification
      try {
        const { data: session } = await supabase.auth.getSession();
        if (session?.session?.access_token) {
          await supabase.functions.invoke("send-notification-email", {
            body: {
              type: "support_response",
              recipientEmail: userEmail || "",
              recipientName: selectedTicket.company?.name || "Customer",
              ticketSubject: selectedTicket.subject,
              adminResponse: response,
            },
          });
        }
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
        // Don't fail the whole operation if email fails
      }

      toast.success("Response sent successfully");
      setSelectedTicket(null);
      setResponse("");
      setNewStatus("");
      fetchTickets();
    }
    setIsSubmitting(false);
  };

  const filteredTickets = tickets.filter((ticket) =>
    ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
    ticket.company?.name.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    urgent: tickets.filter((t) => t.priority === "urgent").length,
  };

  if (authLoading || isLoading) {
    return (
      <AdminLayout title="Support Tickets" onSignOut={signOut} isLoading>
        <div />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Support Tickets" description="Manage customer support requests" onSignOut={signOut}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground">Manage customer support requests</p>
        </div>

        {/* Stats */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Open
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Urgent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">{stats.urgent}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tickets</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tickets Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                          <p className="text-muted-foreground">No support tickets found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{ticket.subject}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {ticket.message}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{ticket.company?.name || "-"}</TableCell>
                          <TableCell>
                            {ticket.company?.subscription_status ? (
                              <Badge
                                variant="secondary"
                                className={
                                  ticket.company.subscription_status === 'business'
                                    ? 'bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30'
                                    : ticket.company.subscription_status === 'pro'
                                      ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30'
                                      : 'bg-muted text-muted-foreground'
                                }
                              >
                                {ticket.company.subscription_status}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">Free</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={priorityColors[ticket.priority]} variant="secondary">
                              {ticket.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[ticket.status]} variant="secondary">
                              {ticket.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {format(new Date(ticket.created_at), "MMM d, yyyy")}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setResponse(ticket.admin_response || "");
                                setNewStatus(ticket.status);
                              }}
                            >
                              {ticket.admin_response ? "View" : "Respond"}
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

      {/* Response Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject}</DialogTitle>
            <DialogDescription>
              From {selectedTicket?.company?.name} •{" "}
              {selectedTicket && format(new Date(selectedTicket.created_at), "MMMM d, yyyy")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">{selectedTicket?.message}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Your Response</label>
              <Textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Type your response..."
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTicket(null)}>
              Cancel
            </Button>
            <Button onClick={handleRespond} disabled={isSubmitting || !response.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              Send Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSupport;
