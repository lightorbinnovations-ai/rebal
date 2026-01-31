import { InquiriesList } from "@/components/dashboard/InquiriesList";
import { AffiliateGuard } from "@/components/dashboard/AffiliateGuard";
import { useDashboard } from "@/contexts/DashboardContext";

const DashboardInquiriesPage = () => {
  const { company } = useDashboard();

  return (
    <AffiliateGuard company={company} feature="Inquiries">
      <InquiriesList company={company} />
    </AffiliateGuard>
  );
};

export default DashboardInquiriesPage;
