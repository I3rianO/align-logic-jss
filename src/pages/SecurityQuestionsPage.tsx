import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
// If your Vite/tsconfig path alias "@" -> "src" is NOT configured,
// change the next line to:  import { supabase } from "../supabase";
import { supabase } from "../lib/supabase";

type SecurityRow = {
  question1: string | null;
  question2: string | null;
};

export default function SecurityQuestionsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const empId = params.get("empId") ?? "";

  const [loading, setLoading] = useState(true);
  const [q1, setQ1] = useState<string>("Question 1");
  const [q2, setQ2] = useState<string>("Question 2");
  const [a1, setA1] = useState("");
  const [a2, setA2] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Load the question prompts for this driver
  useEffect(() => {
    let isMounted = true;

    async function loadQuestions() {
      setLoading(true);
      setError(null);

      if (!empId) {
        setError("Missing employee id. Please return to Login.");
        setLoading(false);
        return;
      }

      // Adjust table & column names here to match your schema.
      // Expected: one row with columns { question1, question2 } for the given employee.
      const { data, error } = await supabase
        .from<SecurityRow>("driver_security")
        .select("question1, question2")
        .eq("employee_id", empId)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        // Fall back to placeholders; keep going so the page still renders.
        console.error("Load security questions error:", error);
        setError(
          "We couldn’t load your security questions. You can still try to continue."
        );
      } else if (data) {
        if (data.question1) setQ1(data.question1);
        if (data.question2) setQ2(data.question2);
      }

      setLoading(false);
    }

    loadQuestions();
    return () => {
      isMounted = false;
    };
  }, [empId]);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();

    // (Optional) Simple client-side checks
    if (!a1.trim() || !a2.trim()) {
      setError("Please answer both questions.");
      return;
    }

    // If you eventually add server-side verification, call an RPC or REST function here.
    // For now, store answers briefly so the next step can read them if needed.
    sessionStorage.setItem("sq_empId", empId);
    sessionStorage.setItem("sq_a1", a1.trim().toLowerCase());
    sessionStorage.setItem("sq_a2", a2.trim().toLowerCase());

    // Send them back to the login page with a reset flag.
    // If your DriverLoginPage shows "set new password" when it sees ?reset=1,
    // this will drop them straight into the new password form.
    navigate(`/driver-login?empId=${encodeURIComponent(empId)}&reset=1`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/20">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 px-6 py-8 sm:px-10">
            <p className="text-sm text-muted-foreground">Loading questions…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          <div className="px-6 py-8 sm:px-10">
            <h1 className="text-2xl font-semibold tracking-tight">Security Questions</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Answer your security questions to continue resetting your password.
            </p>

            {empId && (
              <p className="mt-2 text-xs text-muted-foreground">
                Employee ID detected: <span className="font-mono">{empId}</span>
              </p>
            )}

            {error && (
              <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {error}
              </div>
            )}

            <form onSubmit={handleContinue} className="mt-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {q1}
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={a1}
                  onChange={(e) => setA1(e.target.value)}
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {q2}
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={a2}
                  onChange={(e) => setA2(e.target.value)}
                  autoComplete="off"
                />
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to="/driver-login"
                  className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted"
                >
                  Back to Login
                </Link>

                <button
                  type="submit"
                  className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
