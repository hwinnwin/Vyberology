import { lazy, Suspense, useEffect } from "react";
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

// Lazy load pages for better code splitting
const Index = lazy(() => import("./pages/Index"));
const Brand = lazy(() => import("./pages/Brand"));
const NumerologyReader = lazy(() => import("./pages/NumerologyReader"));
const Compatibility = lazy(() => import("./pages/Compatibility"));
const GetVybe = lazy(() => import("./pages/GetVybe"));
const History = lazy(() => import("./pages/History"));
const Settings = lazy(() => import("./pages/Settings"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Daily = lazy(() => import("./pages/Daily"));
const OcrDebug = import.meta.env.DEV ? lazy(() => import("./dev/OcrDebug")) : null;

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
            <Route path="/daily" element={<Daily />} />
            {import.meta.env.DEV && OcrDebug && <Route path="/dev/ocr" element={<OcrDebug />} />}
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
