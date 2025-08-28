import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function SecurityQuestionsPage() {
  const query = useQuery();
  const navigate = useNavigate();

  // We pass the employee id around via query string (?empId=1234567)
  const empId = query.get("empId") ?? "";
  const [answer1, setAnswer1] = useState("");
  const [answer2, setAnswer2] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); // ⛔️ stop default navigation
    setError(null);
    setSubmitting(true);

    try {
      // TODO: Replace this stub with your real verification call
      const ok = answer1.trim().length > 0 && answer2.trim().length > 0;

      if (!ok) {
        setError("Please answer both questions.");
        setSubmitting(false);
        return;
      }

      // On success, send the user to password setup page
      navigate(`/reset-password/setup?empId=${encodeURIComponent(empId)}`);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold">Answer Security Questions</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          We detected Employee ID: <span className="font-medium">{empId || "Unknown"}</span>
        </p>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Question 1
            </label>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={answer1}
              onChange={(e) => setAnswer1(e.target.value)}
              placeholder="Your answer"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Question 2
            </label>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={answer2}
              onChange={(e) => setAnswer2(e.target.value)}
              placeholder="Your answer"
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Checking…" : "Continue"}
            </button>

            <button
              type="button"
              className="inline-flex items-center rounded-md border px-4 py-2 hover:bg-gray-50"
              onClick={() => navigate("/driver-login")}
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
