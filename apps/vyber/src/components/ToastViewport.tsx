import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";
import { useToastStore, type ToastVariant } from "@/stores/toast";
import { cn } from "@/lib/utils";

const variantStyles: Record<ToastVariant, { icon: typeof Info; className: string }> = {
  info: { icon: Info, className: "border-border bg-secondary text-foreground" },
  success: { icon: CheckCircle2, className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" },
  warning: { icon: AlertTriangle, className: "border-amber-500/40 bg-amber-500/10 text-amber-200" },
  error: { icon: XCircle, className: "border-red-500/40 bg-red-500/10 text-red-200" },
};

export function ToastViewport() {
  const { toasts, dismissToast } = useToastStore();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => {
        const { icon: Icon, className } = variantStyles[toast.variant];
        return (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur",
              "animate-toast-in",
              className
            )}
          >
            <div className="mt-0.5">
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 text-sm">{toast.message}</div>
            {toast.actionLabel && toast.onAction && (
              <button
                className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                onClick={() => {
                  toast.onAction?.();
                  dismissToast(toast.id);
                }}
              >
                {toast.actionLabel}
              </button>
            )}
            <button
              className="rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
