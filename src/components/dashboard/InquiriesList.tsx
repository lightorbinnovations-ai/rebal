import { useEffect, useState, useCallback } from "react";
import { format, subDays, isAfter } from "date-fns";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { useOptimisticList } from "@/hooks/useOptimisticMutation";
import {
  MessageSquare,
  Mail,
  User,
  Building2,
  Calendar,
  Search,
  Eye,
  CheckCircle2,
  Phone,
  Copy,
  ExternalLink,
  Filter,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Company, Inquiry, Property, InquiryStatus } from "@/types/company";

interface InquiriesListProps {
  company: Company;
}

interface InquiryWithProperty extends Inquiry {
  property?: Property;
}

const STATUS_CONFIG: Record<InquiryStatus, { label: string; color: string; icon: typeof Eye }> = {
  New: { label: "New", color: "bg-green-500/10 text-green-600 border-green-500/20", icon: MessageSquare },
  Viewed: { label: "Viewed", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Eye },
  Responded: { label: "Responded", color: "bg-muted text-muted-foreground border-muted", icon: CheckCircle2 },
};

const DATE_FILTERS = [
  { value: "all", label: "All Time" },
  { value: "7", label: "Last 7 Days" },
  { value: "30", label: "Last 30 Days" },
  { value: "90", label: "Last 90 Days" },
];

