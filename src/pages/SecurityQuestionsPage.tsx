import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";

export default function SecurityQuestionsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const empId = params.get("empId") ?? "";

  const [answers, setAnswers] = useState({
    q1: "",
    q2: "",
    q3: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const onChange =
    (key: keyof typeof answers) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setAnswers((s) => ({ ...s, [key]: e.target.value }));
    };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empId) {
      // No employee id in URL -> send back to login
      navigate("/driver-login");
      return;
    }

    try {
      setSubmitting(true);

      // TODO: Replace this with a real verification call to your backend / Supabase RPC
      // For now we just proceed to the "set new password" step.
      navigate(`/set-new-password?empId=${encodeURIComponent(empId)}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          <div className="px-6 py-8 sm:px-10">
            <h1 className="text-2xl font-semibold tracking-tight">Security Questions</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Answer your security questions to continue resetting your password.
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium">Question 1</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  value={answers.q1}
                  onChange={onChange("q1")}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Question 2</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  value={answers.q2}
                  onChange={onChange("q2")}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Question 3</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  value={answers.q3}
                  onChange={onChange("q3")}
                  required
                />
              </div>

              <div className="mt-6 flex gap-3">
                <Link
                  to="/driver-login"
                  className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted"
                >
                  Back to Login
                </Link>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? "Checking…" : "Continue"}
                </button>
              </div>

              {empId ? (
                <p className="mt-4 text-xs text-muted-foreground">
                  Employee ID detected: <span className="font-mono">{empId}</span>
                </p>
              ) : (
                <p className="mt-4 text-xs text-rose-600">
                  No Employee ID in URL. Please return to login and start again.
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
