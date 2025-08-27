import { supabase } from "@/lib/supabase";
import type { Job } from "@/types/db";

export async function getJobs(companyId: string, siteId: string) {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("company_id", companyId)
    .eq("site_id", siteId)
    .order("job_id", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Job[];
}

export async function upsertJob(row: Job) {
  const { data, error } = await supabase
    .from("jobs")
    .upsert(row)
    .select()
    .single();

  if (error) throw error;
  return data as Job;
}

export async function deleteJob(jobId: string, companyId: string, siteId: string) {
  const { error } = await supabase
    .from("jobs")
    .delete()
    .eq("job_id", jobId)
    .eq("company_id", companyId)
    .eq("site_id", siteId);

  if (error) throw error;
}
