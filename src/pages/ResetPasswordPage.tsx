import React from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const empId = params.get("empId") ?? "";

  const handleReset = () => {
    if (!empId) {
      // No employee id in the URL; send them back to login
      navigate("/driver-login");
      return;
    }
    // Hand off to the Security Questions flow and carry the empId through.
    navigate(`/security-questions?empId=${encodeURIComponent(empId)}`);
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          <div className="px-6 py-8 sm:px-10">
            <h1 className="text-2xl font-semibold tracking-tight">Reset Your Password</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Answer your security questions to reset your password.
            </p>

            <div className="mt-6 flex gap-3">
              <Link
                to="/driver-login"
                className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted"
              >
                Back to Login
              </Link>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
              >
                Reset Password
              </button>
            </div>

            {/* Tiny helper so you can see what empId is being carried along */}
            {empId ? (
              <p className="mt-4 text-xs text-muted-foreground">
                Employee ID detected: <span className="font-mono">{empId}</span>
              </p>
            ) : (
              <p className="mt-4 text-xs text-rose-600">
                No Employee ID in URL. Please return to login and start again.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
