import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "../supabase";

/**
 * SecurityQuestionsPage
 * - Reads ?empId=1234567 from the URL
 * - Fetches the two *stored* questions for that employee
 * - Renders both question prompts and two answer boxes
 *
 * NOTE:
 *  - This only *displays* the questions and gathers answers.
 *  - We’ll wire up answer verification and “set new password” in the next step.
 */
export default function SecurityQuestionsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const empId = params.get("empId") ?? "";

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [q1, setQ1] = useState<string>("");
  const [q2, setQ2] = useState<string>("");

  const [a1, setA1] = useState("");
  const [a2, setA2] = useState("");

  useEffect(() => {
    if (!empId) {
      navigate("/driver-login");
      return;
    }

    const fetchQuestions = async () => {
      setLoading(true);
      setLoadError(null);

      // Try a couple of common table/column shapes to be resilient.
      // Adjust the table/column names below to match your schema if needed.
      const attempts: Array<{
        table: string;
        columns: string;
        where: { col: string; val: string };
        map: (row: any) => { q1: string; q2: string };
      }> = [
        // Option A: driver_security_questions(driver_id, q1_text, q2_text)
        {
          table: "driver_security_questions",
          columns: "q1_text, q2_text, driver_id",
          where: { col: "driver_id", val: empId },
          map: (row) => ({ q1: row?.q1_text ?? "", q2: row?.q2_text ?? "" }),
        },
        // Option B: security_questions(emp_id, question1, question2)
        {
          table: "security_questions",
          columns: "question1, question2, emp_id",
          where: { col: "emp_id", val: empId },
          map: (row) => ({ q1: row?.question1 ?? "", q2: row?.question2 ?? "" }),
        },
      ];

      for (const attempt of attempts) {
        const { data, error } = await supabase
          .from(attempt.table)
          .select(attempt.columns)
          .eq(attempt.where.col, attempt.where.val)
          .maybeSingle();

        if (error) {
          // Keep trying the next shape; only surface the last error if nothing works.
          continue;
        }

        if (data) {
          const mapped = attempt.map(data);
          setQ1(mapped.q1);
          setQ2(mapped.q2);
          setLoading(false);
          return;
        }
      }

      setLoading(false);
      setLoadError(
        "We couldn’t find security questions for this driver. Please contact your site administrator."
      );
    };

    fetchQuestions();
  }, [empId, navigate]);

  const handleContinue = async () => {
    // In the next step we’ll verify answers and then navigate to
    // a “Set New Password” page. For now, just require both answers.
    if (!a1.trim() || !a2.trim()) return;

    // Placeholder: keep the driver here (or navigate onward when verification is implemented).
    // navigate(`/set-new-password?empId=${encodeURIComponent(empId)}`);
  };

  if (!empId) return null;

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          <div className="px-6 py-8 sm:px-10">
            <h1 className="text-2xl font-semibold tracking-tight">Security Questions</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Answer your security questions to continue resetting your password.
            </p>

            <div className="mt-8 space-y-6">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading questions…</p>
              ) : loadError ? (
                <p className="text-sm text-rose-600">{loadError}</p>
              ) : (
                <>
                  {/* Question 1 */}
                  <div>
                    <label className="block text-sm font-medium">{q1 || "Question 1"}</label>
                    <input
                      type="text"
                      value={a1}
                      onChange={(e) => setA1(e.target.value)}
                      className="mt-2 w-full rounded-md border px-3 py-2 text-sm shadow-sm outline-none focus:ring-2"
                      placeholder="Your answer"
                    />
                  </div>

                  {/* Question 2 */}
                  <div>
                    <label className="block text-sm font-medium">{q2 || "Question 2"}</label>
                    <input
                      type="text"
                      value={a2}
                      onChange={(e) => setA2(e.target.value)}
                      className="mt-2 w-full rounded-md border px-3 py-2 text-sm shadow-sm outline-none focus:ring-2"
                      placeholder="Your answer"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="mt-8 flex gap-3">
              <Link
                to="/driver-login"
                className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted"
              >
                Back to Login
              </Link>

              <button
                type="button"
                onClick={handleContinue}
                disabled={loading || !!loadError || !a1.trim() || !a2.trim()}
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
              </button>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Employee ID detected: <span className="font-mono">{empId}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
