import { create } from "zustand";

export type ToastVariant = "info" | "success" | "warning" | "error";

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  dismissToast: (id: string) => void;
}

const toastTimeouts = new Map<string, number>();

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const duration = toast.duration ?? 5000;

    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    if (duration > 0) {
      const timeoutId = window.setTimeout(() => {
        get().dismissToast(id);
      }, duration);
      toastTimeouts.set(id, timeoutId);
    }

    return id;
  },
  dismissToast: (id) => {
    const timeoutId = toastTimeouts.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      toastTimeouts.delete(id);
    }
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
}));
