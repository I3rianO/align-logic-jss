// src/pages/SetNewPasswordPage.tsx
import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function SetNewPasswordPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();

  // Accept several param spellings just in case
  const employeeId = useMemo(() => {
    return (
      search.get("emplid") ||
      search.get("empId") ||
      search.get("employeeId") ||
      search.get("id") ||
      ""
    );
  }, [search]);

  // answers passed from /security-questions
  const answer1 = search.get("a1") || "";
  const answer2 = search.get("a2") || "";

  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [kind, setKind] = useState<"info" | "warn" | "error" | "success">("info");

  const disabled = busy;

  const show = (text: string, k: typeof kind = "info") => {
    setKind(k);
    setMsg(text);
  };

  const validateInputs = () => {
    if (!employeeId) {
      show("Missing employee id. Please return to login.", "warn");
      return false;
    }
    if (!answer1 || !answer2) {
      show("Missing security answers. Please restart the reset flow.", "warn");
      return false;
    }
    if (!p1 || !p2) {
      show("Please enter and confirm your new password.", "warn");
      return false;
    }
    if (p1 !== p2) {
      show("Passwords do not match.", "warn");
      return false;
    }
    if (p1.length < 8) {
      show("Password must be at least 8 characters.", "warn");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateInputs()) return;
    setBusy(true);
    setMsg(null);

    try {
      // 1) Verify answers (SQL function we created earlier)
      const { data: okAns, error: ansErr } = await supabase.rpc("verify_security_answers", {
        p_employee_id: employeeId,
        p_a1: answer1,
        p_a2: answer2,
      });

      if (ansErr) throw ansErr;
      if (!okAns) {
        show("Security answers did not match our records.", "error");
        setBusy(false);
        return;
      }

      // 2) Set password (SQL function we created earlier)
      const { error: setErr } = await supabase.rpc("set_driver_password", {
        p_employee_id: employeeId,
        p_plain: p1,
      });
      if (setErr) throw setErr;

      show("Password updated. Redirecting to login…", "success");

      // 3) Send them back to login pre-filled with id
      setTimeout(() => {
        navigate(`/driver-login?emplid=${encodeURIComponent(employeeId)}&reset=ok`);
      }, 900);
    } catch (e: any) {
      console.error(e);
      show(e?.message ?? "Something went wrong while saving your password.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center bg-gray-50 py-10">
      <div className="w-full max-w-2xl rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-2">Set New Password</h1>
        <p className="text-sm text-gray-600 mb-4">
          Enter a new password for your account. You reached this page after verifying
          your identity with security questions.
        </p>

        {/* Context banner */}
        <div className="rounded-md border p-3 mb-5 bg-amber-50 border-amber-200 text-amber-800 text-sm">
          <div className="font-medium">Employee ID:</div>
          <div>{employeeId ? employeeId : "(missing)"}</div>
        </div>

        {msg && (
          <div
            className={
              "rounded-md border p-3 mb-4 text-sm " +
              (kind === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : kind === "error"
                ? "bg-red-50 border-red-200 text-red-700"
                : kind === "warn"
                ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                : "bg-blue-50 border-blue-200 text-blue-700")
            }
          >
            {msg}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <input
              type="password"
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter new password"
              value={p1}
              onChange={(e) => setP1(e.target.value)}
              disabled={disabled}
              autoComplete="new-password"
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum 8 characters. Use a mix of letters and numbers for best results.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input
              type="password"
              className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Re-enter new password"
              value={p2}
              onChange={(e) => setP2(e.target.value)}
              disabled={disabled}
              autoComplete="new-password"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Link
            to={`/driver-login?emplid=${encodeURIComponent(employeeId || "")}`}
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm"
          >
            Back to Login
          </Link>
          <button
            onClick={handleSave}
            disabled={disabled}
            className={`inline-flex items-center rounded-md px-4 py-2 text-sm text-white ${
              disabled ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {busy ? "Saving…" : "Save New Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
