// src/pages/ResetPasswordPage.tsx
import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

/**
 * ResetPasswordPage
 * - Step 1 of reset flow: confirm Employee ID exists
 * - If found → navigate to /set-new-password?emplid=...
 * - If not found → toast error and stay
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();

  const initialId = useMemo(
    () =>
      (
        search.get("emplid") ||
        search.get("empid") ||
        search.get("id") ||
        ""
      ).trim(),
    [search]
  );

  const [employeeId, setEmployeeId] = useState<string>(initialId);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = employeeId.trim();
    if (!id) {
      toast.error("Please enter your Employee ID.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("drivers")
        .select("employee_id")
        .eq("employee_id", id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error("We couldn’t find that Employee ID.");
        return;
      }

      // Found → proceed to set-new-password
      navigate(`/set-new-password?emplid=${encodeURIComponent(id)}`);
    } catch (err: any) {
      console.error(err);
      toast.error("Unable to verify employee. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">
          Reset Your Password
        </h1>
        <p className="mt-1 text-slate-600">
          Enter your Employee ID to continue.
        </p>

        <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Employee ID
            </label>
            <input
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full rounded-md border px-3 py-2 outline-none ring-blue-500 focus:ring"
              placeholder="e.g., 1234567"
              inputMode="text"
              autoFocus
            />

            <div className="flex items-center justify-between">
              <Link
                to="/driver-login"
                className="rounded-md border px-3 py-2 text-slate-700 hover:bg-slate-50"
              >
                Back to Login
              </Link>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Checking…" : "Continue"}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t pt-4 text-sm text-slate-500">
            Need help? Contact your site administrator.
          </div>
        </div>
      </div>
    </div>
  );
}
