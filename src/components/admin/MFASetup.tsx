import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, ShieldCheck, Loader2, Copy, RefreshCw, Smartphone, QrCode } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MFAFactor {
  id: string;
  friendly_name?: string | null;
  factor_type: string;
  status: "verified" | "unverified";
  created_at: string;
  updated_at: string;
}

export function MFASetup() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUnenrolling, setIsUnenrolling] = useState(false);
  const [unenrollFactorId, setUnenrollFactorId] = useState<string | null>(null);
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [enrollmentData, setEnrollmentData] = useState<{
    id: string;
    qr_code: string;
    secret: string;
    uri: string;
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState("");

  useEffect(() => {
    fetchFactors();
  }, []);

  const fetchFactors = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      setFactors(data?.totp || []);
    } catch (error: any) {
      console.error("Error fetching MFA factors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async () => {
    setIsEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "REBAL Admin Authenticator",
      });

      if (error) throw error;

      setEnrollmentData({
        id: data.id,
        qr_code: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
      });
    } catch (error: any) {
      toast({
        title: "Enrollment failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleVerify = async () => {
    if (!enrollmentData || verificationCode.length !== 6) return;

    setIsVerifying(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enrollmentData.id,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollmentData.id,
        challengeId: challengeData.id,
        code: verificationCode,
      });

      if (verifyError) throw verifyError;

      toast({
        title: "MFA enabled successfully!",
        description: "Two-factor authentication is now active on your account.",
      });

      setEnrollmentData(null);
      setVerificationCode("");
      fetchFactors();
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: "Invalid code. Please try again.",
        variant: "destructive",
      });
      setVerificationCode("");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUnenrollVerify = async () => {
    if (!unenrollFactorId || verificationCode.length !== 6) return;

    setIsUnenrolling(true);
    try {
      // First, we need to challenge/verify to elevate session to AAL2
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: unenrollFactorId,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: unenrollFactorId,
        challengeId: challengeData.id,
        code: verificationCode,
      });

      if (verifyError) throw verifyError;

      // Now session is elevated, proceeding to unenroll
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: unenrollFactorId
      });

      if (unenrollError) throw unenrollError;

      toast({
        title: "MFA disabled",
        description: "Two-factor authentication has been removed.",
      });

      setUnenrollFactorId(null);
      setVerificationCode("");
      fetchFactors();
    } catch (error: any) {
      toast({
        title: "Failed to disable MFA",
        description: error.message || "Verification failed",
        variant: "destructive",
      });
      setVerificationCode("");
    } finally {
      setIsUnenrolling(false);
    }
  };

  const copySecret = () => {
    if (enrollmentData?.secret) {
      navigator.clipboard.writeText(enrollmentData.secret);
      toast({
        title: "Copied!",
        description: "Secret key copied to clipboard.",
      });
    }
  };

  const verifiedFactors = factors.filter((f) => f.status === "verified");
  const hasMFA = verifiedFactors.length > 0;

  if (isLoading) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Two-Factor Authentication (2FA)
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your admin account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center gap-3">
            {hasMFA ? (
              <ShieldCheck className="h-5 w-5 text-green-500" />
            ) : (
              <Shield className="h-5 w-5 text-amber-500" />
            )}
            <div>
              <p className="font-medium">
                {hasMFA ? "2FA is enabled" : "2FA is not enabled"}
              </p>
              <p className="text-sm text-muted-foreground">
                {hasMFA
                  ? "Your account is protected with an authenticator app"
                  : "Enable 2FA for enhanced security"}
              </p>
            </div>
          </div>
          <Badge variant={hasMFA ? "default" : "secondary"}>
            {hasMFA ? "Active" : "Inactive"}
          </Badge>
        </div>

        {/* MFA Warning for Admins */}
        {!hasMFA && !enrollmentData && (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <Shield className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              <strong>Recommended:</strong> As an admin, enabling 2FA is highly recommended to protect sensitive platform data.
            </AlertDescription>
          </Alert>
        )}

        {/* Unenrollment Verification Dialog/View */}
        {unenrollFactorId && (
          <div className="space-y-4 p-4 border border-destructive/20 bg-destructive/5 rounded-xl animate-in fade-in slide-in-from-top-2">
            <h4 className="font-semibold text-destructive flex items-center gap-2">
              <Shield className="h-4 w-4" /> Verify to Remove MFA
            </h4>
            <p className="text-sm text-muted-foreground">
              Please enter the code from your authenticator app to confirm disablement.
            </p>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={verificationCode}
                onChange={setVerificationCode}
                disabled={isUnenrolling}
                autoFocus
              >
                <InputOTPGroup className="bg-background">
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setUnenrollFactorId(null);
                  setVerificationCode("");
                }}
                disabled={isUnenrolling}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleUnenrollVerify}
                disabled={isUnenrolling || verificationCode.length !== 6}
              >
                {isUnenrolling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  "Confirm Remove"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Enrollment Flow */}
        {!hasMFA && !enrollmentData && (
          <Button onClick={handleEnroll} disabled={isEnrolling} className="w-full rounded-xl">
            {isEnrolling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                <Smartphone className="mr-2 h-4 w-4" />
                Set Up 2FA
              </>
            )}
          </Button>
        )}

        {/* QR Code & Verification */}
        {enrollmentData && (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-sm font-medium">
                <QrCode className="h-4 w-4" />
                Scan QR Code with Authenticator App
              </div>
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-xl shadow-sm">
                  <img
                    src={enrollmentData.qr_code}
                    alt="MFA QR Code"
                    className="w-48 h-48"
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Use Google Authenticator, Authy, or any TOTP app
              </p>
            </div>

            {/* Manual Secret */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-2">
              <p className="text-sm font-medium">Can't scan? Enter this key manually:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 rounded bg-muted text-sm font-mono break-all">
                  {enrollmentData.secret}
                </code>
                <Button variant="outline" size="icon" onClick={copySecret}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Verification */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-center">
                Enter the 6-digit code from your authenticator app:
              </p>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={verificationCode}
                  onChange={setVerificationCode}
                  disabled={isVerifying}
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
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => {
                    setEnrollmentData(null);
                    setVerificationCode("");
                  }}
                  disabled={isVerifying}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-xl"
                  onClick={handleVerify}
                  disabled={isVerifying || verificationCode.length !== 6}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Enable"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Existing Factors */}
        {verifiedFactors.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Active Authenticators</p>
            {verifiedFactors.map((factor) => (
              <div
                key={factor.id}
                className="flex items-center justify-between p-3 rounded-xl border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {factor.friendly_name || "Authenticator App"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Added {new Date(factor.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setUnenrollFactorId(factor.id)}
                  disabled={isUnenrolling || !!unenrollFactorId}
                >
                  {isUnenrolling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Remove"
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
