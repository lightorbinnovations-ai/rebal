import { Outlet } from "react-router-dom";

/**
 * Routing-only layout to group all public company routes under `/:companySlug/*`.
 * This avoids collisions with `/dashboard/...` paths like `/dashboard/properties`.
 */
const CompanyRouteLayout = () => {
  return <Outlet />;
};

export default CompanyRouteLayout;
