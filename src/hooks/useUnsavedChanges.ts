import { useState, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { logNavigationEvent } from "@/lib/navigationLogger";

export const useUnsavedChanges = () => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const location = useLocation();

  // Reset unsaved changes when route changes
  useEffect(() => {
    setHasUnsavedChanges(false);
  }, [location.pathname]);

  const markAsUnsaved = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  const markAsSaved = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);

  const confirmNavigation = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );

      logNavigationEvent("nav.unsaved_prompt", {
        from: location.pathname,
        userConfirmed: confirmed,
      });

      resolve(confirmed);
    });
  }, [location.pathname]);

  return {
    hasUnsavedChanges,
    markAsUnsaved,
    markAsSaved,
    confirmNavigation,
  };
};
