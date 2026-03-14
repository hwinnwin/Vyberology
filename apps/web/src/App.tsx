import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { FeedbackButton } from "@/components/FeedbackButton";
import { InstallPrompt } from "@/components/InstallPrompt";
import NativeTabBar from "@/components/NativeTabBar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { useDeepLinks } from "@/hooks/useDeepLinks";
import { trackAnalyticsEvent } from "@/lib/analytics";

// Lazy load pages for better code splitting
const Index = lazy(() => import("./pages/Index"));
const Landing = lazy(() => import("./pages/Landing"));
const Compatibility = lazy(() => import("./pages/Compatibility"));
const GetVybe = lazy(() => import("./pages/GetVybe"));
const History = lazy(() => import("./pages/History"));
const Settings = lazy(() => import("./pages/Settings"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Pricing = lazy(() => import("./pages/Pricing"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCancel = lazy(() => import("./pages/PaymentCancel"));
const LyfPath = lazy(() => import("./pages/LyfPath"));
const CareerOutlook = lazy(() => import("./pages/CareerOutlook"));
const RomanceOutlook = lazy(() => import("./pages/RomanceOutlook"));
const Auth = lazy(() => import("./pages/Auth"));
const NumerologyReader = lazy(() => import("./pages/NumerologyReader"));
const ReadingResult = lazy(() => import("./pages/ReadingResult"));
const SharedReading = lazy(() => import("./pages/SharedReading"));

// V2 Pages (Mystic Minimal)
const V2Share = lazy(() => import("./pages/v2/V2Share"));
const V2Demo = lazy(() => import("./components/v2/demo/V2Demo"));

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
            {/* Main Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/compatibility" element={<Compatibility />} />
            <Route path="/get-vybe" element={<GetVybe />} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/lyf-path" element={<LyfPath />} />
            <Route path="/career" element={<CareerOutlook />} />
            <Route path="/romance" element={<RomanceOutlook />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/numerology" element={<NumerologyReader />} />
            <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
            <Route path="/payment/cancel" element={<PaymentCancel />} />
            {/* V2 Demo & Share */}
            <Route path="/v2/share" element={<V2Share />} />
            <Route path="/v2/demo" element={<V2Demo />} />

            {/* Reading Results */}
            <Route path="/reading/:readingId" element={<ProtectedRoute><ReadingResult /></ProtectedRoute>} />
            <Route path="/r/:slug" element={<SharedReading />} />

          </Routes>
        </Suspense>
      </ErrorBoundary>
      <NativeTabBar />
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
          <AuthProvider>
            <BrowserRouter>
              <AppRouter />
              <FeedbackButton />
              <InstallPrompt />
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
