import { supabase } from "@/lib/supabase";
import type { Driver } from "@/types/db";

export async function getDrivers(companyId: string, siteId: string) {
  const { data, error } = await supabase
    .from("drivers")
    .select("*")
    .eq("company_id", companyId)
    .eq("site_id", siteId)
    .order("employee_id", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Driver[];
}

export async function upsertDriver(row: Driver) {
  const { data, error } = await supabase
    .from("drivers")
    .upsert(row)
    .select()
    .single();

  if (error) throw error;
  return data as Driver;
}

export async function deleteDriver(employeeId: string, companyId: string, siteId: string) {
  const { error } = await supabase
    .from("drivers")
    .delete()
    .eq("employee_id", employeeId)
    .eq("company_id", companyId)
    .eq("site_id", siteId);

  if (error) throw error;
}
