import { supabase } from "@/lib/supabase";

export type DriverPrefsRow = {
  employee_id: string;
  company_id?: string | null;
  site_id?: string | null;
  prefs: string[];         // ranked jobIds
  updated_at?: string;
};

export async function getDriverPreferencesDB(employeeId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("driver_preferences")
    .select("prefs")
    .eq("employee_id", employeeId)
    .maybeSingle();

  if (error) throw error;
  return (data?.prefs as string[]) ?? [];
}

export async function saveDriverPreferencesDB(
  employeeId: string,
  rankedJobIds: string[],
  companyId?: string,
  siteId?: string
): Promise<void> {
  const row: DriverPrefsRow = {
    employee_id: employeeId,
    company_id: companyId ?? null,
    site_id: siteId ?? null,
    prefs: rankedJobIds,
  };

  const { error } = await supabase
    .from("driver_preferences")
    .upsert(row, { onConflict: "employee_id" });

  if (error) throw error;
}
