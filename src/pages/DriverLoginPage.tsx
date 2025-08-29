import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";

/**
 * Simple, dependency-free kiosk login flow:
 * 1) Enter employee ID
 * 2) If password exists => ask for password; else => create password
 * 3) Route to /driver-preferences?emplid=...
 *
 * No localStorage/session is persisted: exiting leaves the kiosk ready for the next driver.
 */

type DriverRow = {
  employee_id: string;
  name: string | null;
  site_id: string | null;
  company_id: string | null;
};

type Phase = "ID" | "LOGIN" | "CREATE";

export default function DriverLoginPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();

  // ----- UI state -----
  const [phase, setPhase] = useState<Phase>("ID");
  const [loading, setLoading] = useState(false);

  const [employeeIdInput, setEmployeeIdInput] = useState("");
  const [driver, setDriver] = useState<DriverRow | null>(null);

  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Small inline message bar (no external toast lib)
  const [msg, setMsg] = useState<{ type: "info" | "error" | "success"; text: string } | null>(null);
  const showError = (text: string) => setMsg({ type: "error", text });
  const showInfo = (text: string) => setMsg({ type: "info", text });
  const showSuccess = (text: string) => setMsg({ type: "success", text });

  // Prefill ID if provided in query (?emplid=...)
  useEffect(() => {
    const qId =
      search.get("emplid") ||
      search.get("empId") ||
      search.get("employee_id") ||
      search.get("id") ||
      "";
    if (qId) setEmployeeIdInput(qId);
  }, [search]);

  // Headings
  const heading = useMemo(() => {
    if (phase === "ID") return "Driver Login";
    if (phase === "LOGIN") return "Enter Your Password";
    return "Set Up Your Password";
  }, [phase]);

  const subheading = useMemo(() => {
    if (phase === "ID")
      return "Enter your employee ID to access the job selection system.";
    if (phase === "LOGIN")
      return "Please enter your password to continue.";
    return "Create a password to access the job selection system.";
  }, [phase]);

  // ----- Helpers -----

  const resetAll = () => {
    setLoading(false);
    setDriver(null);
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setMsg(null);
    setPhase("ID");
  };

  const fetchDriver = async (empId: string) => {
    setLoading(true);
    setMsg(null);
    try {
      const { data, error } = await supabase
        .from("drivers")
        .select("employee_id,name,site_id,company_id")
        .eq("employee_id", empId.trim())
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        showError("Employee ID not found.");
        return null;
      }
      return data as DriverRow;
    } catch (err) {
      console.error(err);
      showError("Could not look up that employee.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const checkHasPassword = async (empId: string) => {
    const { data, error } = await supabase.rpc("has_driver_password", {
      p_employee_id: empId,
    });
    if (error) {
      console.error(error);
      // Fail-safe: treat as has password
      return true;
    }
    return Boolean(data);
  };

  const goToPreferences = (empId: string) => {
    navigate(`/driver-preferences?emplid=${encodeURIComponent(empId)}`);
  };

  // ----- Actions -----

  const onSubmitEmployeeId = async (e: React.FormEvent) => {
    e.preventDefault();
    const empId = employeeIdInput.trim();
    if (!empId) {
      showError("Please enter your employee ID.");
      return;
    }

    const d = await fetchDriver(empId);
    if (!d) return;

    setDriver(d);

    const hasPw = await checkHasPassword(empId);
    setPhase(hasPw ? "LOGIN" : "CREATE");
    showInfo(hasPw ? "Password on file. Please login." : "No password on file. Please create one.");
  };

  const onSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driver) return;

    if (!password) {
      showError("Please enter your password.");
      return;
    }

    setLoading(true);
    setMsg(null);
    try {
      const { data, error } = await supabase.rpc("verify_driver_password", {
        p_employee_id: driver.employee_id,
        p_plain: password,
      });

      if (error) throw error;

      if (data === true) {
        showSuccess("Welcome!");
        goToPreferences(driver.employee_id);
      } else {
        showError("Incorrect password. Please try again.");
      }
    } catch (err) {
      console.error(err);
      showError("Could not verify your password.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmitCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driver) return;

    if (!newPassword || !confirmPassword) {
      showError("Please fill out both password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      showError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setMsg(null);
    try {
      const { error } = await supabase.rpc("set_driver_password", {
        p_employee_id: driver.employee_id,
        p_plain: newPassword,
      });
      if (error) throw error;

      showSuccess("Password created.");
      goToPreferences(driver.employee_id);
    } catch (err) {
      console.error(err);
      showError("Could not set your password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ----- UI -----

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-2">{heading}</h1>
      <p className="text-sm text-slate-600 mb-6">{subheading}</p>

      {msg && (
        <div
          className={`mb-5 rounded border px-3 py-2 text-sm ${
            msg.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : msg.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Phase: Enter ID */}
      {phase === "ID" && (
        <form onSubmit={onSubmitEmployeeId} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Employee ID
            </label>
            <input
              className="w-full rounded border px-3 py-2"
              value={employeeIdInput}
              onChange={(e) => setEmployeeIdInput(e.target.value)}
              inputMode="numeric"
              autoFocus
              placeholder="e.g., 1234567"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Checking…" : "Continue"}
            </button>
            <button
              type="button"
              className="rounded border px-4 py-2 hover:bg-slate-50"
              onClick={resetAll}
            >
              Clear
            </button>
          </div>
        </form>
      )}

      {/* Phase: Password Login */}
      {phase === "LOGIN" && driver && (
        <form onSubmit={onSubmitPassword} className="space-y-5">
          <div className="rounded border p-3 bg-slate-50 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{driver.name ?? "Driver"}</div>
                <div className="text-slate-600">ID: {driver.employee_id}</div>
              </div>
              <button
                type="button"
                className="rounded border px-3 py-1 text-sm hover:bg-slate-100"
                onClick={resetAll}
              >
                Not you? New driver
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              className="w-full rounded border px-3 py-2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              placeholder="Enter your password"
            />
            <div className="mt-2">
              <Link
                to={`/reset-password?emplid=${encodeURIComponent(
                  driver.employee_id
                )}`}
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className="rounded border px-4 py-2 hover:bg-slate-50"
              onClick={resetAll}
            >
              Back
            </button>
            <button
              type="submit"
              className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Verifying…" : "Login"}
            </button>
          </div>
        </form>
      )}

      {/* Phase: Create Password */}
      {phase === "CREATE" && driver && (
        <form onSubmit={onSubmitCreatePassword} className="space-y-5">
          <div className="rounded border p-3 bg-slate-50 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{driver.name ?? "Driver"}</div>
                <div className="text-slate-600">ID: {driver.employee_id}</div>
              </div>
              <button
                type="button"
                className="rounded border px-3 py-1 text-sm hover:bg-slate-100"
                onClick={resetAll}
              >
                Not you? New driver
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              New Password
            </label>
            <input
              className="w-full rounded border px-3 py-2"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoFocus
              placeholder="Enter a new password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Confirm Password
            </label>
            <input
              className="w-full rounded border px-3 py-2"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter the same password"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className="rounded border px-4 py-2 hover:bg-slate-50"
              onClick={() => setPhase("LOGIN")}
            >
              Back
            </button>
            <button
              type="submit"
              className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Saving…" : "Create Password"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
