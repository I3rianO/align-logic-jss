import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";

// ---- Types
type Job = {
  id: string;            // stable identifier stored in prefs
  title: string;         // label in UI
  time: string;          // small caption
};

// You can keep expanding this list or replace with a DB-driven list later.
// IMPORTANT: ids here are what get saved into driver_preferences.prefs
const AVAILABLE_JOBS: Job[] = [
  { id: "JOB-100", title: "AM Loop", time: "06:15" },
  { id: "JOB-101", title: "AM Bulk", time: "07:00" },
  { id: "JOB-102", title: "AM Core", time: "08:00" },
  { id: "JOB-103", title: "Morning Sort", time: "08:00" },
  { id: "JOB-104", title: "Day Sort", time: "09:00" },
  { id: "JOB-105", title: "Late AM Run", time: "10:30" },
  { id: "JOB-106", title: "Afternoon", time: "14:00" },
  { id: "JOB-107", title: "Evening", time: "17:00" },
  { id: "JOB-108", title: "Route 8 - Downtown Express", time: "06:00" },
  { id: "JOB-109", title: "Route 15 - Airport Shuttle", time: "10:00" },
  { id: "JOB-110", title: "Route 3 - University Loop", time: "07:00" },
  { id: "JOB-111", title: "Route 22 - Shopping District", time: "12:00" },
];

// Renders a pill-like button
function SmallButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return (
    <button
      {...rest}
      className={
        "px-3 py-1 text-sm rounded-md border border-neutral-300 hover:bg-neutral-50 active:bg-neutral-100 " +
        className
      }
    />
  );
}

