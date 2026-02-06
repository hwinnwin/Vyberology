import { useToastStore, type ToastVariant } from "@/stores/toast";

interface ToastOptions {
  variant?: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

export function toast(message: string, options: ToastOptions = {}) {
  return useToastStore.getState().addToast({
    message,
    variant: options.variant ?? "info",
    actionLabel: options.actionLabel,
    onAction: options.onAction,
    duration: options.duration,
  });
}
