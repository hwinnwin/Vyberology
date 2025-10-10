import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { isFeatureEnabled } from "@/lib/featureFlags";
import Index from "./pages/Index";
import Brand from "./pages/Brand";
import NumerologyReader from "./pages/NumerologyReader";
import Compatibility from "./pages/Compatibility";
import GetVybe from "./pages/GetVybe";
import NotFound from "./pages/NotFound";

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

const App = () => {
  const showHeader = isFeatureEnabled("nav.header.v1");

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            {showHeader && <AppHeader />}
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/brand" element={<Brand />} />
                <Route path="/numerology" element={<NumerologyReader />} />
                <Route path="/compatibility" element={<Compatibility />} />
                <Route path="/get-vybe" element={<GetVybe />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
