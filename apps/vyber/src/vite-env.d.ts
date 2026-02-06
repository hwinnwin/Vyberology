/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare const __PWA__: boolean;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface Window {
  plausible?: (eventName: string, options?: { props?: Record<string, string> }) => void;
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
}
