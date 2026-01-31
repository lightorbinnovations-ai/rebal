import { createContext, useContext, ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import type { Company } from "@/types/company";

interface DashboardContextValue {
  user: User;
  company: Company;
  refetchCompany: () => void;
  showChecklist: boolean;
  dismissChecklist: () => void;
  reopenOnboarding: () => void;
  isDark: boolean;
  toggleTheme: () => void;
  signOut: () => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export const DashboardProvider = ({
  children,
  value,
}: {
  children: ReactNode;
  value: DashboardContextValue;
}) => {
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};
