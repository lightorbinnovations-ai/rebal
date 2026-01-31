import { PropertiesList } from "@/components/dashboard/PropertiesList";
import { ProfileCompletionGuard } from "@/components/dashboard/ProfileCompletionGuard";
import { useDashboard } from "@/contexts/DashboardContext";

const DashboardPropertiesPage = () => {
  const { company } = useDashboard();

  return (
    <ProfileCompletionGuard company={company} requiredFor="properties">
      <PropertiesList company={company} />
    </ProfileCompletionGuard>
  );
};

export default DashboardPropertiesPage;
