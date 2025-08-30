// src/pages/SetNewPasswordPage.tsx
import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

export default function SetNewPasswordPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();

  // Accept a few spellings just in case
  const employeeId = useMemo(() => {
    return (
      search.get("emplid") ||
      search.get("empid") ||
      search.get("id") ||
      ""
    ).trim();
  }, [search]);

  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!employeeId) {
      toast.error("Missing Employee ID in the link.");
      return;
    }
    if (!pw1 || !pw2) {
      toast.error("Please fill in both password fields.");
      return;
    }
    if (pw1 !== pw2) {
      toast.error("Passwords do not match.");
      return;
    }
    if (pw1.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const { data: ok, error } = await supabase.rpc("set_driver_password", {
        p_employee_id: employeeId,
        p_plain: pw1,
      });

      if (error) throw error;

      if (ok === true) {
        toast.success("Password updated.");
        navigate(
          `/driver-login?emplid=${encodeURIComponent(
            employeeId
          )}&reset=ok`
        );
      } else {
        toast.error("Could not update password. Please try again.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">
          Set New Password
        </h1>
        <p className="mt-1 text-slate-600">
          {employeeId ? (
            <>
              Updating password for Employee ID{" "}
              <span className="font-medium">{employeeId}</span>.
            </>
          ) : (
            <>This page requires an Employee ID.</>
          )}
        </p>

        <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
          {!employeeId ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800">
              No Employee ID was provided. Return to{" "}
              <Link to="/driver-login" className="underline">
                Driver Login
              </Link>
              .
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  New Password
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type={show ? "text" : "password"}
                    value={pw1}
                    onChange={(e) => setPw1(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 outline-none ring-blue-500 focus:ring"
                    placeholder="Enter a new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="shrink-0 rounded-md border px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    aria-label={show ? "Hide password" : "Show password"}
                  >
                    {show ? "Hide" : "Show"}
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  At least 6 characters.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Confirm New Password
                </label>
                <input
                  type={show ? "text" : "password"}
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  className="mt-1 w-full rounded-md border px-3 py-2 outline-none ring-blue-500 focus:ring"
                  placeholder="Re-enter your new password"
                  autoComplete="new-password"
                />
              </div>

              <div className="flex items-center justify-between">
                <Link
                  to={`/driver-login?emplid=${encodeURIComponent(employeeId)}`}
                  className="rounded-md border px-3 py-2 text-slate-700 hover:bg-slate-50"
                >
                  Back to Login
                </Link>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? "Saving…" : "Save Password"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
