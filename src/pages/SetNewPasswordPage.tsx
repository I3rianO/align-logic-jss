import React, { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";

/**
 * Minimal page to terminate the "reset password" flow
 * after security questions. For now this page confirms
 * the employee id and collected answers, and gives the
 * user an obvious path back to login.
 *
 * You can wire real password-setting logic here next.
 */
export default function SetNewPasswordPage() {
  const [params] = useSearchParams();

  const emplid = params.get("emplid") ?? "";
  const a1 = params.get("a1") ?? "";
  const a2 = params.get("a2") ?? "";

  // You can persist the employee id so the login page
  // can pre-fill it if you want:
  useMemo(() => {
    if (emplid) {
      try {
        sessionStorage.setItem("reset_emplid", emplid);
      } catch {}
    }
  }, [emplid]);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold">Set New Password</h1>
        <p className="text-slate-600">
          This is a placeholder screen for setting a new password. The route now
          exists, so you won’t see a 404 anymore.
        </p>

        <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <div className="text-sm">
            <div><strong>Employee ID:</strong> {emplid || "(missing)"} </div>
            <div className="mt-1"><strong>Answer 1:</strong> {a1 || "(missing)"} </div>
            <div className="mt-1"><strong>Answer 2:</strong> {a2 || "(missing)"} </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Link
            to="/driver-login"
            className="inline-flex items-center rounded-md bg-slate-800 px-4 py-2 text-white hover:bg-slate-700"
          >
            Back to Login
          </Link>

          {/* When you’re ready, replace this with a real form to set a new password */}
          <button
            type="button"
            className="inline-flex cursor-not-allowed items-center rounded-md bg-slate-300 px-4 py-2 text-slate-600"
            title="Replace with real password change logic"
          >
            (Coming soon) Save New Password
          </button>
        </div>
      </div>
    </div>
  );
}
