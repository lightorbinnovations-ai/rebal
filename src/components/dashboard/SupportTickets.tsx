import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Clock, CheckCircle, Loader2, Send, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { TicketListSkeleton } from "@/components/ui/skeletons";

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  priority: "normal" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  admin_response: string | null;
  responded_at: string | null;
  created_at: string;
}

interface SupportTicketsProps {
  companyId: string;
  userId: string;
  isPrioritySupport: boolean;
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

export const SupportTickets = ({ companyId, userId, isPrioritySupport }: SupportTicketsProps) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    priority: "normal" as "normal" | "high" | "urgent",
  });

  const fetchTickets = async () => {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTickets(data as SupportTicket[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTickets();
  }, [companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from("support_tickets").insert({
      company_id: companyId,
      user_id: userId,
      subject: formData.subject,
      message: formData.message,
      priority: isPrioritySupport ? formData.priority : "normal",
    });

    if (error) {
      toast.error("Failed to submit ticket");
    } else {
      toast.success("Support ticket submitted! We'll respond soon.");
      setFormData({ subject: "", message: "", priority: "normal" });
      setShowForm(false);
      fetchTickets();
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return <TicketListSkeleton count={3} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {isPrioritySupport ? "Priority Support" : "Support"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isPrioritySupport
              ? "Get faster responses with priority support"
              : "Contact our support team"}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "New Ticket"}
        </Button>
      </div>

      {isPrioritySupport && (
        <div className="flex items-center gap-2 p-3 bg-secondary/10 rounded-lg border border-secondary/20">
          <AlertCircle className="h-4 w-4 text-secondary" />
          <span className="text-sm text-secondary">
            Priority support: Your tickets are handled with faster response times
          </span>
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create Support Ticket</CardTitle>
            <CardDescription>Describe your issue and we'll get back to you</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                />
              </div>

              {isPrioritySupport && (
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: "normal" | "high" | "urgent") =>
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your issue in detail..."
                  rows={5}
                />
              </div>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Send className="mr-2 h-4 w-4" />
                Submit Ticket
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No support tickets yet</p>
            <p className="text-sm text-muted-foreground">
              Create a ticket if you need help
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium truncate">{ticket.subject}</h4>
                      <Badge className={priorityColors[ticket.priority]} variant="secondary">
                        {ticket.priority}
                      </Badge>
                      <Badge className={statusColors[ticket.status]} variant="secondary">
                        {ticket.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {ticket.message}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(ticket.created_at), "MMM d, yyyy")}
                      </span>
                      {ticket.responded_at && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          Responded
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {ticket.admin_response && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Admin Response:
                    </p>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">
                      {ticket.admin_response}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
