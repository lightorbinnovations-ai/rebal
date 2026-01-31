import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { useOnboarding } from "@/hooks/useOnboarding";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CompanyOnboarding } from "@/components/dashboard/CompanyOnboarding";
import { OnboardingModal } from "@/components/dashboard/OnboardingModal";
import { SubscriptionWizard, useSubscriptionWizard } from "@/components/dashboard/SubscriptionWizard";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { DashboardSkeleton } from "@/components/ui/skeletons";

const Dashboard = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  const { user, isLoading: authLoading, signOut } = useAuth();
  const { company, isLoading: companyLoading, refetch } = useCompany(user?.id);
  const {
    showOnboardingModal,
    showChecklist,
    completeOnboarding,
    dismissChecklist,
    reopenOnboarding,
  } = useOnboarding(user?.id, company);
  const { showWizard, closeWizard, userId: wizardUserId } = useSubscriptionWizard(user?.id, company);
  const navigate = useNavigate();

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  // Show loading skeleton while auth is being determined
  if (authLoading) {
    return <DashboardSkeleton />;
  }

  // If not authenticated, the useAuth hook will redirect to /auth
  // Show loading while redirect is happening
  if (!user) {
    return <DashboardSkeleton />;
  }

  // Show loading while company is being fetched
  if (companyLoading) {
    return <DashboardSkeleton />;
  }

  // Show onboarding if user has no company
  if (!company) {
    return <CompanyOnboarding userId={user.id} userEmail={user.email} onComplete={refetch} />;
  }

  return (
    <DashboardProvider
      value={{
        user,
        company,
        refetchCompany: refetch,
        showChecklist,
        dismissChecklist,
        reopenOnboarding,
        isDark,
        toggleTheme,
        signOut,
      }}
    >
      <DashboardLayout
        user={user}
        company={company}
        isDark={isDark}
        toggleTheme={toggleTheme}
        onSignOut={signOut}
        onShowHelp={reopenOnboarding}
      >
        <Outlet />
      </DashboardLayout>

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboardingModal}
        onClose={completeOnboarding}
        onComplete={completeOnboarding}
      />

      {/* Subscription Recommendation Wizard - Shows after onboarding */}
      {!showOnboardingModal && (
        <SubscriptionWizard
          isOpen={showWizard}
          onClose={closeWizard}
          userId={user?.id}
          onSelectPlan={(planId) => {
            closeWizard();
            // Navigate to settings page with plan tab
            navigate("/dashboard/settings");
          }}
        />
      )}
    </DashboardProvider>
  );
};

export default Dashboard;