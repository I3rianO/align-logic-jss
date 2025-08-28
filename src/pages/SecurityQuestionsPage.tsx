import React, { useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function SecurityQuestionsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emplid = useMemo(() => searchParams.get("emplid") ?? "", [searchParams]);

  const [answer1, setAnswer1] = useState("");
  const [answer2, setAnswer2] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleBack = () => navigate("/driver-login");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    // Basic client-side guards for now
    if (!emplid) {
      setMsg("Missing employee ID in the link.");
      return;
    }
    if (!answer1.trim() || !answer2.trim()) {
      setMsg("Please answer both security questions.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setMsg("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg("Passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      // TODO: Wire this up to your real verification + reset logic
      // For now we just show a success note and send user back to login.
      // Next step we’ll call a Supabase RPC or REST endpoint to:
      // 1) verify answers for emplid
      // 2) update the password if correct
      await new Promise((r) => setTimeout(r, 700)); // tiny pause for UX

      setMsg("✅ Answers accepted. Your password has been reset.");
      // Send them to login with their employee ID filled
      setTimeout(() => {
        navigate(`/driver-login?emplid=${encodeURIComponent(emplid)}`);
      }, 900);
    } catch (err: any) {
      setMsg("Unable to reset password right now. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="bg-white shadow-sm rounded-xl p-6 border">
        <h1 className="text-2xl font-semibold mb-1">Answer Security Questions</h1>
        <p className="text-sm text-muted-foreground mb-4">
          To reset your password, please answer your security questions and set a new password.
        </p>

        <div className="mb-6 rounded-md bg-slate-50 px-4 py-3 text-sm">
          <div className="font-medium">Employee ID Detected</div>
          <div className="text-slate-700">{emplid || "—"}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Security question #1 (placeholder text – we’ll replace with real stored question later) */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Security Question 1
            </label>
            <input
              type="text"
              className="w-full border rounded-md px-3 py-2"
              placeholder="Your first car model (example)"
              value={answer1}
              onChange={(e) => setAnswer1(e.target.value)}
            />
          </div>

          {/* Security question #2 (placeholder) */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Security Question 2
            </label>
            <input
              type="text"
              className="w-full border rounded-md px-3 py-2"
              placeholder="Mother’s maiden name (example)"
              value={answer2}
              onChange={(e) => setAnswer2(e.target.value)}
            />
          </div>

          <hr className="my-6" />

          {/* New password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <input
                type="password"
                className="w-full border rounded-md px-3 py-2"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirm Password</label>
              <input
                type="password"
                className="w-full border rounded-md px-3 py-2"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>
          </div>

          {msg && (
            <div className={`text-sm ${msg.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>
              {msg}
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              className="inline-flex items-center rounded-md border px-4 py-2 text-sm"
              onClick={handleBack}
              disabled={busy}
            >
              Back to Login
            </button>
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-blue-600 text-white px-4 py-2 text-sm disabled:opacity-50"
              disabled={busy}
            >
              {busy ? "Checking…" : "Verify & Reset Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
