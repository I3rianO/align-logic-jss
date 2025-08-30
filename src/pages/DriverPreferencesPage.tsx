import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

/**
 * Driver Preferences (devv preview-style)
 * - Driver banner with name / emplid / facility badge / seniority
 * - Searchable + filterable + sortable Available Jobs table
 * - Preference list with reordering and remove
 * - Save (upsert) + Print + Exit
 *
 * Backend RPCs expected (created earlier):
 *  - get_driver_profile(p_employee_id text)
 *    -> { employee_id, name, company_id, site_id }
 *  - list_jobs_for_driver(p_employee_id text, p_week_start date)
 *    -> rows with: id (uuid), title (text), week_start_date (date), start_time (timestamptz|null), active (bool), site_id (text)
 *    (Optionally present columns will be used if they exist: job_id text, week_days text, is_airport bool)
 *  - list_driver_picks(p_employee_id text, p_week_start date)
 *    -> job_id, week_start_date, preference_rank, created_at
 *  - create_driver_pick(p_employee_id text, p_job_id uuid, p_week_start date, p_preference_rank int)
 */

/* ---------- Types ---------- */
type JobRow = {
  id: string; // uuid
  title: string | null;
  week_start_date: string; // yyyy-mm-dd
  start_time: string | null; // ISO or null
  active: boolean | null;
  site_id: string | null;

  // Optional fields if your table has them:
  job_id?: string | null; // e.g., "J001"
  week_days?: string | null; // e.g., "Mon-Fri"
  is_airport?: boolean | null;
};

type PickRow = {
  job_id: string; // uuid from jobs.id
  week_start_date: string;
  preference_rank: number | null;
  created_at: string;
};

type Profile = {
  employee_id: string;
  name: string | null;
  company_id: string | null;
  site_id: string | null;
};

type SortKey = "jobId" | "startTime" | "weekDays" | "isAirport";

