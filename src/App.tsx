import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { GroupProvider } from "./contexts/GroupContext";
import { ModalProvider } from "./contexts/ModalContext";
import Home from "./pages/Home";
import Tournament from "./pages/Tournament";
import MMR from "./pages/MMR";
import { JoinGroup } from "./pages/JoinGroup";
import { Settings } from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <GroupProvider>
          <ModalProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <Routes>
              {/* Redirect to MMR for index */}
              <Route path="/" element={<Navigate to="/mmr" replace />} />
              <Route path="/tournament" element={<Tournament />} />
              <Route path="/mmr" element={<MMR />} />
              <Route path="/home" element={<Home />} />
              <Route path="/join/:inviteId" element={<JoinGroup />} />
              <Route path="/settings" element={<Settings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </BrowserRouter>
          </ModalProvider>
        </GroupProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
