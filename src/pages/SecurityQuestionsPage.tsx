import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";

type Questions = { question1: string | null; question2: string | null };

export default function SecurityQuestionsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // accept empId or empid (handle both)
  const empId = useMemo(() => {
    return params.get("empId") ?? params.get("empid") ?? "";
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Questions>({ question1: null, question2: null });

  const [answer1, setAnswer1] = useState("");
  const [answer2, setAnswer2] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!empId) {
        setLoadError("Missing employee id. Please return to Login.");
        setLoading(false);
        return;
      }

      try {
        // Call our SECURITY DEFINER RPC that returns the two question labels
        const { data, error } = await supabase.rpc("get_security_questions", {
          p_employee_id: empId,
        });

        if (cancelled) return;

        if (error) {
          // Most common cause is lack of GRANT EXECUTE on the function for anon
          console.error("RPC get_security_questions error:", error);
          setLoadError(
            "We couldn’t load your security questions. You can still try to continue."
          );
        } else if (data && Array.isArray(data) && data.length > 0) {
          setQuestions({
            question1: data[0].question1 ?? null,
            question2: data[0].question2 ?? null,
          });
        } else {
          // Function returned no row; fall back to banner but let them proceed
          setLoadError(
            "We couldn’t load your security questions. You can still try to continue."
          );
        }
      } catch (e) {
        console.error(e);
        setLoadError(
          "We couldn’t load your security questions. You can still try to continue."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [empId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!empId) return;

    try {
      setSubmitting(true);

      // (Optionally) verify answers here with an RPC if you want strict checking.
      // For now we simply pass the user along to create a new password.
      const search = new URLSearchParams({ empId, a1: answer1.trim(), a2: answer2.trim() });
      navigate(`/set-new-password?${search.toString()}`);
    } finally {
      setSubmitting(false);
    }
  }

  const q1Label = questions.question1 ?? "Question 1";
  const q2Label = questions.question2 ?? "Question 2";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="rounded-xl bg-white p-6 shadow-md">
        <h1 className="mb-2 text-2xl font-semibold">Security Questions</h1>
        <p className="text-sm text-gray-600">
          Answer your security questions to continue resetting your password.
        </p>

        {empId && (
          <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
            Employee ID detected: <span className="font-mono">{empId}</span>
          </div>
        )}

        {loadError && (
          <div className="mt-3 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
            {loadError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium">{q1Label}</label>
            <input
              type="text"
              className="w-full rounded-md border px-3 py-2"
              placeholder="Your answer"
              value={answer1}
              onChange={(e) => setAnswer1(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">{q2Label}</label>
            <input
              type="text"
              className="w-full rounded-md border px-3 py-2"
              placeholder="Your answer"
              value={answer2}
              onChange={(e) => setAnswer2(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Link
              to="/driver-login"
              className="rounded-md border px-4 py-2 text-sm"
            >
              Back to Login
            </Link>

            <button
              type="submit"
              disabled={loading || submitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Continuing…" : "Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
