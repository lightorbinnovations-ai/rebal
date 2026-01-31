import { useState, useEffect } from "react";

const ONBOARDING_KEY = "rebal_onboarding_completed";
const CHECKLIST_DISMISSED_KEY = "rebal_checklist_dismissed";

export const useOnboarding = (userId: string | undefined) => {
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showChecklist, setShowChecklist] = useState(true);

  useEffect(() => {
    if (!userId) return;

    // Check if onboarding was completed
    const onboardingCompleted = localStorage.getItem(`${ONBOARDING_KEY}_${userId}`);
    const checklistDismissed = localStorage.getItem(`${CHECKLIST_DISMISSED_KEY}_${userId}`);
    
    // Show modal for first-time users
    if (!onboardingCompleted) {
      setShowOnboardingModal(true);
    }
    
    // Show checklist unless dismissed
    setShowChecklist(!checklistDismissed);
  }, [userId]);

  const completeOnboarding = () => {
    if (userId) {
      localStorage.setItem(`${ONBOARDING_KEY}_${userId}`, "true");
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
