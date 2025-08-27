export type Driver = {
  employee_id: string;
  name?: string | null;
  status?: string | null;
  company_id: string;
  site_id: string;
};

export type Job = {
  job_id: string;
  start_time?: string | null;
  week_days?: string | null;
  location?: string | null;
  is_airport?: boolean | null;
  company_id: string;
  site_id: string;
};

export type DriverPick = {
  employee_id: string;
  job_id: string;
  rank: number;
  company_id: string;
  site_id: string;
  // add other columns here if you have them (e.g., created_at)
};