export const InquiriesList = ({ company }: InquiriesListProps) => {
  const { toast } = useToast();
  const [inquiries, setInquiries] = useState<InquiryWithProperty[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryWithProperty | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const { data: inquiriesData } = await supabase
        .from("inquiries")
        .select("*")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });

      const { data: propertiesData } = await supabase
        .from("properties")
        .select("*")
        .eq("company_id", company.id);

      const props = (propertiesData as Property[]) || [];
      setProperties(props);

      const inquiriesWithProps = (inquiriesData || []).map((inquiry) => ({
        ...inquiry,
        property: props.find((p) => p.id === inquiry.property_id),
      })) as InquiryWithProperty[];

      setInquiries(inquiriesWithProps);
    } catch (error) {
      console.error("Failed to fetch inquiries:", error);
    } finally {
      setIsLoading(false);
    }
  }, [company.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time subscription for inquiries
  useRealtimeSubscription({
    table: "inquiries",
    onChange: fetchData,
  });

  // Optimistic list operations
  const { optimisticUpdate } = useOptimisticList(inquiries, setInquiries);

  const updateStatus = async (inquiryId: string, newStatus: InquiryStatus) => {
    // Store previous status for potential rollback
    const previousStatus = inquiries.find((i) => i.id === inquiryId)?.status;

    // Optimistic update to UI first
    setInquiries((prev) =>
      prev.map((inq) =>
        inq.id === inquiryId ? { ...inq, status: newStatus } : inq
      )
    );

    if (selectedInquiry?.id === inquiryId) {
      setSelectedInquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      const { error } = await supabase
        .from("inquiries")
        .update({ status: newStatus })
        .eq("id", inquiryId);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Inquiry marked as ${newStatus}.`,
      });
    } catch (error: any) {
      // Rollback on error
      setInquiries((prev) =>
        prev.map((inq) =>
          inq.id === inquiryId ? { ...inq, status: previousStatus || "New" } : inq
        )
      );
      if (selectedInquiry?.id === inquiryId) {
        setSelectedInquiry((prev) => (prev ? { ...prev, status: previousStatus || "New" } : null));
      }
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleViewInquiry = async (inquiry: InquiryWithProperty) => {
    setSelectedInquiry(inquiry);
    if (inquiry.status === "New") {
      await updateStatus(inquiry.id, "Viewed");
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard.`,
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const filteredInquiries = inquiries.filter((inquiry) => {
    const matchesSearch =
      inquiry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.property?.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProperty =
      propertyFilter === "all" ||
      (propertyFilter === "general" && !inquiry.property_id) ||
      inquiry.property_id === propertyFilter;

    const matchesStatus =
      statusFilter === "all" || inquiry.status === statusFilter;

    const matchesDate =
      dateFilter === "all" ||
      isAfter(new Date(inquiry.created_at), subDays(new Date(), parseInt(dateFilter)));

    return matchesSearch && matchesProperty && matchesStatus && matchesDate;
  });

  const newCount = inquiries.filter((i) => i.status === "New").length;

  return (
    <div className="space-y-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold">Inquiries</h1>
          {newCount > 0 && (
            <Badge className="bg-green-500 text-white">
              {newCount} new
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Manage leads and messages from potential clients ({inquiries.length} total)
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or property..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Viewed">Viewed</SelectItem>
                  <SelectItem value="Responded">Responded</SelectItem>
                </SelectContent>
              </Select>
              <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Property" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Properties</SelectItem>
                  <SelectItem value="general">General Inquiries</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full col-span-2 sm:col-span-1">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FILTERS.map((filter) => (
                    <SelectItem key={filter.value} value={filter.value}>
                      {filter.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inquiries List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredInquiries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No inquiries found</h3>
            <p className="text-muted-foreground">
              {inquiries.length === 0
                ? "You haven't received any inquiries yet. Share your property pages to start getting leads!"
                : "No inquiries match your filter criteria."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredInquiries.map((inquiry) => {
            const statusConfig = STATUS_CONFIG[inquiry.status];
            const StatusIcon = statusConfig.icon;

            return (
              <Card
                key={inquiry.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  inquiry.status === "New" && "border-l-4 border-l-green-500"
                )}
                onClick={() => handleViewInquiry(inquiry)}
              >
                <CardContent className="py-3 sm:py-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold truncate">{inquiry.name}</span>
                          <Badge
                            variant="outline"
                            className={cn("text-xs flex-shrink-0", statusConfig.color)}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-muted-foreground mb-2">
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{inquiry.email}</span>
                          </span>
                          {inquiry.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              {inquiry.phone}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {inquiry.message}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {inquiry.property && (
                        <Badge variant="secondary" className="text-xs">
                          <Building2 className="h-3 w-3 mr-1" />
                          <span className="truncate max-w-[120px] sm:max-w-none">{inquiry.property.title}</span>
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {format(new Date(inquiry.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Inquiry Detail Modal */}
      <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
        <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {selectedInquiry?.name}
            </DialogTitle>
            <DialogDescription>
              Inquiry received {selectedInquiry && format(new Date(selectedInquiry.created_at), "PPpp")}
            </DialogDescription>
          </DialogHeader>

          {selectedInquiry && (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(STATUS_CONFIG[selectedInquiry.status].color)}
                >
                  {STATUS_CONFIG[selectedInquiry.status].label}
                </Badge>
                {selectedInquiry.property && (
                  <Badge variant="secondary">
                    <Building2 className="h-3 w-3 mr-1" />
                    {selectedInquiry.property.title}
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate break-all">{selectedInquiry.email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={() => copyToClipboard(selectedInquiry.email, "Email")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                {selectedInquiry.phone && (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate break-all">{selectedInquiry.phone}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0"
                      onClick={() => copyToClipboard(selectedInquiry.phone!, "Phone")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* Message */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Message</h4>
                <p className="text-sm bg-muted/50 p-3 rounded-lg whitespace-pre-wrap break-words">
                  {selectedInquiry.message}
                </p>
              </div>

              {/* Property Link */}
              {selectedInquiry.property && (
                <>
                  <Separator />
                  <Button variant="outline" className="w-full" asChild>
                    <a
                      href={`/${company.slug}/property/${selectedInquiry.property.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Property Page
                    </a>
                  </Button>
                </>
              )}

              <Separator />

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button className="flex-1" asChild>
                  <a
                    href={`mailto:${selectedInquiry.email}?subject=Re: ${selectedInquiry.property?.title || "Your Inquiry"
                      }`}
                    onClick={() => {
                      if (selectedInquiry.status !== "Responded") {
                        updateStatus(selectedInquiry.id, "Responded");
                      }
                    }}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Reply via Email
                  </a>
                </Button>
                {selectedInquiry.phone && (
                  <Button variant="outline" className="flex-1" asChild>
                    <a href={`tel:${selectedInquiry.phone}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      Call
                    </a>
                  </Button>
                )}
              </div>

              {/* Mark as Responded */}
              {selectedInquiry.status !== "Responded" && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => updateStatus(selectedInquiry.id, "Responded")}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark as Responded
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
