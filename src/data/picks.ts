import { supabase } from "@/lib/supabase";
import type { DriverPick } from "@/types/db";

export async function getDriverPicks(employeeId: string, companyId: string, siteId: string) {
  const { data, error } = await supabase
    .from("driver_picks")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("company_id", companyId)
    .eq("site_id", siteId)
    .order("rank", { ascending: true });

  if (error) throw error;
  return (data ?? []) as DriverPick[];
}

export async function saveDriverPick(row: DriverPick) {
  const { data, error } = await supabase
    .from("driver_picks")
    .upsert(row)
    .select()
    .single();

  if (error) throw error;
  return data as DriverPick;
}

export async function deleteDriverPick(employeeId: string, jobId: string, companyId: string, siteId: string) {
  const { error } = await supabase
    .from("driver_picks")
    .delete()
    .eq("employee_id", employeeId)
    .eq("job_id", jobId)
    .eq("company_id", companyId)
    .eq("site_id", siteId);

  if (error) throw error;
}
