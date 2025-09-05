import React, { useEffect, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import AdminPortalPage from "./pages/AdminPortalPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import DriverPreferencesPage from "./pages/DriverPreferencesPage";
import DriverLoginPage from "./pages/DriverLoginPage";
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
import { MigrationPage } from "./pages/admin/MigrationPage";
import { AdminRoute, DriverRoute, MasterAdminRoute } from "./components/auth/ProtectedRoute";

// Loading fallback
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
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/driver-login" element={<DriverLoginPage />} />
            <Route path="/admin-portal" element={<AdminPortalPage />} />
            
            {/* Protected Driver Routes */}
            <Route path="/driver-preferences" element={
              <DriverRoute>
                <DriverPreferencesPage />
              </DriverRoute>
            } />
            
            {/* Protected Admin Routes */}
            <Route path="/admin-dashboard" element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            } />
            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            } />
            <Route path="/admin/edit-drivers" element={
              <AdminRoute>
                <EditDriversPage />
              </AdminRoute>
            } />
            <Route path="/admin/edit-jobs" element={
              <AdminRoute>
                <EditJobsPage />
              </AdminRoute>
            } />
            <Route path="/admin/live-picks-snapshot" element={
              <AdminRoute>
                <LivePicksSnapshotPage />
              </AdminRoute>
            } />
            <Route path="/admin/final-assignments" element={
              <AdminRoute>
                <FinalAssignmentsPage />
              </AdminRoute>
            } />
            <Route path="/admin/conflict-resolution" element={
              <AdminRoute>
                <ConflictResolutionPage />
              </AdminRoute>
            } />
            <Route path="/admin/dispute-resolution" element={
              <AdminRoute>
                <DisputeResolutionPage />
              </AdminRoute>
            } />
            <Route path="/admin/statistics" element={
              <AdminRoute>
                <StatisticsPage />
              </AdminRoute>
            } />
            <Route path="/admin/activity-log" element={
              <AdminRoute>
                <ActivityLogPage />
              </AdminRoute>
            } />
            <Route path="/admin/system-settings" element={
              <AdminRoute>
                <SystemSettingsPage />
              </AdminRoute>
            } />
            <Route path="/admin/migration" element={
              <AdminRoute>
                <MigrationPage />
              </AdminRoute>
            } />
            
            {/* Master Admin Only Routes */}
            <Route path="/admin/master-admin" element={
              <MasterAdminRoute>
                <MasterAdminPage />
              </MasterAdminRoute>
            } />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
        <Toaster />
      </BrowserRouter>
    </TooltipProvider>
  );
}

export default App;