import { AccountSettings } from "@/components/dashboard/AccountSettings";
import { useDashboard } from "@/contexts/DashboardContext";

const DashboardSettingsPage = () => {
  const { user, company, refetchCompany } = useDashboard();

  return <AccountSettings user={user} company={company} onUpdate={refetchCompany} />;
};

export default DashboardSettingsPage;
