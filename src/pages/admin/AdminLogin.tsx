import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Loader2, Mail, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Simple session check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) checkAdminAndRedirect(session.user.id);
    });
  }, []);

  const checkAdminAndRedirect = async (userId: string) => {
    try {
      // Direct check, no fancy stuff
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "super_admin")
        .maybeSingle();

      if (data) {
        navigate("/admin");
      } else {
        console.warn("User logged in but not admin:", userId);
        toast({
          title: "Access Restricted",
          description: "You are logged in but do not have admin privileges.",
          variant: "destructive",
        });
      }
    } catch (e) {
      console.error("Admin check failed", e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (useMagicLink) {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: window.location.origin + "/admin",
          },
        });
        if (error) throw error;
        toast({
          title: "Magic Link Sent",
          description: "Check your email for the login link.",
        });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.session) {
          await checkAdminAndRedirect(data.user.id);
        }
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.message?.includes("security purposes") || error.status === 429) {
        toast({
          title: "Check your email",
          description: "A login link uses the email rate limit. Please check your inbox or wait a moment.",
        });
      } else {
        toast({
          title: "Login Failed",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Admin Access</CardTitle>
          <CardDescription>
            {useMagicLink ? "We'll send a login link to your email" : "Enter your credentials to continue"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="admin@rebal.site"
              />
            </div>

            {!useMagicLink && (
              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
              {useMagicLink ? "Send Magic Link" : "Sign In"}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setUseMagicLink(!useMagicLink)}
            >
              <Mail className="mr-2 h-4 w-4" />
              {useMagicLink ? "Use Password" : "Use Magic Link"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
