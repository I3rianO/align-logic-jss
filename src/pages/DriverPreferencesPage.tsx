// src/pages/DriverPreferencesPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";

type Driver = {
  id: string;
  employee_id: string;
  name?: string | null;
  site_id?: string | null;
  company_id?: string | null;
  seniority?: number | null;
};

type Job = {
  id: string;
  job_id?: string | null; // in case your jobs table also stores a human id
  title?: string | null;
  start_time?: string | null;
  days?: string | null;
  location?: string | null;
  airport?: boolean | null;
};

type PickRow = {
  driver_id: string;
  job_id: string;
  preference_rank: number;
  submitted_at?: string | null;
  site_id?: string | null;
  company_id?: string | null;
};

function readEmpId(search: URLSearchParams): string | null {
  // accept several spellings
  const id =
    search.get("empId") ||
    search.get("emplid") ||
    search.get("empid") ||
    search.get("id") ||
    sessionStorage.getItem("empId") ||
    localStorage.getItem("empId") ||
    "";
  return id?.trim() ? id.trim() : null;
}

export default function DriverPreferencesPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();

  // ---- identity -------------------------------------------------------------
  const driverId = useMemo(() => readEmpId(search), [search]);
  const [driver, setDriver] = useState<Driver | null>(null);

  // ---- data -----------------------------------------------------------------
  const [jobs, setJobs] = useState<Job[]>([]);
  const [picks, setPicks] = useState<string[]>([]); // array of job_id in order
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(
    null
  );

  // ---- load driver, jobs, and existing picks --------------------------------
  useEffect(() => {
    (async () => {
      if (!driverId) {
        setLoading(false);
        return;
      }

      // persist for future steps (kiosk flow)
      sessionStorage.setItem("empId", driverId);
      localStorage.setItem("empId", driverId);

      try {
        setLoading(true);

        // 1) driver
        const { data: drow, error: derr } = await supabase
          .from("drivers")
          .select("*")
          .eq("employee_id", driverId)
          .limit(1)
          .maybeSingle();

        if (derr) throw derr;
        if (!drow) {
          setToast({
            type: "err",
            msg: `We couldn't find a driver for ID ${driverId}.`,
          });
          setDriver(null);
        } else {
          setDriver({
            id: drow.id,
            employee_id: drow.employee_id,
            name: drow.name ?? null,
            site_id: drow.site_id ?? null,
            company_id: drow.company_id ?? null,
            seniority: drow.seniority ?? null,
          });
        }

        // 2) jobs (you can add filtering by site/company if desired)
        const { data: jrows, error: jerr } = await supabase
          .from("jobs")
          .select("*")
          .order("id", { ascending: true });
        if (jerr) throw jerr;
        setJobs(jrows ?? []);

        // 3) existing picks for this driver
        const { data: prow, error: perr } = await supabase
          .from("driver_picks")
          .select("job_id, preference_rank")
          .eq("driver_id", driverId)
          .order("preference_rank", { ascending: true });

        if (perr) throw perr;

        setPicks((prow ?? []).map((r) => r.job_id));
      } catch (e: any) {
        console.error(e);
        setToast({ type: "err", msg: e?.message ?? "Failed to load data." });
      } finally {
        setLoading(false);
      }
    })();
  }, [driverId]);

  // ---- UI helpers -----------------------------------------------------------
  const availableJobs = useMemo(() => {
    const picked = new Set(picks);
    return jobs.filter((j) => j.id && !picked.has(j.id));
  }, [jobs, picks]);

  function addPick(jobId: string) {
    if (picks.includes(jobId)) return;
    setPicks((p) => [...p, jobId]);
  }

  function removePick(jobId: string) {
    setPicks((p) => p.filter((id) => id !== jobId));
  }

  function move(jobId: string, dir: "up" | "down") {
    setPicks((arr) => {
      const i = arr.indexOf(jobId);
      if (i < 0) return arr;
      const j = dir === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= arr.length) return arr;
      const copy = [...arr];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

  // ---- save -----------------------------------------------------------------
  async function save() {
    if (!driverId) {
      alert("Missing driver ID. Please log in again.");
      return;
    }
    try {
      setSaving(true);

      // Upsert the rows for this driver's picks with current preference order.
      const upserts: PickRow[] = picks.map((jobId, idx) => ({
        driver_id: driverId,
        job_id,
        preference_rank: idx + 1,
        submitted_at: new Date().toISOString(),
        site_id: driver?.site_id ?? null,
        company_id: driver?.company_id ?? null,
      }));

      // 1) Upsert current set
      if (upserts.length > 0) {
        const { error: uerr } = await supabase
          .from("driver_picks")
          .upsert(upserts, {
            onConflict: "driver_id,job_id",
            ignoreDuplicates: false,
          });
        if (uerr) throw uerr;
      }

      // 2) Remove any previously-saved picks that have been dropped
      // (delete where driver_id = ? and job_id NOT IN current picks)
      const { error: derr } = await supabase
        .from("driver_picks")
        .delete()
        .eq("driver_id", driverId)
        .not("job_id", "in", `(${picks.map((id) => `"${id}"`).join(",") || ""})`);

      // If there are zero picks, .not(... in '()') is invalid — do a full delete.
      if (picks.length === 0) {
        await supabase.from("driver_picks").delete().eq("driver_id", driverId);
      } else if (derr && picks.length > 0) {
        // ignore if the NOT IN clause was empty (handled above),
        // but rethrow any other error
        throw derr;
      }

      setToast({ type: "ok", msg: "Your preferences have been saved." });
    } catch (e: any) {
      console.error(e);
      setToast({
        type: "err",
        msg: e?.message ?? "We could not save your preferences. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  // ---- render ---------------------------------------------------------------
  if (!driverId) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-900">
          Missing driver ID. Please return to the login page.
        </div>
        <div className="mt-4">
          <button
            className="rounded-md border px-4 py-2"
            onClick={() => navigate("/")}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* Top driver information bar (kept minimal to avoid breaking your styling) */}
      <div className="mb-5 rounded-lg border bg-white p-4 shadow-sm">
        <div className="text-sm text-gray-600">Driver Information</div>
        <div className="mt-1 text-lg font-medium">
          {driver?.name || "Driver"} &nbsp;|&nbsp; Employee ID: {driverId}
        </div>
      </div>

      {toast && (
        <div
          className={`mb-4 rounded-md border p-3 ${
            toast.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {loading ? (
        <div className="rounded-md border bg-white p-6 shadow-sm">Loading…</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Available jobs */}
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="mb-3 text-base font-semibold">Available Jobs</div>
            {availableJobs.length === 0 ? (
              <div className="text-sm text-gray-500">No jobs to add.</div>
            ) : (
              <ul className="space-y-2">
                {availableJobs.map((job) => (
                  <li
                    key={job.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {job.title || job.job_id || job.id}
                      </div>
                      <div className="truncate text-xs text-gray-500">
                        {job.start_time ? `${job.start_time} • ` : ""}
                        {job.days || ""}
                        {job.location ? ` • ${job.location}` : ""}
                        {job.airport ? " • Airport" : ""}
                      </div>
                    </div>
                    <button
                      className="ml-3 rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
                      onClick={() => addPick(job.id)}
                    >
                      Add
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Your picks */}
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="mb-3 text-base font-semibold">Your Job Preferences</div>

            {picks.length === 0 ? (
              <div className="text-sm text-gray-500">
                You haven’t selected any jobs yet.
              </div>
            ) : (
              <ol className="space-y-2">
                {picks.map((jobId, idx) => {
                  const job = jobs.find((j) => j.id === jobId);
                  return (
                    <li
                      key={jobId}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-sm font-semibold">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {job?.title || job?.job_id || jobId}
                          </div>
                          <div className="truncate text-xs text-gray-500">
                            {job?.start_time ? `${job.start_time} • ` : ""}
                            {job?.days || ""}
                            {job?.location ? ` • ${job.location}` : ""}
                            {job?.airport ? " • Airport" : ""}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                          onClick={() => move(jobId, "up")}
                          disabled={idx === 0}
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                          onClick={() => move(jobId, "down")}
                          disabled={idx === picks.length - 1}
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          className="rounded-md border px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                          onClick={() => removePick(jobId)}
                          title="Remove"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={save}
                disabled={saving}
                className={`rounded-md px-4 py-2 text-white ${
                  saving
                    ? "cursor-not-allowed bg-indigo-300"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {saving ? "Saving…" : "Save Preferences"}
              </button>
              <button
                className="rounded-md border px-4 py-2"
                onClick={() => navigate("/")}
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
