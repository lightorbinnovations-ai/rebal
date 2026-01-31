import { User, Building2, Shield, Check, Key, Loader2, Copy, ExternalLink } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { Company } from "@/types/company";
import { useState } from "react";

interface ProfileInfoSectionProps {
  user: SupabaseUser | null;
  company: Company;
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

export const ProfileInfoSection = ({ user, company }: ProfileInfoSectionProps) => {
  const { toast } = useToast();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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

  const getAuthProvider = () => {
    const provider = user?.app_metadata?.provider;
    if (provider === "google") return "Google";
    if (provider === "github") return "GitHub";
    return "Email";
  };

  const canChangePassword = user?.app_metadata?.provider === "email";

  return (
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
  );
};

export default ProfileInfoSection;
