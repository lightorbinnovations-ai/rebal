import { PropertyForm } from "@/components/dashboard/PropertyForm";
import { ProfileCompletionGuard } from "@/components/dashboard/ProfileCompletionGuard";
import { useDashboard } from "@/contexts/DashboardContext";

const DashboardPropertyFormPage = () => {
  const { company } = useDashboard();

  return (
    <ProfileCompletionGuard company={company} requiredFor="properties">
      <PropertyForm company={company} />
    </ProfileCompletionGuard>
  );
};

export default DashboardPropertyFormPage;
