// src/pages/DriverLoginPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

/**
 * DriverLoginPage
 * - Step 1: Enter Employee ID, click Continue (writes ?emplid= to URL)
 * - Step 2: Once ?emplid= is present, fetch driver + password status
 * - On success, redirect to Driver Preferences with emplid pinned in the URL
 * - Shows a green success banner when redirected with ?reset=ok
 */
export default function DriverLoginPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();

  // Read the chosen ID only from the URL param (after user clicks Continue)
  const paramId = useMemo(() => {
    return (
      search.get("emplid") ||
      search.get("emplid#") ||
      search.get("empid") ||
      search.get("id") ||
      ""
    ).trim();
  }, [search]);

  // Local input field state for Step 1
  const [employeeId, setEmployeeId] = useState<string>(paramId);
  const [driverName, setDriverName] = useState<string>("");
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const resetOk = search.get("reset") === "ok";

  // Keep the input box in sync if the URL param changes (e.g., after Continue)
  useEffect(() => {
    if (paramId && employeeId !== paramId) setEmployeeId(paramId);
  }, [paramId]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Lookup runs ONLY when ?emplid= is present (after Continue),
   * not on every keystroke while typing.
   */
  useEffect(() => {
    if (!paramId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        // Fetch driver display info
        const { data: driverRow, error: dErr } = await supabase
          .from("drivers")
          .select("name")
          .eq("employee_id", paramId)
          .maybeSingle();

        if (dErr) throw dErr;

        if (!driverRow) {
          if (!cancelled) {
            setDriverName("");
            setHasPassword(null);
            toast.error("Employee ID not found.");
          }
          return;
        }

        if (!cancelled) {
          setDriverName(driverRow.name || "");
        }

        // Ask SQL helper if password exists
        const { data: hasRow, error: hErr } = await supabase.rpc(
          "has_driver_password",
          { p_employee_id: paramId }
        );
        if (hErr) throw hErr;

        if (!cancelled) {
          setHasPassword(Boolean(hasRow));
        }
      } catch (e: any) {
        if (!cancelled) {
          console.error(e);
          toast.error("Unable to load driver information.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [paramId]);

  /** Step 1 submit: push the URL with ?emplid= */
  function handleIdSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = employeeId.trim();
    if (!id) {
      toast.error("Please enter your Employee ID.");
      return;
    }
    navigate(`/driver-login?emplid=${encodeURIComponent(id)}`);
  }

  /** Step 2 login submit: verify password via RPC */
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!paramId) return;
    if (!password) {
      toast.error("Please enter your password.");
      return;
    }
    setLoading(true);
    try {
      const { data: ok, error } = await supabase.rpc("verify_driver_password", {
        p_employee_id: paramId,
        p_plain: password,
      });
      if (error) throw error;

      if (ok === true) {
        toast.success("Login successful!");
        navigate(`/driver-preferences?emplid=${encodeURIComponent(paramId)}`);
      } else {
        toast.error("Invalid password. Please try again.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Page shell wrapper
  function PageShell({ children }: { children: React.ReactNode }) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <h1 className="text-2xl font-semibold text-slate-900">Driver Login</h1>
          <p className="mt-1 text-slate-600">
            Enter your employee ID to access the job selection system.
          </p>

          {resetOk && (
            <div className="mt-4 rounded-md border p-3 bg-green-50 border-green-200 text-green-700 text-sm">
              Your password was updated. Please login.
            </div>
          )}

          <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Step 1: no ?emplid= in URL yet → just the ID form
  if (!paramId) {
    return (
      <PageShell>
        <form onSubmit={handleIdSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Employee ID
          </label>
          <input
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="w-full rounded-md border px-3 py-2 outline-none ring-blue-500 focus:ring"
            placeholder="e.g., 1234567"
            // Use plain text to allow IDs like D001 / TEMP-7
            inputMode="text"
            autoFocus
          />

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Checking..." : "Continue"}
            </button>
            <button
              type="button"
              onClick={() => setEmployeeId("")}
              className="rounded-md border px-3 py-2 text-slate-700 hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
        </form>
      </PageShell>
    );
  }

  // Step 2: have ?emplid= → show driver info + either login or set-password path
  return (
    <PageShell>
      {loading && hasPassword === null ? (
        <div className="text-slate-500">Loading driver info…</div>
      ) : hasPassword === null ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800">
          We couldn’t find that Employee ID.{" "}
          <Link to="/driver-login" className="underline">
            Try again
          </Link>
          .
        </div>
      ) : (
        <>
          {/* Driver info */}
          <div className="mb-4 rounded-md border bg-slate-50 p-3 text-sm text-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{driverName || "Driver"}</div>
                <div className="text-slate-600">ID: {paramId}</div>
              </div>
              <Link
                to="/driver-login"
                className="rounded-md border px-3 py-1.5 text-sm text-slate-700 hover:bg-white"
              >
                Not you? New driver
              </Link>
            </div>
          </div>

          {hasPassword ? (
            // Existing driver login
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm">
                Password on file. Please login.
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border px-3 py-2 outline-none ring-blue-500 focus:ring"
                placeholder="Enter your password"
                autoComplete="current-password"
                autoFocus
              />

              <div className="flex items-center justify-between">
                <Link
                  to={`/reset-password?emplid=${encodeURIComponent(paramId)}`}
                  className="text-sm text-blue-700 hover:underline"
                >
                  Forgot password?
                </Link>
                <div className="flex gap-2">
                  <Link
                    to="/driver-login"
                    className="rounded-md border px-3 py-2 text-slate-700 hover:bg-slate-50"
                  >
                    Back
                  </Link>
                  <button
                    type="submit"
                    className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
                    disabled={loading}
                  >
                    {loading ? "Logging in…" : "Login"}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            // New driver: set up password
            <div className="space-y-3">
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-blue-800 text-sm">
                We don’t have a password on file for this driver yet.
              </div>
              <div className="flex gap-2">
                <Link
                  to={`/set-new-password?emplid=${encodeURIComponent(paramId)}`}
                  className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Set Up Password
                </Link>
                <Link
                  to="/driver-login"
                  className="rounded-md border px-3 py-2 text-slate-700 hover:bg-slate-50"
                >
                  Back
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
