import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { LoadingScreen } from "@/components/LoadingScreen";
import Auth from "./pages/Auth";
import Hub from "./pages/Hub";
import Financeiro from "./pages/Financeiro";
import Conciliacao from "./pages/Conciliacao";
import Comercial from "./pages/Comercial";
import DevisDetail from "./pages/DevisDetail";
import Operacao from "./pages/Operacao";
import Gestao from "./pages/Gestao";
import BI from "./pages/BI";
import Admin from "./pages/Admin";
import AceitarProposta from "./pages/AceitarProposta";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, userRole } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  if (userRole !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AuthRoute() {
  const { user } = useAuth();
  if (user) return <Navigate to="/hub" replace />;
  return <Auth />;
}

function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen message="Abrindo sistema..." />;
  return <Navigate to={user ? "/hub" : "/auth"} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<RootRoute />} />
            <Route path="/auth" element={<AuthRoute />} />
            <Route path="/proposta/aceite/:token" element={<AceitarProposta />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/hub" element={<Hub />} />
              <Route path="/financeiro" element={<Financeiro />} />
              <Route path="/conciliacao" element={<Conciliacao />} />
              <Route path="/comercial" element={<Comercial />} />
              <Route path="/comercial/devis/:id" element={<DevisDetail />} />
              <Route path="/operacao" element={<Operacao />} />
              <Route path="/gestao" element={<Gestao />} />
              <Route path="/bi" element={<BI />} />
              <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
