import React, { useState } from "react";
import { supabase } from "@/lib/supabase";

// Helper: nice time string
const nowIso = () => new Date().toISOString();

export default function HealthCheck() {
  const [status, setStatus] = useState<
    "idle" | "running" | "ok" | "warn" | "fail"
  >("idle");
  const [log, setLog] = useState<string[]>([]);

  const add = (line: string) => setLog((l) => [...l, line]);

  const run = async () => {
    setStatus("running");
    setLog([]);

    try {
      add("▶ Checking Supabase connectivity (read test: `sites`)…");
      const sites = await supabase.from("sites").select("*").limit(5);

      if (sites.error) {
        add(`❌ READ failed: ${sites.error.message}`);
        setStatus("fail");
        return;
      }

      add(`✅ READ ok: received ${sites.data?.length ?? 0} rows from 'sites'.`);

      add("▶ Writing health row to `activity_log`…");
      const stamp = nowIso();
      const payload = {
        event: "health_check",
        details: `browser=${navigator.userAgent}`,
        created_at: stamp, // if your table has a default, this is fine to include or omit
      };

      const insert = await supabase.from("activity_log").insert(payload).select("*").single();

      if (insert.error) {
        add(`❌ WRITE failed: ${insert.error.message}`);
        setStatus("fail");
        return;
      }

      add(`✅ WRITE ok: id=${(insert.data as any)?.id ?? "n/a"} at ${stamp}`);

      add("▶ Verifying the inserted row exists (read-back) …");
      const check = await supabase
        .from("activity_log")
        .select("*")
        .eq("event", "health_check")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (check.error) {
        add(`❌ READ-BACK failed: ${check.error.message}`);
        setStatus("warn");
        return;
      }

      add("✅ READ-BACK ok: row is visible.");
      setStatus("ok");
    } catch (err: any) {
      add(`❌ Unexpected error: ${err?.message ?? String(err)}`);
      setStatus("fail");
    }
  };

  const badge =
    status === "ok"
      ? "bg-green-600"
      : status === "warn"
      ? "bg-yellow-500"
      : status === "fail"
      ? "bg-red-600"
      : status === "running"
      ? "bg-blue-600"
      : "bg-slate-500";

  return (
    <div className="min-h-screen p-8 bg-slate-50">
      <div className="max-w-2xl mx-auto bg-white shadow rounded-lg p-6 border">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Health Check</h1>
          <span className={`text-white text-sm px-3 py-1 rounded ${badge}`}>
            {status.toUpperCase()}
          </span>
        </div>

        <p className="mt-4 text-slate-600">
          This runs 3 checks: (1) read from <code>sites</code>, (2) write a row to{" "}
          <code>activity_log</code>, (3) read it back.
        </p>

        <button
          onClick={run}
          className="mt-6 inline-flex items-center px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          disabled={status === "running"}
        >
          {status === "running" ? "Running…" : "Run Tests"}
        </button>

        <pre className="mt-6 bg-slate-900 text-slate-100 rounded p-4 overflow-auto text-sm leading-6">
{log.join("\n")}
        </pre>

        <p className="mt-4 text-sm text-slate-500">
          You can verify the write by running:
          <br />
          <code>SELECT * FROM activity_log WHERE event = 'health_check' ORDER BY created_at DESC LIMIT 10;</code>
          <br />
          in Supabase &rarr; SQL Editor.
        </p>
      </div>
    </div>
  );
}
