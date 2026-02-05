import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CantinaProvider } from "@/contexts/CantinaContext";
import { SystemProvider } from "@/contexts/SystemContext";
import Login from "./pages/Login";
import MainLayout from "./layouts/MainLayout";
import Clientes from "./pages/Clientes";
import Produtos from "./pages/Produtos";
import Colaboradores from "./pages/Colaboradores";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CantinaProvider>
        <SystemProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/dashboard" element={<MainLayout />}>
                <Route path="clientes" element={<Clientes />} />
                <Route path="produtos" element={<Produtos />} />
                <Route path="colaboradores" element={<Colaboradores />} />
                <Route path="geral" element={<Dashboard />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SystemProvider>
      </CantinaProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
