import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Company } from "@/types/company";

const ONBOARDING_KEY = "rebal_onboarding_completed";
const CHECKLIST_DISMISSED_KEY = "rebal_checklist_dismissed";

export const useOnboarding = (userId: string | undefined, company: Company | null) => {
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showChecklist, setShowChecklist] = useState(true);

  useEffect(() => {
    if (!userId || !company) return;

    // Check localStorage first (fastest)
    const localCompleted = localStorage.getItem(`${ONBOARDING_KEY}_${userId}`);
    const checklistDismissed = localStorage.getItem(`${CHECKLIST_DISMISSED_KEY}_${userId}`);

    // Check DB status (definitive)
    const dbCompleted = company.onboarding_completed;

    // Show modal ONLY if NOT completed in DB AND NOT completed locally
    // This prevents it from showing if they finished it on another device (DB true)
    // or finished it here (Local true)
    if (!localCompleted && !dbCompleted) {
      setShowOnboardingModal(true);
    }

    // Sync Local state if DB says it's done (so we don't check DB every time)
    if (dbCompleted && !localCompleted) {
      localStorage.setItem(`${ONBOARDING_KEY}_${userId}`, "true");
    }

    // Show checklist unless dismissed
    setShowChecklist(!checklistDismissed);
  }, [userId, company]);

  const completeOnboarding = async () => {
    if (userId) {
      // 1. Save to LocalStorage (Instant UI update)
      localStorage.setItem(`${ONBOARDING_KEY}_${userId}`, "true");

      // 2. Save to Database (Persistent across devices)
      if (company && !company.onboarding_completed) {
        try {
          // We assume 'companies' table has 'onboarding_completed' boolean column matches boolean type 
          // based on types/company.ts interface
          await supabase
            .from("companies")
            .update({ onboarding_completed: true })
            .eq("id", company.id);
        } catch (err) {
          console.error("Failed to sync onboarding status", err);
        }
      }
    }
    setShowOnboardingModal(false);
  };

  const dismissChecklist = () => {
    if (userId) {
      localStorage.setItem(`${CHECKLIST_DISMISSED_KEY}_${userId}`, "true");
    }
    setShowChecklist(false);
  };

  const reopenOnboarding = () => {
    setShowOnboardingModal(true);
  };

  const resetOnboarding = () => {
    if (userId) {
      localStorage.removeItem(`${ONBOARDING_KEY}_${userId}`);
      localStorage.removeItem(`${CHECKLIST_DISMISSED_KEY}_${userId}`);
    }
    setShowChecklist(true);
  };

  return {
    showOnboardingModal,
    showChecklist,
    completeOnboarding,
    dismissChecklist,
    reopenOnboarding,
    resetOnboarding,
  };
};
