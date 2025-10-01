import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProjectsProvider } from "@/contexts/ProjectsContext";
import { AuthGuard } from "@/components/AuthGuard";
import Index from "./pages/Index";
import ComparativoGeral from "./pages/ComparativoGeral";
import PublicReport from "./pages/PublicReport";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthGuard>
      <ProjectsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/comparativo-geral" element={<ComparativoGeral />} />
              <Route path="/report/:reportId" element={<PublicReport />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ProjectsProvider>
    </AuthGuard>
  </QueryClientProvider>
);

export default App;
