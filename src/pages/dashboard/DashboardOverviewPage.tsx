import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { useDashboard } from "@/contexts/DashboardContext";

const DashboardOverviewPage = () => {
  const { company, showChecklist, dismissChecklist } = useDashboard();

  return (
    <DashboardOverview
      company={company}
      showChecklist={showChecklist}
      onDismissChecklist={dismissChecklist}
    />
  );
};

export default DashboardOverviewPage;