/* ---------- Helpers ---------- */
function isoToLocalTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  // 24h HH:MM
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function minutesFromHHMM(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function timeLabel(job: JobRow): string {
  // Prefer explicit job.start_time; fall back to reading "HH:MM" from title if present
  if (job.start_time) return isoToLocalTime(job.start_time);
  const m = job.title?.match(/\b([01]\d|2[0-3]):([0-5]\d)\b/);
  return m ? m[0] : "";
}

function jobCode(job: JobRow): string {
  return (job.job_id ?? job.title ?? job.id).toString();
}

function weekDays(job: JobRow): string {
  return job.week_days ?? "-";
}

function isAirport(job: JobRow): boolean {
  return Boolean(job.is_airport) || /airport/i.test(job.title || "");
}

function mostRecentMonday(d = new Date()): string {
  const dt = new Date(d);
  const day = dt.getDay(); // 0=Sun..6=Sat
  const diff = (day + 6) % 7;
  dt.setDate(dt.getDate() - diff);
  dt.setHours(0, 0, 0, 0);
  return dt.toISOString().slice(0, 10);
}

/* ---------- Component ---------- */
export default function DriverPreferencesPage() {
  const navigate = useNavigate();
  const [search] = useSearchParams();

  // Accept ?emplid=… and optional ?week=YYYY-MM-DD
  const employeeId = useMemo(
    () => (search.get("emplid") || search.get("empid") || search.get("id") || "").trim(),
    [search]
  );
  const [weekStart, setWeekStart] = useState<string>(search.get("week") || mostRecentMonday());

  // Driver info
  const [profile, setProfile] = useState<Profile | null>(null);
  const [seniority, setSeniority] = useState<string>(""); // if you store this elsewhere, wire here

  // Jobs + picks (for the chosen week)
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [picks, setPicks] = useState<PickRow[]>([]);

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Table utilities
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [onlyAirport, setOnlyAirport] = useState<null | boolean>(null); // null=all, true= airport only, false = non-airport only
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 24 * 60 - 1]); // minutes
  const [weekdayFilter, setWeekdayFilter] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Guard
  useEffect(() => {
    if (!employeeId) {
      toast.error("Please login first.");
      navigate("/driver-login");
    }
  }, [employeeId, navigate]);

  // Load: profile, jobs, picks
  useEffect(() => {
    if (!employeeId) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        // Profile
        const { data: prof, error: pErr } = await supabase.rpc("get_driver_profile", {
          p_employee_id: employeeId,
        });
        if (pErr) throw pErr;
        const profRow: Profile | null = Array.isArray(prof) ? prof[0] ?? null : (prof as any) ?? null;
        if (!profRow) {
          toast.error("Driver not found.");
          navigate("/driver-login");
          return;
        }
        if (!cancel) {
          setProfile(profRow);
          // If you eventually have seniority in a separate table, fetch and set here
          setSeniority("1");
        }

        // Jobs
        const { data: jData, error: jErr } = await supabase.rpc("list_jobs_for_driver", {
          p_employee_id: employeeId,
          p_week_start: weekStart || null,
        });
        if (jErr) throw jErr;
        if (!cancel) setJobs(jData ?? []);

        // Picks
        const { data: kData, error: kErr } = await supabase.rpc("list_driver_picks", {
          p_employee_id: employeeId,
          p_week_start: weekStart || null,
        });
        if (kErr) throw kErr;
        if (!cancel) setPicks(kData ?? []);
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message || "Failed to load preferences.");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [employeeId, weekStart, navigate]);

  // Build preference array as Job IDs (uuid) in order
  const selectedJobIds = useMemo(
    () => picks.map((p) => p.job_id),
    [picks]
  );

  // Compose “Available Jobs” by removing already-picked
  const availableJobs = useMemo(() => {
    let arr = jobs.filter((j) => !selectedJobIds.includes(j.id));

    // Search
    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase();
      arr = arr.filter(
        (j) =>
          jobCode(j).toLowerCase().includes(t) ||
          timeLabel(j).toLowerCase().includes(t) ||
          weekDays(j).toLowerCase().includes(t) ||
          (j.title || "").toLowerCase().includes(t)
      );
    }

    // Time range (uses HH:MM label if no explicit start_time)
    arr = arr.filter((j) => {
      const label = timeLabel(j);
      if (!label) return true; // if unknown, don't filter it out
      const mins = minutesFromHHMM(label);
      return mins >= timeRange[0] && mins <= timeRange[1];
    });

    // Airport filter
    if (onlyAirport !== null) {
      arr = arr.filter((j) => isAirport(j) === onlyAirport);
    }

    // Weekday filter (if you store it)
    if (weekdayFilter) {
      arr = arr.filter((j) => weekDays(j).includes(weekdayFilter));
    }

    // Sort
    if (sortKey) {
      arr.sort((a, b) => {
        let A = 0;
        let B = 0;
        if (sortKey === "jobId") {
          return sortDir === "asc"
            ? jobCode(a).localeCompare(jobCode(b))
            : jobCode(b).localeCompare(jobCode(a));
        }
        if (sortKey === "startTime") {
          A = minutesFromHHMM(timeLabel(a) || "00:00");
          B = minutesFromHHMM(timeLabel(b) || "00:00");
        } else if (sortKey === "weekDays") {
          return sortDir === "asc"
            ? weekDays(a).localeCompare(weekDays(b))
            : weekDays(b).localeCompare(weekDays(a));
        } else if (sortKey === "isAirport") {
          A = isAirport(a) ? 1 : 0;
          B = isAirport(b) ? 1 : 0;
        }
        return sortDir === "asc" ? A - B : B - A;
      });
    }

    return arr;
  }, [jobs, selectedJobIds, searchTerm, timeRange, onlyAirport, weekdayFilter, sortKey, sortDir]);

  // Actions
  async function add(jobId: string) {
    if (!employeeId) return;
    try {
      const { data: ok, error } = await supabase.rpc("create_driver_pick", {
        p_employee_id: employeeId,
        p_job_id: jobId,
        p_week_start: weekStart,
        p_preference_rank: (picks.length || 0) + 1,
      });
      if (error) throw error;
      if (ok === true) {
        toast.success("Added to preferences.");
        // refresh picks
        const { data } = await supabase.rpc("list_driver_picks", {
          p_employee_id: employeeId,
          p_week_start: weekStart || null,
        });
        setPicks(data ?? []);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Could not add preference.");
    }
  }

  function moveUp(idx: number) {
    if (idx <= 0 || idx >= picks.length) return;
    const copy = [...picks];
    [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
    // Renumber preference_rank locally
    setPicks(copy.map((p, i) => ({ ...p, preference_rank: i + 1 })));
  }

  function moveDown(idx: number) {
    if (idx < 0 || idx >= picks.length - 1) return;
    const copy = [...picks];
    [copy[idx + 1], copy[idx]] = [copy[idx], copy[idx + 1]];
    setPicks(copy.map((p, i) => ({ ...p, preference_rank: i + 1 })));
  }

  function removeAt(idx: number) {
    const copy = picks.filter((_, i) => i !== idx).map((p, i) => ({ ...p, preference_rank: i + 1 }));
    setPicks(copy);
  }

  // Persist the current local order/ranks
  async function saveAll() {
    if (!employeeId) return;
    try {
      setSaving(true);
      // Persist each row’s rank in order (idempotent; create_driver_pick upserts)
      for (let i = 0; i < picks.length; i++) {
        const p = picks[i];
        const { error } = await supabase.rpc("create_driver_pick", {
          p_employee_id: employeeId,
          p_job_id: p.job_id,
          p_week_start: weekStart,
          p_preference_rank: i + 1,
        });
        if (error) throw error;
      }
      toast.success("Preferences saved.");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  }

  function exit() {
    navigate("/driver-login");
  }

  function printPrefs() {
    const driverName = profile?.name || "Unknown Driver";
    const currentDate = new Date().toLocaleDateString();
    const win = window.open("", "_blank");
    if (!win) return;
    const rows = picks
      .map((p, i) => {
        const job = jobs.find((j) => j.id === p.job_id);
        if (!job) return "";
        return `<tr>
          <td>Pick ${i + 1}</td>
          <td>${jobCode(job)}</td>
          <td>${timeLabel(job) || "-"}</td>
          <td>${weekDays(job)}</td>
          <td>${isAirport(job) ? "Airport" : "Regular"}</td>
        </tr>`;
      })
      .join("");

    win.document.open();
    win.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Job Preferences - ${driverName}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 20px; }
  h1 { margin: 0 0 6px; }
  .info { margin: 10px 0 20px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
  th { background: #f2f2f2; }
</style>
</head>
<body>
  <h1>Job Preferences</h1>
  <div class="info">
    <div><strong>Driver Name:</strong> ${driverName}</div>
    <div><strong>Employee ID:</strong> ${employeeId}</div>
    <div><strong>Week Starting:</strong> ${weekStart}</div>
    <div><strong>Date:</strong> ${currentDate}</div>
  </div>
  <table>
    <thead><tr><th>Preference</th><th>Job ID</th><th>Start Time</th><th>Days of Week</th><th>Location</th></tr></thead>
    <tbody>
      ${
        picks.length
          ? rows
          : `<tr><td colspan="5" style="text-align:center;padding:16px;">No job preferences selected.</td></tr>`
      }
    </tbody>
  </table>
</body>
</html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  }

  // Unique weekday values for filter chips (if your data has them)
  const weekdayOptions = useMemo(() => {
    const s = new Set<string>();
    jobs.forEach((j) => {
      const wd = weekDays(j);
      if (wd && wd !== "-") s.add(wd);
    });
    return Array.from(s);
  }, [jobs]);

  // Header sort toggles
  function toggleSort(key: SortKey) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    }
  }

  if (!employeeId) return null;

  return (
    <div className="min-h-screen bg-[#f7f9fa]">
      {/* Header (mountain style could be added via site-wide layout if you like) */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-blue-900 text-white py-6">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="text-2xl font-bold">Job Preferences</h1>
          <p className="text-white/90">Efficient Workforce Management</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Driver Info Card */}
        <div className="mb-6 rounded-xl border bg-white shadow p-4">
          <div className="grid gap-4 md:grid-cols-4 items-center">
            <div>
              <div className="text-sm text-slate-500">Driver Name</div>
              <div className="text-lg font-medium">{profile?.name || "Unknown Driver"}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Employee ID</div>
              <div className="text-lg font-medium">{employeeId}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Facility</div>
              <div className="text-lg font-medium">
                {profile?.site_id || "Unknown"}
                {profile?.site_id && (
                  <span className="ml-2 rounded border px-2 py-0.5 text-sm">{profile.site_id}</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Seniority Number</div>
              <span className="inline-flex rounded border px-3 py-1 text-base font-bold">{seniority || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Selection Header */}
        <div className="mb-3 text-slate-700">
          <div className="text-base font-semibold">Select Your Job Preferences</div>
          <div className="text-sm">
            Add jobs in order of preference. Your first pick (Pick 1) will be considered first.
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center rounded border px-2 py-0.5 text-sm">
              ✈️ Airport
            </span>
            <span className="text-xs text-slate-600">indicates an airport job requiring certification</span>
          </div>
        </div>

        {/* Controls row */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-700">Week Starting</label>
            <input
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              className="rounded border px-3 py-1.5 outline-none ring-blue-500 focus:ring"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search jobs…"
              className="h-9 w-52 rounded border px-3 outline-none ring-blue-500 focus:ring"
            />
            {/* Airport filter */}
            <select
              className="h-9 rounded border px-2 outline-none ring-blue-500 focus:ring"
              value={onlyAirport === null ? "all" : onlyAirport ? "airport" : "regular"}
              onChange={(e) => {
                const v = e.target.value;
                setOnlyAirport(v === "all" ? null : v === "airport");
              }}
            >
              <option value="all">All Jobs</option>
              <option value="airport">Airport Only</option>
              <option value="regular">Non-Airport</option>
            </select>

            {/* Weekdays filter (if present) */}
            <select
              className="h-9 rounded border px-2 outline-none ring-blue-500 focus:ring"
              value={weekdayFilter ?? ""}
              onChange={(e) => setWeekdayFilter(e.target.value || null)}
            >
              <option value="">All Schedules</option>
              {weekdayOptions.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>

            {/* Time range (simple select to keep it robust) */}
            <select
              className="h-9 rounded border px-2 outline-none ring-blue-500 focus:ring"
              onChange={(e) => {
                const [a, b] = e.target.value.split("-").map(Number);
                setTimeRange([a, b]);
              }}
            >
              <option value={"0-1439"}>Any time</option>
              <option value={`${6 * 60}-${10 * 60}`}>Morning (06:00–10:00)</option>
              <option value={`${10 * 60}-${14 * 60}`}>Midday (10:00–14:00)</option>
              <option value={`${14 * 60}-${18 * 60}`}>Afternoon (14:00–18:00)</option>
              <option value={`${18 * 60}-${23 * 60 + 59}`}>Evening (18:00–23:59)</option>
            </select>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Available Jobs */}
          <div className="md:col-span-2 rounded-xl border bg-white shadow">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="font-semibold">Available Jobs ({availableJobs.length})</div>
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => toggleSort("jobId")}
                  className="rounded border px-2 py-1 hover:bg-slate-50"
                >
                  Job ID {sortKey === "jobId" ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                </button>
                <button
                  onClick={() => toggleSort("startTime")}
                  className="rounded border px-2 py-1 hover:bg-slate-50"
                >
                  Start Time {sortKey === "startTime" ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                </button>
                <button
                  onClick={() => toggleSort("weekDays")}
                  className="rounded border px-2 py-1 hover:bg-slate-50"
                >
                  Days of Week {sortKey === "weekDays" ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                </button>
                <button
                  onClick={() => toggleSort("isAirport")}
                  className="rounded border px-2 py-1 hover:bg-slate-50"
                >
                  Location {sortKey === "isAirport" ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-2 pl-3 text-left">Job ID</th>
                    <th className="p-2 text-left">Start Time</th>
                    <th className="p-2 text-left">Days of Week</th>
                    <th className="p-2 text-left">Location</th>
                    <th className="p-2 pr-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {availableJobs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">
                        No jobs available that match your filters.
                      </td>
                    </tr>
                  ) : (
                    availableJobs.slice(0, 20).map((j) => (
                      <tr key={j.id} className="border-t hover:bg-slate-50/50">
                        <td className="p-2 pl-3">{jobCode(j)}</td>
                        <td className="p-2">{timeLabel(j) || "-"}</td>
                        <td className="p-2">{weekDays(j)}</td>
                        <td className="p-2">
                          {isAirport(j) ? (
                            <span className="inline-flex items-center rounded border px-2 py-0.5 text-xs">
                              ✈️ Airport
                            </span>
                          ) : (
                            "Regular"
                          )}
                        </td>
                        <td className="p-2 pr-3 text-right">
                          <button
                            onClick={() => add(j.id)}
                            className="rounded border px-2 py-1 hover:bg-slate-50"
                          >
                            + Add
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                  {availableJobs.length > 20 && (
                    <tr className="border-t">
                      <td colSpan={5} className="py-2 text-center text-slate-500">
                        + {availableJobs.length - 20} more jobs available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Preferences */}
          <div className="rounded-xl border bg-white shadow">
            <div className="border-b px  -4 py-3 px-4">
              <div className="font-semibold">Your Job Preferences ({picks.length})</div>
            </div>
            <div className="p-4">
              {picks.length === 0 ? (
                <div className="rounded border border-dashed p-6 text-center text-slate-500">
                  No job preferences added yet. Select jobs from the list above.
                </div>
              ) : (
                <div className="space-y-3">
                  {picks.map((p, idx) => {
                    const job = jobs.find((j) => j.id === p.job_id);
                    return (
                      <div key={`${p.job_id}-${p.week_start_date}`} className="flex items-center gap-2">
                        <div className="min-w-[60px] font-medium">Pick {idx + 1}</div>
                        <div className="flex-1 rounded border bg-slate-50/40 p-2">
                          {job ? (
                            <div className="flex items-center gap-2">
                              <span>
                                {jobCode(job)} • {timeLabel(job) || "-"} • {weekDays(job)}
                              </span>
                              {isAirport(job) && (
                                <span className="ml-2 inline-flex items-center rounded border px-2 py-0.5 text-xs">
                                  ✈️ Airport
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500">{p.job_id.slice(0, 8)}…</span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            className="rounded border px-2 py-1 disabled:opacity-50"
                            onClick={() => moveUp(idx)}
                            disabled={idx === 0}
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            className="rounded border px-2 py-1 disabled:opacity-50"
                            onClick={() => moveDown(idx)}
                            disabled={idx === picks.length - 1}
                            title="Move down"
                          >
                            ↓
                          </button>
                          <button
                            className="rounded border px-2 py-1"
                            onClick={() => removeAt(idx)}
                            title="Remove"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 rounded border bg-slate-50 p-3 text-sm text-slate-700">
                {picks.length > 0 ? (
                  <>You’ve selected {picks.length} job{picks.length !== 1 ? "s" : ""}. Jobs are assigned based on seniority and your preference order.</>
                ) : (
                  <>You haven’t selected any jobs. You can still save an empty preference list, but you won’t be assigned a job based on preferences.</>
                )}
              </div>

              <div className="mt-4 flex flex-wrap justify-between gap-2">
                <div className="flex gap-2">
                  <button onClick={exit} className="rounded border px-3 py-2 hover:bg-slate-50">
                    Exit
                  </button>
                  <button onClick={printPrefs} className="rounded border px-3 py-2 hover:bg-slate-50">
                    Print
                  </button>
                </div>
                <button
                  onClick={saveAll}
                  disabled={saving || loading}
                  className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save Preferences"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading && <div className="mt-4 text-sm text-slate-500">Loading…</div>}
      </div>
    </div>
  );
}
