// src/pages/ResetPasswordPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();

  // Accept several param spellings just in case
  const paramId = useMemo(
    () =>
      (search.get("empId") ||
        search.get("emplid") ||
        search.get("empid") ||
        search.get("id") ||
        "") as string,
    [search]
  );

  const [employeeId, setEmployeeId] = useState<string>(paramId);

  // Keep state in sync if URL query shows up later (e.g., via nav)
  useEffect(() => {
    if (paramId && paramId !== employeeId) {
      setEmployeeId(paramId);
    }
  }, [paramId, employeeId]);

  // If we already have an ID in the URL, enable the button immediately.
  const canSubmit = employeeId.trim().length > 0;

  function handleReset(e: React.FormEvent) {
    e.preventDefault();
    const id = employeeId.trim();

    if (!id) {
      alert("Please enter your Employee ID.");
      return;
    }

    // persist for the rest of the flow (handy for kiosk sessions)
    sessionStorage.setItem("empId", id);
    localStorage.setItem("empId", id);

    // go collect security answers
    navigate(`/security-questions?empId=${encodeURIComponent(id)}`);
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold">Reset Your Password</h1>
        <p className="mb-6 text-gray-600">
          Answer your security questions to reset your password.
        </p>

        {/* If an empId is present in the URL, show it; otherwise show an input */}
        {paramId ? (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900">
            Employee ID detected: <span className="font-medium">{paramId}</span>
          </div>
        ) : (
          <form onSubmit={handleReset} className="mb-4">
            <label className="mb-1 block text-sm font-medium">Employee ID</label>
            <input
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              inputMode="numeric"
              className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-indigo-500"
              placeholder="e.g., 1234567"
            />
          </form>
        )}

        <div className="mt-6 flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Back to Login
          </Link>

          <button
            onClick={handleReset}
            disabled={!canSubmit}
            className={`inline-flex items-center rounded-md px-4 py-2 text-white ${
              canSubmit
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "cursor-not-allowed bg-indigo-300"
            }`}
          >
            Reset Password
          </button>
        </div>
      </div>
    </div>
  );
}
