import { ShortLinksManager } from "@/components/dashboard/ShortLinksManager";
import { AffiliateGuard } from "@/components/dashboard/AffiliateGuard";
import { useDashboard } from "@/contexts/DashboardContext";

const DashboardLinksPage = () => {
  const { company } = useDashboard();

  return (
    <AffiliateGuard company={company} feature="Short Links">
      <ShortLinksManager company={company} />
    </AffiliateGuard>
  );
};

export default DashboardLinksPage;
