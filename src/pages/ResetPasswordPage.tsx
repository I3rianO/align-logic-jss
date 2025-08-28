import React from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // Be forgiving about the param name: support emplid, empId, employee_id
  const rawEmpId =
    params.get("emplid") ||
    params.get("empId") ||
    params.get("employee_id") ||
    "";

  const empId = (rawEmpId || "").trim();

  const goNext = () => {
    if (!empId) return;
    // Always carry the employee id through to the next step
    navigate(`/security-questions?emplid=${encodeURIComponent(empId)}`, {
      replace: true,
    });
  };

  const missingId = !empId;

  return (
    <div className="container mx-auto max-w-3xl px-6 py-12">
      <div className="rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-semibold">Reset Your Password</h1>

        <p className="mb-6 text-muted-foreground">
          Answer your security questions to reset your password.
        </p>

        {missingId ? (
          <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            No Employee ID in URL. Please return to login and start again.
          </div>
        ) : (
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Employee ID detected: <span className="font-mono">{empId}</span>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/driver-login"
            className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Back to Login
          </Link>

          <button
            type="button"
            onClick={goNext}
            disabled={missingId}
            className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white ${
              missingId
                ? "cursor-not-allowed bg-gray-400"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            title={
              missingId
                ? "Employee ID not found in the URL"
                : "Continue to security questions"
            }
          >
            Reset Password
          </button>
        </div>
      </div>
    </div>
  );
}
