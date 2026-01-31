import { Gift } from "lucide-react";

interface ReferralBadgeProps {
  referralCode: string | null;
  referrerName: string | null;
}

export const ReferralBadge = ({ referralCode, referrerName }: ReferralBadgeProps) => {
  if (!referralCode && !referrerName) return null;
  
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
      <Gift className="h-4 w-4" />
      {referrerName ? `Referred by: ${referrerName}` : `Referral: ${referralCode}`}
    </div>
  );
};
