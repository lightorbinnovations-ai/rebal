import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Loader2, Lock, ShieldCheck, KeyRound, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AdminLockScreenProps {
    onUnlock: () => void;
}

export function AdminLockScreen({ onUnlock }: AdminLockScreenProps) {
    const { user, signOut } = useAdminAuth(false);
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [mfaCode, setMfaCode] = useState("");
    const [hasMFA, setHasMFA] = useState(false);
    const [authMethod, setAuthMethod] = useState<"password" | "mfa">("password");

    useEffect(() => {
        checkMFAStatus();
    }, []);

    const checkMFAStatus = async () => {
        try {
            const { data, error } = await supabase.auth.mfa.listFactors();
            if (error) throw error;
            const verifiedFactors = data?.totp?.filter(f => f.status === 'verified') || [];
            const isMFAEnabled = verifiedFactors.length > 0;
            setHasMFA(isMFAEnabled);
            // Default to MFA if enabled
            if (isMFAEnabled) setAuthMethod("mfa");
        } catch (e) {
            console.error("Error checking MFA:", e);
        }
    };

    const handleUnlock = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setIsLoading(true);

        try {
            if (authMethod === "mfa") {
                if (mfaCode.length !== 6) return;

                // Challenge and Verify MFA
                const { data: factors } = await supabase.auth.mfa.listFactors();
                const totpFactor = factors?.totp.find(f => f.status === 'verified');

                if (!totpFactor) throw new Error("No MFA factor found");

                const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
                    factorId: totpFactor.id
                });

                if (challengeError) throw challengeError;

                const { error: verifyError } = await supabase.auth.mfa.verify({
                    factorId: totpFactor.id,
                    challengeId: challengeData.id,
                    code: mfaCode
                });

                if (verifyError) throw verifyError;

                // Success
                toast({ title: "Session Unlocked" });
                onUnlock();

            } else {
                // Password Unlock
                if (!user?.email) return;

                const { error } = await supabase.auth.signInWithPassword({
                    email: user.email,
                    password: password
                });

                if (error) throw error;

                toast({ title: "Session Unlocked" });
                onUnlock();
            }
        } catch (error: any) {
            toast({
                title: "Unlock Failed",
                description: error.message || "Invalid credentials",
                variant: "destructive"
            });
            setPassword("");
            setMfaCode("");
        } finally {
            setIsLoading(false);
        }
    };

    // if (!user) return null; // REMOVED to prevent hidden lock screen during initial load

    return (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
            <Card className="w-full max-w-md shadow-2xl border-primary/20 bg-card/95">
                <CardHeader className="text-center space-y-4 pb-2">
                    {!user ? (
                        <div className="mx-auto w-20 h-20 flex items-center justify-center mb-2">
                            <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        </div>
                    ) : (
                        <div className="mx-auto bg-muted rounded-full p-4 w-20 h-20 flex items-center justify-center mb-2 ring-4 ring-background shadow-xl">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={user.user_metadata?.avatar_url} />
                                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                                    {user.email?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    )}

                    <div>
                        <CardTitle className="text-xl">
                            {user ? "Welcome Back" : "Restoring Session..."}
                        </CardTitle>
                        <CardDescription>
                            {user ? user.email : "Please wait while we verify your session"}
                        </CardDescription>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground bg-muted/50 py-1.5 px-3 rounded-full w-fit mx-auto">
                        <Lock className="h-3 w-3" />
                        Session Locked due to inactivity
                    </div>
                </CardHeader>

                <CardContent className="space-y-6 pt-4">
                    {/* Only show form when user is loaded, otherwise just show loading state or skeleton */}
                    {!user ? (
                        <div className="space-y-4">
                            <div className="h-10 bg-muted/50 rounded-md animate-pulse" />
                            <div className="h-11 bg-muted/50 rounded-md animate-pulse" />
                        </div>
                    ) : (
                        <form onSubmit={handleUnlock} className="space-y-4">
                            {authMethod === "mfa" ? (
                                <div className="space-y-4">
                                    <div className="flex justify-center">
                                        <InputOTP
                                            maxLength={6}
                                            value={mfaCode}
                                            onChange={setMfaCode}
                                            disabled={isLoading}
                                            autoFocus
                                        >
                                            <InputOTPGroup>
                                                <InputOTPSlot index={0} />
                                                <InputOTPSlot index={1} />
                                                <InputOTPSlot index={2} />
                                                <InputOTPSlot index={3} />
                                                <InputOTPSlot index={4} />
                                                <InputOTPSlot index={5} />
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </div>
                                    <p className="text-xs text-center text-muted-foreground">
                                        Enter code from your authenticator app
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Input
                                        type="password"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLoading}
                                        autoFocus
                                    />
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-11 text-base"
                                disabled={isLoading || (authMethod === 'mfa' ? mfaCode.length !== 6 : !password)}
                            >
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <div className="flex items-center">
                                        {authMethod === 'mfa' ? (
                                            <ShieldCheck className="mr-2 h-4 w-4" />
                                        ) : (
                                            <KeyRound className="mr-2 h-4 w-4" />
                                        )}
                                        Unlock Session
                                    </div>
                                )}
                            </Button>
                        </form>
                    )}

                    <div className="flex items-center justify-between text-sm">
                        {/* Only show MFA toggle if user is loaded and we checked MFA status */}
                        {user && hasMFA && (
                            <button
                                type="button"
                                onClick={() => setAuthMethod(authMethod === 'mfa' ? 'password' : 'mfa')}
                                className="text-primary hover:underline hover:text-primary/80 transition-colors"
                            >
                                Use {authMethod === 'mfa' ? 'Password' : 'Authenticator'}
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={signOut}
                            className="text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors ml-auto"
                        >
                            <LogOut className="h-3 w-3" />
                            Sign Out
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
