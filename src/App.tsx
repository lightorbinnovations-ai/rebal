import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CustomDomainProvider } from "@/contexts/CustomDomainContext";
import { CustomDomainWrapper } from "@/components/CustomDomainWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MaintenanceGuard } from "@/components/MaintenanceGuard";
import { SuspendedGuard } from "@/components/SuspendedGuard";
import Index from "./pages/Index";
import AdminDebug from "./pages/admin/AdminDebug";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Dashboard from "./pages/DashboardWrapper";
import CompanyPage from "./pages/CompanyPage";
import CompanyPropertiesPage from "./pages/CompanyPropertiesPage";
import CompanyAboutPage from "./pages/CompanyAboutPage";
import CompanyContactPage from "./pages/CompanyContactPage";
import CompanyServicesPage from "./pages/CompanyServicesPage";
import PropertyDetailsPage from "./pages/PropertyDetailsPage";
import CompanyRouteLayout from "./pages/CompanyRouteLayout";
import PropertiesPage from "./pages/PropertiesPage";
import PropertyRedirect from "./pages/PropertyRedirect";
import ShortLinkRedirect from "./pages/ShortLinkRedirect";
import {
  DashboardOverviewPage,
  DashboardPropertiesPage,
  DashboardPropertyFormPage,
  DashboardInquiriesPage,
  DashboardAnalyticsPage,
  DashboardReferralsPage,
  DashboardBrandingPage,
  DashboardSettingsPage,
  DashboardHelpPage,
  DashboardLinksPage,
  DashboardSavedSearchesPage,
  DashboardDomainPage,
} from "./pages/dashboard/index";
import {
  AdminLogin,
  AdminDashboard,
  AdminUsers,
  AdminCompanies,
  AdminProperties,
  AdminDomains,
  AdminPayments,
  AdminReferrals,
  AdminWithdrawals,
  AdminAnalytics,
  AdminContent,
  AdminNotifications,
  AdminSettings,
  AdminSupport,
  AdminVerifications,
} from "./pages/admin";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <CustomDomainProvider>
              <CustomDomainWrapper>
                <Routes>
                  {/* Wrap all public routes in MaintenanceGuard */}
                  <Route element={<MaintenanceGuard />}>
                    <Route path="/" element={<Index />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />

                    {/* Public Marketplace Routes */}
                    <Route path="/properties" element={<PropertiesPage />} />
                    <Route path="/properties/:propertySlug" element={<PropertyRedirect />} />
                    <Route path="/r/:shortCode" element={<ShortLinkRedirect />} />



                    <Route element={<SuspendedGuard />}>
                      {/* Dashboard (User Side) - User might want this blocked or allowed? Usually blocked if whole site down */}
                      <Route path="/dashboard" element={<Dashboard />}>
                        <Route index element={<DashboardOverviewPage />} />
                        <Route path="properties" element={<DashboardPropertiesPage />} />
                        <Route path="properties/new" element={<DashboardPropertyFormPage />} />
                        <Route path="properties/:propertyId/edit" element={<DashboardPropertyFormPage />} />
                        <Route path="links" element={<DashboardLinksPage />} />
                        <Route path="inquiries" element={<DashboardInquiriesPage />} />
                        <Route path="analytics" element={<DashboardAnalyticsPage />} />
                        <Route path="referrals" element={<DashboardReferralsPage />} />
                        <Route path="saved-searches" element={<DashboardSavedSearchesPage />} />
                        <Route path="branding" element={<DashboardBrandingPage />} />
                        <Route path="domain" element={<DashboardDomainPage />} />
                        <Route path="settings" element={<DashboardSettingsPage />} />
                        <Route path="help" element={<DashboardHelpPage />} />
                      </Route>

                      {/* Public company routes - Allow access even if suspended? Probably block EDITING but allow public view? 
                      User requested blocking "page" so likely dashboard access. Public routes should probably remain visible unless hard block.
                      For now, blocking dashboard access is the key 'access to the page' user requested. 
                  */}
                    </Route>

                    {/* Public company routes */}
                    <Route path="/:companySlug" element={<CompanyRouteLayout />}>
                      <Route index element={<CompanyPage />} />
                      <Route path="properties" element={<CompanyPropertiesPage />} />
                      <Route path="services" element={<CompanyServicesPage />} />
                      <Route path="about" element={<CompanyAboutPage />} />
                      <Route path="contact" element={<CompanyContactPage />} />
                      <Route path="property/:propertySlug" element={<PropertyDetailsPage />} />
                    </Route>
                  </Route>

                  {/* Auth Routes - Always accessible */}
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/auth/reset-password" element={<ResetPassword />} />

                  {/* Admin Routes - Always accessible (guarded by AdminLogin internals) */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin/debug" element={<AdminDebug />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/companies" element={<AdminCompanies />} />
                  <Route path="/admin/properties" element={<AdminProperties />} />
                  <Route path="/admin/domains" element={<AdminDomains />} />
                  <Route path="/admin/payments" element={<AdminPayments />} />
                  <Route path="/admin/referrals" element={<AdminReferrals />} />
                  <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
                  <Route path="/admin/analytics" element={<AdminAnalytics />} />
                  <Route path="/admin/content" element={<AdminContent />} />
                  <Route path="/admin/notifications" element={<AdminNotifications />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                  <Route path="/admin/support" element={<AdminSupport />} />
                  <Route path="/admin/verifications" element={<AdminVerifications />} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </CustomDomainWrapper>
            </CustomDomainProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
