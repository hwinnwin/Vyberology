import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { isFeatureEnabled } from "@/lib/featureFlags";
import Index from "./pages/Index";
import Brand from "./pages/Brand";
import NumerologyReader from "./pages/NumerologyReader";
import Compatibility from "./pages/Compatibility";
import GetVybe from "./pages/GetVybe";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const showHeader = isFeatureEnabled("nav.header.v1");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {showHeader && <AppHeader />}
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/brand" element={<Brand />} />
            <Route path="/numerology" element={<NumerologyReader />} />
            <Route path="/compatibility" element={<Compatibility />} />
            <Route path="/get-vybe" element={<GetVybe />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
