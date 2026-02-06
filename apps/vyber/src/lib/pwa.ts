import { toast } from "@/lib/toast";

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  const { registerSW } = await import("virtual:pwa-register");

  const updateSW = registerSW({
    immediate: true,
    onOfflineReady() {
      toast("VybeR is ready for offline use.", { variant: "success" });
    },
    onNeedRefresh() {
      toast("New version available.", {
        variant: "info",
        actionLabel: "Refresh",
        onAction: () => updateSW(true),
        duration: 10000,
      });
    },
  });
}
