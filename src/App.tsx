import React, { useEffect, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";

import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";

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

import DriverLoginPage from "./pages/DriverLoginPage";
import DriverPreferencesPage from "./pages/DriverPreferencesPage";

import ResetPasswordPage from "./pages/ResetPasswordPage";
import SecurityQuestionsPage from "./pages/SecurityQuestionsPage";

import HealthCheck from "./pages/HealthCheck";
import Footer from "./components/Footer";

// Loading fallback
const LoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="text-center">
      <div className="mx-auto mb-4 h-32 w-32 animate-spin rounded-full border-b-2 border-primary" />
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
      <div className="flex min-h-screen flex-col">
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <div className="flex-1">
              <Routes>
                {/* Public */}
                <Route path="/" element={<HomePage />} />
                <Route path="/driver-login" element={<DriverLoginPage />} />
                <Route path="/driver-preferences" element={<DriverPreferencesPage />} />

                {/* Password reset flow (expects ?empId=1234567) */}
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/security-questions" element={<SecurityQuestionsPage />} />

                {/* Admin */}
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

                {/* Utilities */}
                <Route path="/health" element={<HealthCheck />} />

                {/* 404 */}
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
