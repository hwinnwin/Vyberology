import { useEffect } from "react";
import { toast } from "@/lib/toast";

export function NetworkStatusListener() {
  useEffect(() => {
    const handleOnline = () => {
      toast("Back online.", { variant: "success", duration: 3000 });
    };

    const handleOffline = () => {
      toast("You are offline. Some features may be unavailable.", {
        variant: "warning",
        duration: 5000,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return null;
}
