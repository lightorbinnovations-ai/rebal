import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useShortLinks, ShortLink } from "@/hooks/useShortLinks";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { UpgradePrompt } from "@/components/dashboard/UpgradePrompt";
import {
  Link2,
  Copy,
  Trash2,
  MousePointerClick,
  ExternalLink,
  QrCode,
  Check,
  Search,
  Loader2,
  Plus,
  Sparkles,
  AlertCircle,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { ShortLinkQRCode } from "@/components/marketing/ShortLinkQRCode";
import type { Company } from "@/types/company";

interface ShortLinksManagerProps {
  company: Company;
}

const customLinkSchema = z.object({
  destination: z.string()
    .min(1, "Destination URL is required")
    .regex(/^\//, "URL must start with /"),
  useCustomCode: z.boolean().default(false),
  customCode: z.string()
    .regex(/^[a-zA-Z0-9_-]*$/, "Only letters, numbers, hyphens, and underscores allowed")
    .optional(),
}).refine((data) => {
  if (data.useCustomCode && (!data.customCode || data.customCode.length < 3)) {
    return false;
  }
  return true;
}, {
  message: "Custom code must be at least 3 characters",
  path: ["customCode"],
}).refine((data) => {
  if (data.useCustomCode && data.customCode && data.customCode.length > 20) {
    return false;
  }
  return true;
}, {
  message: "Custom code must be 20 characters or less",
  path: ["customCode"],
});

type CustomLinkFormData = z.infer<typeof customLinkSchema>;

export const ShortLinksManager = ({ company }: ShortLinksManagerProps) => {
  const { shortLinks, isLoading, deleteShortLink, createShortLink, checkCodeAvailability } = useShortLinks(company.id);
  const { features, planName, isTrialing } = useSubscriptionLimits(company);
  const canUseCustomCodes = features.customShortCodes;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteLink, setDeleteLink] = useState<ShortLink | null>(null);
  const [qrLink, setQrLink] = useState<ShortLink | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [codeAvailable, setCodeAvailable] = useState<boolean | null>(null);

  const baseUrl = window.location.origin;

  const form = useForm<CustomLinkFormData>({
    resolver: zodResolver(customLinkSchema),
    defaultValues: {
      destination: "/",
      useCustomCode: false,
      customCode: "",
    },
  });

  const useCustomCode = form.watch("useCustomCode");
  const customCode = form.watch("customCode");

  // Check code availability with debounce
  useEffect(() => {
    if (!useCustomCode || !customCode || customCode.length < 3) {
      setCodeAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingCode(true);
      try {
        const available = await checkCodeAvailability(customCode);
        setCodeAvailable(available);
      } catch {
        setCodeAvailable(null);
      } finally {
        setIsCheckingCode(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [customCode, useCustomCode, checkCodeAvailability]);

  const filteredLinks = shortLinks.filter((link) =>
    link.full_path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    link.short_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalClicks = shortLinks.reduce((sum, link) => sum + link.click_count, 0);

  const handleCopy = async (link: ShortLink) => {
    const shortUrl = `${baseUrl}/r/${link.short_code}`;
    await navigator.clipboard.writeText(shortUrl);
    setCopiedId(link.id);
    toast.success("Link copied!", { description: shortUrl });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async () => {
    if (!deleteLink) return;
    
    try {
      await deleteShortLink.mutateAsync(deleteLink.id);
      setDeleteLink(null);
    } catch {
      // Error handled by hook
    }
  };

  const handleCreateLink = async (data: CustomLinkFormData) => {
    try {
      await createShortLink.mutateAsync({
        fullPath: data.destination,
        customCode: data.useCustomCode ? data.customCode : undefined,
      });
      setShowCreateDialog(false);
      form.reset();
      setCodeAvailable(null);
    } catch {
      // Error handled by hook
    }
  };

  const handleCloseCreateDialog = () => {
    setShowCreateDialog(false);
    form.reset();
    setCodeAvailable(null);
  };

  return (
    <div className="space-y-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Short Links</h1>
          <p className="text-sm text-muted-foreground">
            Manage and track your property short links
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto self-start">
          <Plus className="mr-2 h-4 w-4" />
          Create Custom Link
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Link2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold">{shortLinks.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Links</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <MousePointerClick className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold">{totalClicks}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Clicks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <QrCode className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold">
                  {shortLinks.length > 0 
                    ? (totalClicks / shortLinks.length).toFixed(1) 
                    : "0"}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Avg. Clicks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Links Table */}
      <Card className="border-border/50">
        <CardHeader className="px-4 sm:px-6">
          <div className="flex flex-col gap-4">
            <div>
              <CardTitle className="text-base sm:text-lg">All Short Links</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Click on any link to copy, or generate a QR code
              </CardDescription>
            </div>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search links..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredLinks.length === 0 ? (
            <div className="text-center py-12">
              <Link2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "No links found" : "No short links yet"}
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-4">
                {searchQuery 
                  ? "Try a different search term" 
                  : "Create short links from the Properties page or use the button above to create a custom link"}
              </p>
              {!searchQuery && (
                <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Link
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Short Link</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead className="text-center">Clicks</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLinks.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono text-xs">
                            /r/{link.short_code}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a
                          href={link.full_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 max-w-[200px] truncate"
                        >
                          {link.full_path}
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{link.click_count}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(link.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleCopy(link)}
                          >
                            {copiedId === link.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setQrLink(link)}
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteLink(link)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* Create Custom Link Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={handleCloseCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Custom Short Link</DialogTitle>
            <DialogDescription>
              Create a short link to any page. Optionally customize the short code.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateLink)} className="space-y-4">
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination Path</FormLabel>
                    <FormControl>
                      <Input placeholder={`/${company.slug}/property/...`} {...field} />
                    </FormControl>
                    <FormDescription>
                      The path to redirect to (e.g., /{company.slug})
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="useCustomCode"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-medium flex items-center gap-2">
                        Use Custom Code
                        {!canUseCustomCodes && (
                          <Badge variant="secondary" className="text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            Paid Plans
                          </Badge>
                        )}
                      </FormLabel>
                      <FormDescription className="text-xs">
                        {canUseCustomCodes 
                          ? "Create a memorable, branded short code"
                          : "Upgrade to a paid plan to use custom short codes"
                        }
                      </FormDescription>
                    </div>
                    <FormControl>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              onClick={() => {
                                if (!canUseCustomCodes) {
                                  setShowUpgradePrompt(true);
                                }
                              }}
                            >
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={!canUseCustomCodes}
                              />
                            </div>
                          </TooltipTrigger>
                          {!canUseCustomCodes && (
                            <TooltipContent>
                              <p>Click to see upgrade options</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </FormControl>
                  </FormItem>
                )}
              />

              {useCustomCode && (
                <FormField
                  control={form.control}
                  name="customCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Short Code</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            /r/
                          </span>
                          <Input 
                            placeholder="my-custom-link" 
                            className="pl-10 pr-10"
                            {...field} 
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {isCheckingCode ? (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : codeAvailable === true ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : codeAvailable === false ? (
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            ) : null}
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription className="flex items-center gap-2">
                        {codeAvailable === true && (
                          <span className="text-green-600 text-xs">✓ This code is available</span>
                        )}
                        {codeAvailable === false && (
                          <span className="text-destructive text-xs">✗ This code is already taken</span>
                        )}
                        {codeAvailable === null && field.value && field.value.length >= 3 && (
                          <span className="text-xs">Checking availability...</span>
                        )}
                        {(!field.value || field.value.length < 3) && (
                          <span className="text-xs">3-20 characters, letters, numbers, hyphens, underscores</span>
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Preview */}
              <div className="rounded-lg border border-border/50 p-3 bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">Preview</p>
                <p className="font-mono text-sm">
                  {baseUrl}/r/{useCustomCode && customCode ? customCode : <span className="text-muted-foreground italic">auto-generated</span>}
                </p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseCreateDialog}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createShortLink.isPending || (useCustomCode && codeAvailable === false)}
                >
                  {createShortLink.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : useCustomCode ? (
                    <Sparkles className="mr-2 h-4 w-4" />
                  ) : (
                    <Link2 className="mr-2 h-4 w-4" />
                  )}
                  Create Link
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteLink} onOpenChange={() => setDeleteLink(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Short Link</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this short link? Anyone using this link will no
              longer be able to access the property page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteShortLink.isPending}
            >
              {deleteShortLink.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Code Dialog */}
      <Dialog open={!!qrLink} onOpenChange={() => setQrLink(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code for Short Link</DialogTitle>
            <DialogDescription>
              Download this QR code for your printed marketing materials
            </DialogDescription>
          </DialogHeader>
          {qrLink && (
            <ShortLinkQRCode
              shortCode={qrLink.short_code}
              fullPath={qrLink.full_path}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Upgrade Prompt for Custom Short Codes */}
      <UpgradePrompt
        open={showUpgradePrompt}
        onOpenChange={setShowUpgradePrompt}
        featureKey="customShortCodes"
        currentPlan={planName}
      />
    </div>
  );
};
