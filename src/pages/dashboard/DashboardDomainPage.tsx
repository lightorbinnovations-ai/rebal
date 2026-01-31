import { DomainRequest } from "@/components/dashboard/DomainRequest";
import { AffiliateGuard } from "@/components/dashboard/AffiliateGuard";
import { useDashboard } from "@/contexts/DashboardContext";

const DashboardDomainPage = () => {
  const { company, user } = useDashboard();

  if (!company) {
    return <div>Loading...</div>;
  }

  return (
    <AffiliateGuard company={company} feature="Custom Domain">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Custom Domain</h1>
          <p className="text-muted-foreground">
            Get your own branded domain for your property website
          </p>
        </div>
        
        <DomainRequest 
          companyId={company.id} 
          companySlug={company.slug}
          companyName={company.name}
          userEmail={user?.email}
        />
      </div>
    </AffiliateGuard>
  );
};

export default DashboardDomainPage;
