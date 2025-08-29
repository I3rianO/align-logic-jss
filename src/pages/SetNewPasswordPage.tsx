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
      search.get("id") ||
      ""
    );
  }, [search]);

  // answers are passed from the Security Questions page
  const answer1 = search.get("a1") || "";
  const answer2 = search.get("a2") || "";

  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ type: "info" | "error" | "success"; text: string } | null>(null);

  const canSubmit = pw1.length >= 6 && pw1 === pw2 && !!employeeId && !!answer1 && !!answer2;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);

    if (!employeeId) {
      setNotice({ type: "error", text: "Missing employee ID. Please go back and try again." });
      return;
    }
    if (pw1.length < 6) {
      setNotice({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    if (pw1 !== pw2) {
      setNotice({ type: "error", text: "Passwords do not match." });
      return;
    }

    setBusy(true);
    try {
      // 1) Verify the two answers
      const { data: okAns, error: ansErr } = await supabase.rpc("verify_security_answers", {
        p_employee_id: employeeId,
        p_a1: answer1,
        p_a2: answer2,
      });

      if (ansErr) {
        setNotice({ type: "error", text: `Could not verify answers: ${ansErr.message}` });
        return;
      }
      if (!okAns) {
        setNotice({ type: "error", text: "Security answers did not match. Please go back and try again." });
        return;
      }

      // 2) Set the new password
      const { error: setErr } = await supabase.rpc("set_driver_password", {
        p_employee_id: employeeId,
        p_plain: pw1,
      });
      if (setErr) {
        setNotice({ type: "error", text: `Failed to set password: ${setErr.message}` });
        return;
      }

      setNotice({ type: "success", text: "Password updated! Redirecting to login…" });

      // Short pause so user sees the success, then return to password screen with the ID filled
      setTimeout(() => {
        navigate(`/driver-login?emplid=${encodeURIComponent(employeeId)}`);
      }, 900);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-start sm:items-center justify-center py-12">
      <div className="w-full max-w-xl bg-white rounded-xl shadow border border-slate-200 p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-800">Set New Password</h1>
        <p className="text-slate-500 mt-2">
          Enter a new password to finish resetting your account.
        </p>

        <div className="mt-4">
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <div className="font-medium">Detected</div>
            <div>Employee ID: <span className="font-mono">{employeeId || "(missing)"}</span></div>
            <div>Answer 1: <span className="font-mono">{answer1 || "(none)"}</span></div>
            <div>Answer 2: <span className="font-mono">{answer2 || "(none)"}</span></div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">New Password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={pw1}
              onChange={(e) => setPw1(e.target.value)}
              placeholder="Enter your new password"
              autoFocus
            />
            <p className="mt-1 text-xs text-slate-500">Minimum 6 characters.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              placeholder="Re-enter your new password"
            />
          </div>

          {notice && (
            <div
              className={
                "rounded-md border p-3 text-sm " +
                (notice.type === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : notice.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-sky-200 bg-sky-50 text-sky-700")
              }
            >
              {notice.text}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Link
              to="/driver-login"
              className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Back to Login
            </Link>

            <button
              type="submit"
              disabled={!canSubmit || busy}
              className={`px-4 py-2 rounded-md text-white ${
                !canSubmit || busy ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {busy ? "Saving…" : "Save New Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
