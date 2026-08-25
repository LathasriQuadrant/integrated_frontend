import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Explorer from "./pages/Explorer";
import WorkspaceSelection from "./pages/WorkspaceSelection";
import Migration from "./pages/Migration";
import ReportViewer from "./pages/ReportViewer";
import History from "./pages/History";
import Preview from "./pages/Preview";
import PreMigrationAnalysis from "./pages/PreMigrationAnalysis";
import NotFound from "./pages/NotFound";
import PowerBIAuthSuccess from "./components/workspace/PowerBIAuthSuccess";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/explore/:sourceId" element={<Explorer />} />
            <Route path="/workspace-selection" element={<WorkspaceSelection />} />
            <Route path="/powerbi-auth-success" element={<PowerBIAuthSuccess />} />
            <Route path="/migrate/:migrationId" element={<Migration />} />
            <Route path="/report/:reportId" element={<ReportViewer />} />
            <Route path="/history" element={<History />} />
            <Route path="/preview" element={<Preview />} />
            <Route path="/pre-migration-analysis" element={<PreMigrationAnalysis />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