export default function DriverPreferencesPage() {
  const [search] = useSearchParams();
  const navigate = useNavigate();

  // Accept “emplid” param (consistent with the rest of the flow)
  const employeeId = useMemo(() => {
    const v =
      search.get("emplid") ||
      search.get("empId") ||
      search.get("employee_id") ||
      "";
    return (v || "").trim();
  }, [search]);

  // Driver info (optional: shown at the top)
  const [driverName, setDriverName] = useState<string>("");

  // Selected job ids (the array we persist in prefs)
  const [selected, setSelected] = useState<string[]>([]);

  // Page state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>("");

  // Derived map for quick lookups
  const jobsById = useMemo(() => {
    const m = new Map<string, Job>();
    for (const j of AVAILABLE_JOBS) m.set(j.id, j);
    return m;
  }, []);

  // Load: driver name + existing preferences
  useEffect(() => {
    // guard if missing employee id
    if (!employeeId) return;

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setStatus("Loading driver and preferences...");

        // 1) driver name (optional/nice to have)
        const { data: dRow, error: dErr } = await supabase
          .from("drivers")
          .select("name")
          .eq("employee_id", employeeId)
          .maybeSingle();
        if (dErr) {
          // don't fail page—just note it
          console.warn("drivers lookup error:", dErr.message);
        } else if (!cancelled && dRow?.name) {
          setDriverName(dRow.name);
        }

        // 2) preferences
        const { data: pRow, error: pErr } = await supabase
          .from("driver_preferences")
          .select("prefs")
          .eq("employee_id", employeeId)
          .maybeSingle();

        if (pErr) {
          console.warn("prefs select error:", pErr.message);
        }

        if (!cancelled) {
          if (pRow?.prefs && Array.isArray(pRow.prefs)) {
            // ensure strings
            setSelected(
              pRow.prefs.map((x: any) => String(x)).filter(Boolean)
            );
          } else {
            setSelected([]);
          }
          setStatus("");
        }
      } catch (e: any) {
        console.error(e);
        if (!cancelled) {
          setStatus("Failed to load data.");
          alert("Failed to load preferences. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  // Add / remove handlers (de-duplicate, keep order of selection)
  function addJob(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }
  function removeJob(id: string) {
    setSelected((prev) => prev.filter((x) => x !== id));
  }
  function moveUp(idx: number) {
    setSelected((prev) => {
      if (idx <= 0 || idx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
      return copy;
    });
  }
  function moveDown(idx: number) {
    setSelected((prev) => {
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const copy = [...prev];
      [copy[idx + 1], copy[idx]] = [copy[idx], copy[idx + 1]];
      return copy;
    });
  }

  // Save → upsert to driver_preferences
  async function handleSave() {
    if (!employeeId) {
      alert("Missing employee ID. Please return to login.");
      return navigate("/driver-login");
    }

    setSaving(true);
    setStatus("Saving preferences...");

    // You may change these hard-coded values if you want to record company/site
    const company_id = "JACFL";
    const site_id = "JACFL";

    try {
      const { error } = await supabase.from("driver_preferences").upsert(
        {
          employee_id: employeeId,
          company_id,
          site_id,
          prefs: selected, // stored as jsonb array
          updated_at: new Date().toISOString(),
        },
        { onConflict: "employee_id" }
      );

      if (error) {
        console.error("upsert error:", error.message);
        setStatus("Save failed.");
        alert("Could not save preferences. Please try again.");
        return;
      }

      setStatus("Saved.");
      // Optional: navigate somewhere after save
      // navigate("/some/next/page");
      alert("Preferences saved!");
    } catch (e: any) {
      console.error(e);
      setStatus("Save failed.");
      alert("Could not save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // Exit (go back to login)
  function handleExit() {
    navigate("/driver-login");
  }

  if (!employeeId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          Missing employee id. Please return to Login.
        </div>
        <div className="mt-4">
          <SmallButton onClick={() => navigate("/driver-login")}>
            Back to Login
          </SmallButton>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Driver banner */}
      <div className="mb-4 rounded-md border border-neutral-200 bg-white p-3 text-sm">
        <div className="font-medium">Driver Information</div>
        <div className="text-neutral-600">
          {driverName ? `${driverName}  |  ` : null}
          Employee ID: {employeeId}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Available Jobs */}
        <div className="md:col-span-2 rounded-md border border-neutral-200 bg-white p-4">
          <div className="font-semibold mb-2">Available Jobs</div>
          <div className="space-y-2">
            {AVAILABLE_JOBS.map((job) => {
              const added = selected.includes(job.id);
              return (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-md border border-neutral-200 p-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{job.title}</div>
                    <div className="text-xs text-neutral-500">{job.time}</div>
                  </div>

                  <div className="shrink-0">
                    {!added ? (
                      <SmallButton onClick={() => addJob(job.id)}>Add</SmallButton>
                    ) : (
                      <SmallButton
                        className="bg-neutral-100"
                        onClick={() => removeJob(job.id)}
                      >
                        Remove
                      </SmallButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected */}
        <div className="rounded-md border border-neutral-200 bg-white p-4">
          <div className="font-semibold mb-2">Your Job Preferences</div>

          {selected.length === 0 ? (
            <div className="text-sm text-neutral-500">
              You haven’t selected any jobs yet.
            </div>
          ) : (
            <ol className="list-decimal pl-5 space-y-2">
              {selected.map((id, idx) => {
                const job = jobsById.get(id);
                return (
                  <li key={id} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {job?.title ?? id}
                      </div>
                      {job?.time ? (
                        <div className="text-xs text-neutral-500">{job.time}</div>
                      ) : null}
                    </div>
                    <div className="shrink-0 space-x-2">
                      <SmallButton onClick={() => moveUp(idx)}>↑</SmallButton>
                      <SmallButton onClick={() => moveDown(idx)}>↓</SmallButton>
                      <SmallButton onClick={() => removeJob(id)}>Remove</SmallButton>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="mt-4 flex flex-col gap-2">
            <button
              disabled={saving || loading}
              onClick={handleSave}
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Preferences"}
            </button>
            <button
              onClick={handleExit}
              className="inline-flex items-center justify-center rounded-md border border-neutral-300 px-4 py-2 hover:bg-neutral-50"
            >
              Exit
            </button>

            {status ? (
              <div className="text-xs text-neutral-500 mt-1">{status}</div>
            ) : null}
          </div>
        </div>
      </div>

      {loading && (
        <div className="mt-4 text-sm text-neutral-500">Loading…</div>
      )}
    </div>
  );
}
