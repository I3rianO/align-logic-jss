import React, { useEffect, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";

import HomePage from "./pages/HomePage";
import DriverLoginPage from "./pages/DriverLoginPage";
import DriverPreferencesPage from "./pages/DriverPreferencesPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";     // ✅ already present
import SecurityQuestionsPage from "./pages/SecurityQuestionsPage"; // ✅ NEW

import AdminPortalPage from "./pages/AdminPortalPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import EditDriversPage from "./pages/admin/EditDriversPage";
import EditJobsPage from "./pages/admin/EditJobsPage";
import LivePicksSnapshotPage from "./pages/admin/LivePicksSnapshotPage";
import FinalAssignmentsPage from "./pages/admin/FinalAssignmentsPage";
import StatisticsPage from "./pages/admin/StatisticsPage";
import ConflictResolutionPage from "./pages/admin/ConflictResolutionPage";
import DisputeResolutionPage from "./pages/admin/DisputeResolutionPage";
import ActivityLogPage from "./pages/admin/ActivityLogPage";
import SystemSettingsPage from "./pages/admin/SystemSettingsPage";
import MasterAdminPage from "./pages/admin/MasterAdminPage";
import HealthCheck from "./pages/HealthCheck";
import NotFoundPage from "./pages/NotFoundPage";
import Footer from "./components/Footer";

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
      <h2 className="text-xl font-semibold">Loading...</h2>
      <p className="text-muted-foreground">Please wait while the app initializes</p>
    </div>
  </div>
);

function App() {
  useEffect(() => {
    console.log("App component mounted");
  }, []);

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen">
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <div className="flex-1">
              <Routes>
                {/* Public / Driver routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/driver-login" element={<DriverLoginPage />} />
                <Route path="/driver-preferences" element={<DriverPreferencesPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/security-questions" element={<SecurityQuestionsPage />} /> {/* ✅ NEW */}

                {/* Admin routes */}
                <Route path="/admin-portal" element={<AdminPortalPage />} />
                <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/admin/edit-drivers" element={<EditDriversPage />} />
                <Route path="/admin/edit-jobs" element={<EditJobsPage />} />
                <Route path="/admin/live-picks-snapshot" element={<LivePicksSnapshotPage />} />
                <Route path="/admin/final-assignments" element={<FinalAssignmentsPage />} />
                <Route path="/admin/conflict-resolution" element={<ConflictResolutionPage />} />
                <Route path="/admin/dispute-resolution" element={<DisputeResolutionPage />} />
                <Route path="/admin/statistics" element={<StatisticsPage />} />
                <Route path="/admin/activity-log" element={<ActivityLogPage />} />
                <Route path="/admin/system-settings" element={<SystemSettingsPage />} />
                <Route path="/admin/master-admin" element={<MasterAdminPage />} />

                {/* Health + 404 */}
                <Route path="/health" element={<HealthCheck />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </div>
          </Suspense>
          <Toaster />
        </BrowserRouter>

        <Footer />
      </div>
    </TooltipProvider>
  );
}

export default App;
