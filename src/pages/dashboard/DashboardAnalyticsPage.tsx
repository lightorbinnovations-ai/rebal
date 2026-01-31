import { AnalyticsDashboard } from "@/components/dashboard/AnalyticsDashboard";
import { AffiliateGuard } from "@/components/dashboard/AffiliateGuard";
import { useDashboard } from "@/contexts/DashboardContext";

const DashboardAnalyticsPage = () => {
  const { company } = useDashboard();

  return (
    <AffiliateGuard company={company} feature="Analytics">
      <AnalyticsDashboard company={company} />
    </AffiliateGuard>
  );
};

export default DashboardAnalyticsPage;
