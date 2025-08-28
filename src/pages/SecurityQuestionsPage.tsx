import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/supabase";

/**
 * SecurityQuestionsPage
 *
 * - Reads ?empId= from the URL
 * - Loads the 2 question prompts for that employee
 * - Renders two answer inputs
 * - Attempts to verify via an RPC if available (verify_driver_security)
 *   - On success -> take the user to set a new password
 *   - If the RPC isn't present, we gracefully fall back to returning to login with a reset intent
 *
 * NOTE on data sources:
 *   This tries (in order) to find question text in the following shapes.
 *   Adjust any SELECTs/column names to your actual schema if needed:
 *
 *   A) Table: driver_security  columns: emp_id, question1, question2
 *   B) Table: drivers          columns: security_question_1, security_question_2
 *      (also tries sec_q1_text / sec_q2_text as alternates)
 */

type LoadedQuestions = {
  q1: string;
  q2: string;
};

export default function SecurityQuestionsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const empId = params.get("empId") ?? "";

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<LoadedQuestions | null>(null);
  const [answers, setAnswers] = useState({ a1: "", a2: "" });
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadQuestions() {
      setLoading(true);
      setError(null);

      try {
        if (!empId) throw new Error("Missing employee id in URL.");

        // ---- Try A: driver_security (emp_id, question1, question2)
        {
          const { data, error } = await supabase
            .from("driver_security")
            .select("question1, question2")
            .eq("emp_id", empId)
            .maybeSingle();

          if (error && error.code !== "PGRST116") {
            // Not found vs actual error; we ignore "no rows" but report other errors.
            console.warn("driver_security fetch error:", error);
          }

          if (data && (data.question1 || data.question2)) {
            if (!cancelled)
              setQuestions({
                q1: data.question1 || "Security Question 1",
                q2: data.question2 || "Security Question 2",
              });
            return;
          }
        }

        // ---- Try B: drivers (security_question_1, security_question_2) or (sec_q1_text, sec_q2_text)
        {
          const { data, error } = await supabase
            .from("drivers")
            .select(
              "security_question_1, security_question_2, sec_q1_text, sec_q2_text"
            )
            .eq("employee_id", empId)
            .maybeSingle();

          if (error && error.code !== "PGRST116") {
            console.warn("drivers fetch error:", error);
          }

          if (data) {
            const q1 =
              data.security_question_1 ||
              data.sec_q1_text ||
              "Security Question 1";
            const q2 =
              data.security_question_2 ||
              data.sec_q2_text ||
              "Security Question 2";

            if (!cancelled) setQuestions({ q1, q2 });
            return;
          }
        }

        // If we get here, nothing found:
        if (!cancelled) {
          setError(
            "We couldn't find your security questions. Please contact your administrator."
          );
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Unexpected error.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadQuestions();
    return () => {
      cancelled = true;
    };
  }, [empId]);

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!empId) {
      setError("Missing employee id. Please start from the login screen.");
      return;
    }
    if (!answers.a1.trim() || !answers.a2.trim()) {
      setError("Please answer both questions.");
      return;
    }

    setVerifying(true);
    try {
      // --- Preferred path: RPC that checks hashed answers server-side
      const { data, error } = await supabase.rpc("verify_driver_security", {
        p_emp_id: empId,
        p_answer1: answers.a1.trim(),
        p_answer2: answers.a2.trim(),
      });

      if (error) {
        // If the RPC isn't defined (or other server error), we *gracefully* fall back
        console.warn("verify_driver_security RPC error:", error);
        // Fallback: go back to login with a hint to show "set new password" mode
        navigate(`/driver-login?empId=${encodeURIComponent(empId)}&reset=1`);
        return;
      }

      // Expecting the RPC to return true/false
      if (data === true) {
        // Take driver forward to set a new password screen.
        // If you have a dedicated route like /set-password, use that:
        // navigate(`/set-password?empId=${encodeURIComponent(empId)}`);
        // Otherwise, use login in "reset mode":
        navigate(`/driver-login?empId=${encodeURIComponent(empId)}&reset=1`);
      } else {
        setError("One or both answers are incorrect. Please try again.");
      }
    } catch (e: any) {
      console.error(e);
      setError("We couldn't verify your answers. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          <div className="px-6 py-8 sm:px-10">
            <h1 className="text-2xl font-semibold tracking-tight">
              Security Questions
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Answer your security questions to continue resetting your password.
            </p>

            <div className="mt-6">
              {empId && (
                <p className="text-xs text-muted-foreground">
                  Employee ID detected: <span className="font-mono">{empId}</span>
                </p>
              )}
            </div>

            {loading ? (
              <div className="mt-8 text-sm text-muted-foreground">Loading questions…</div>
            ) : error ? (
              <div className="mt-6 rounded-md bg-rose-50 p-3 text-rose-700">
                {error}
              </div>
            ) : questions ? (
              <form onSubmit={handleContinue} className="mt-8 space-y-5">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {questions.q1}
                  </label>
                  <input
                    type="text"
                    value={answers.a1}
                    onChange={(e) =>
                      setAnswers((s) => ({ ...s, a1: e.target.value }))
                    }
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="Answer to question 1"
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {questions.q2}
                  </label>
                  <input
                    type="text"
                    value={answers.a2}
                    onChange={(e) =>
                      setAnswers((s) => ({ ...s, a2: e.target.value }))
                    }
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="Answer to question 2"
                    autoComplete="off"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Link
                    to="/driver-login"
                    className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted"
                  >
                    Back to Login
                  </Link>

                  <button
                    type="submit"
                    disabled={verifying}
                    className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-60"
                  >
                    {verifying ? "Verifying…" : "Continue"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-6 text-sm text-muted-foreground">
                No questions available for this account.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
