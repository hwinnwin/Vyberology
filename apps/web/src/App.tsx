import { lazy, Suspense, useEffect, ComponentType } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { useDeepLinks } from "@/hooks/useDeepLinks";
import { trackAnalyticsEvent } from "@/lib/analytics";

// Helper function to safely lazy load components with better error handling
const safeLazy = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  componentName?: string
) => {
  return lazy(() =>
    importFn()
      .then((module) => {
        // Ensure the module has a default export
        if (!module || !module.default) {
          console.error(`Module ${componentName || 'unknown'} does not have a default export`, module);
          throw new Error(`Invalid module: missing default export in ${componentName || 'component'}`);
        }
        return module;
      })
      .catch((error) => {
        console.error(`Error loading module ${componentName || 'unknown'}:`, error);
        // Return a fallback component that shows an error
        return {
          default: (() => (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lf-midnight via-lf-ink to-lf-midnight">
              <div className="text-center p-8">
                <p className="text-red-400 text-xl mb-4">Failed to load {componentName || 'component'}</p>
                <p className="text-lf-slate mb-6">Please try reloading the page</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-lf-gradient text-white rounded-lg hover:shadow-glow"
                >
                  Reload Page
                </button>
              </div>
            </div>
          )) as T,
        };
      })
  );
};

// Lazy load pages for better code splitting with safe lazy loading
const Index = safeLazy(() => import("./pages/Index"), "Index");
const Brand = safeLazy(() => import("./pages/Brand"), "Brand");
const NumerologyReader = safeLazy(() => import("./pages/NumerologyReader"), "NumerologyReader");
const Compatibility = safeLazy(() => import("./pages/Compatibility"), "Compatibility");
const GetVybe = safeLazy(() => import("./pages/GetVybe"), "GetVybe");
const History = safeLazy(() => import("./pages/History"), "History");
const Settings = safeLazy(() => import("./pages/Settings"), "Settings");
const Privacy = safeLazy(() => import("./pages/Privacy"), "Privacy");
const Terms = safeLazy(() => import("./pages/Terms"), "Terms");
const NotFound = safeLazy(() => import("./pages/NotFound"), "NotFound");

// Only load OcrDebug in development - use a no-op component in production
const OcrDebug = import.meta.env.DEV
  ? safeLazy(() => import("./dev/OcrDebug"), "OcrDebug")
  : lazy(() => Promise.resolve({ default: () => null }));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

// Router component with deep link support
const AppRouter = () => {
  const showHeader = isFeatureEnabled("nav.header.v1");

  // Initialize deep link handler
  useDeepLinks();

  return (
    <>
      {showHeader && <AppHeader />}
      <ErrorBoundary>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <LoadingSpinner size="lg" text="Loading..." />
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/brand" element={<Brand />} />
            <Route path="/numerology" element={<NumerologyReader />} />
            <Route path="/compatibility" element={<Compatibility />} />
            <Route path="/get-vybe" element={<GetVybe />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            {import.meta.env.DEV && <Route path="/dev/ocr" element={<OcrDebug />} />}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  );
};

const App = () => {
  useEffect(() => {
    void trackAnalyticsEvent("app_open", {
      platform: "web",
      pathname: window.location.pathname,
    });
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
