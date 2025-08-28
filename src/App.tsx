import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Existing pages
import HomePage from "./pages/HomePage";
import DriverLoginPage from "./pages/DriverLoginPage";
import DriverPreferencesPage from "./pages/DriverPreferencesPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SecurityQuestionsPage from "./pages/SecurityQuestionsPage";

// NEW: set-new-password endpoint (prevents 404)
import SetNewPasswordPage from "./pages/SetNewPasswordPage";

// Optional: a simple not-found
function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-3xl font-semibold">404 — Page Not Found</h1>
      <p className="mt-3 text-slate-600">
        The page you’re looking for doesn’t exist or has moved.
      </p>
      <a
        href="/"
        className="mt-6 inline-flex items-center rounded-md bg-slate-800 px-4 py-2 text-white hover:bg-slate-700"
      >
        Return Home
      </a>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home / Landing */}
        <Route path="/" element={<HomePage />} />

        {/* Driver login and preferences */}
        <Route path="/driver-login" element={<DriverLoginPage />} />
        <Route path="/driver-preferences" element={<DriverPreferencesPage />} />

        {/* Reset password flow */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/security-questions" element={<SecurityQuestionsPage />} />

        {/* NEW: destination after answering security questions */}
        <Route path="/set-new-password" element={<SetNewPasswordPage />} />

        {/* Fallbacks */}
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
