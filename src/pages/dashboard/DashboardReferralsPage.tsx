import { ReferralDashboard } from "@/components/dashboard/ReferralDashboard";
import { useDashboard } from "@/contexts/DashboardContext";

const DashboardReferralsPage = () => {
  const { company } = useDashboard();

  return <ReferralDashboard company={company} />;
};

export default DashboardReferralsPage;
