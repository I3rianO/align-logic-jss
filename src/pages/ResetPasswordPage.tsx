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
  }, [paramId]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasId = employeeId.trim().length > 0;

  const onContinue = () => {
    const id = employeeId.trim();
    if (!id) {
      // Gentle guard—UI also disables the button, but keep this for safety.
      alert("No Employee ID in URL. Please return to login and try again.");
      return;
    }
    navigate(`/security-questions?empId=${encodeURIComponent(id)}`);
  };

  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          Reset Your Password
        </h1>
        <p className="text-gray-600 mb-6">
          Answer your security questions to reset your password.
        </p>

        {hasId ? (
          <div className="mb-6 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800">
            Employee ID detected: <span className="font-medium">{employeeId}</span>
          </div>
        ) : (
          <>
            <div className="mb-4 rounded border border-rose-300 bg-rose-50 px-4 py-3 text-rose-800">
              No Employee ID in URL. You can enter it below or go back to login.
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee ID
            </label>
            <input
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="Enter your Employee ID"
              className="mb-6 w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </>
        )}

        <div className="flex items-center gap-3">
          <Link
            to="/driver-login"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Login
          </Link>

          <button
            onClick={onContinue}
            disabled={!hasId}
            className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white ${
              hasId
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-blue-300 cursor-not-allowed"
            }`}
          >
            Reset Password
          </button>
        </div>
      </div>
    </div>
  );
}
