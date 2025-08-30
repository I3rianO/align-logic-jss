// src/pages/DriverPreferencesPage.tsx
/**
 * Job Preferences Page (devv preview version)
 * - Driver info header
 * - Search, filters, sortable columns
 * - Preference list with up/down/remove
 * - Save, Exit, Print
 *
 * Relies on:
 *  - Zustand store: useDriverStore (jobs, drivers, prefs APIs, systemSettings)
 *  - shadcn/ui: Button, Card, Badge, Input, Slider, Popover, Alert
 *  - hooks: useToast, useIsMobile
 *  - MainLayout shell
 */

import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import useDriverStore, { Job } from "@/store/driverStore";
import {
  ChevronDown,
  ChevronUp,
  Info,
  Loader2,
  LogOut,
  Plus,
  Save,
  Trash2,
  Plane,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Filter,
  Printer,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";

type SortKey = keyof Job | "";

interface SortConfig {
  key: SortKey;
  direction: "asc" | "desc";
}

interface FilterConfig {
  startTimeRange: [number, number]; // minutes from midnight
  showAirport: boolean | null; // true=only airport, false=only non-airport, null=all
  weekDays: string | null;
  searchTerm: string;
}

const timeToMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const minutesToTime = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export default function DriverPreferencesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Router state (set by previous page)
  const employeeId = location.state?.employeeId as string | undefined;
  const authenticated = Boolean(location.state?.authenticated);
  const siteId = location.state?.siteId as string | undefined;
  const siteName = location.state?.siteName as string | undefined;
  const companyId = location.state?.companyId as string | undefined;

  // Redirect guards
  useEffect(() => {
    if (!employeeId) {
      navigate("/");
    } else if (!authenticated) {
      navigate("/driver-login", { state: { employeeId } });
    }
  }, [employeeId, authenticated, navigate]);

  // Store bindings
  const {
    jobs,
    drivers,
    systemSettings,
    getDriverPreferences,
    submitPreferences,
    isCutoffActive,
    logDriverActivity,
  } = useDriverStore();

  const driver = useMemo(
    () => drivers.find((d) => d.employeeId === employeeId),
    [drivers, employeeId]
  );

  // cutoff shown only before user starts picking
  const hasStartedRef = React.useRef(false);
  const [isCutoffReached, setIsCutoffReached] = useState(false);
  useEffect(() => {
    if (!hasStartedRef.current) setIsCutoffReached(isCutoffActive);
    if (driver) {
      logDriverActivity({
        driverId: employeeId || "",
        driverName: driver.name,
        action: "view",
        details: "Viewed job preferences page",
      });
    }
  }, [isCutoffActive, employeeId, driver, logDriverActivity]);

  // Existing prefs (array of jobId strings)
  const existing = getDriverPreferences(employeeId || "");
  const [jobPreferences, setJobPreferences] = useState<string[]>(existing || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mark that user has begun once they add a pick (unlocks after-deadline UX)
  useEffect(() => {
    if (jobPreferences.length > 0 && !existing) {
      hasStartedRef.current = true;
    }
  }, [jobPreferences, existing]);

  // Sorting + filtering state
  const [sort, setSort] = useState<SortConfig>({ key: "", direction: "asc" });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterConfig>({
    startTimeRange: [0, 24 * 60 - 1],
    showAirport: null,
    weekDays: null,
    searchTerm: "",
  });

  const handleSort = (key: SortKey) =>
    setSort((prev) =>
      prev.key === key ? { ...prev, direction: prev.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" }
    );

  // Only show jobs from driver's site/company; filter by cert/search/time/type/days; sort
  const filteredSortedJobs = useMemo(() => {
    let list = jobs;

    // Restrict to the driver's site/company
    if (siteId && companyId) {
      list = list.filter((j) => j.siteId === siteId && j.companyId === companyId);
    } else if (driver) {
      list = list.filter((j) => j.siteId === driver.siteId && j.companyId === driver.companyId);
    }

    // Remove airport for non-certified drivers
    if (driver && !driver.airportCertified) list = list.filter((j) => !j.isAirport);

    // Search
    if (filters.searchTerm.trim()) {
      const t = filters.searchTerm.toLowerCase();
      list = list.filter(
        (j) =>
          j.jobId.toLowerCase().includes(t) ||
          j.startTime.toLowerCase().includes(t) ||
          j.weekDays.toLowerCase().includes(t)
      );
    }

    // Time range
    list = list.filter((j) => {
      const m = timeToMinutes(j.startTime);
      return m >= filters.startTimeRange[0] && m <= filters.startTimeRange[1];
    });

    // Airport toggle
    if (filters.showAirport !== null) list = list.filter((j) => j.isAirport === filters.showAirport);

    // Days
    if (filters.weekDays) list = list.filter((j) => j.weekDays.includes(filters.weekDays!));

    // Sort
    if (sort.key) {
      list = [...list].sort((a, b) => {
        if (sort.key === "startTime") {
          const A = timeToMinutes(a.startTime);
          const B = timeToMinutes(b.startTime);
          return sort.direction === "asc" ? A - B : B - A;
        }
        const A = (a[sort.key] as string).toString();
        const B = (b[sort.key] as string).toString();
        return sort.direction === "asc" ? A.localeCompare(B) : B.localeCompare(A);
      });
    }

    return list;
  }, [jobs, driver, siteId, companyId, filters, sort]);

  // Jobs not yet in preferences
  const availableJobs = useMemo(
    () => filteredSortedJobs.filter((j) => !jobPreferences.includes(j.jobId)),
    [filteredSortedJobs, jobPreferences]
  );

  // Pref ops
  const addJobPreference = (jobId: string) => setJobPreferences((p) => (p.includes(jobId) ? p : [...p, jobId]));
  const removeJobPreference = (idx: number) => setJobPreferences((p) => p.filter((_, i) => i !== idx));
  const moveJobUp = (idx: number) =>
    setJobPreferences((p) => (idx === 0 ? p : p.map((x, i) => (i === idx ? p[idx - 1] : i === idx - 1 ? p[idx] : x))));
  const moveJobDown = (idx: number) =>
    setJobPreferences((p) =>
      idx === p.length - 1 ? p : p.map((x, i) => (i === idx ? p[idx + 1] : i === idx + 1 ? p[idx] : x))
    );

  // Save prefs (stay on page)
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 400)); // small UX delay
      submitPreferences({
        driverId: employeeId || "",
        preferences: jobPreferences,
        submissionTime: new Date().toISOString(),
      });
      toast({
        title: "Preferences Saved",
        description:
          jobPreferences.length === 0
            ? "You've saved an empty preference list. No jobs will be assigned based on preferences."
            : "Your job preferences have been successfully submitted.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const exit = () => navigate("/");

  // Reset filters
  const resetFilters = () =>
    setFilters({
      startTimeRange: [0, 24 * 60 - 1],
      showAirport: null,
      weekDays: null,
      searchTerm: "",
    });

  // Distinct weekdays for filter chips
  const weekDayOptions = useMemo(() => Array.from(new Set(jobs.map((j) => j.weekDays))), [jobs]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (filters.startTimeRange[0] > 0 || filters.startTimeRange[1] < 24 * 60 - 1) c++;
    if (filters.showAirport !== null) c++;
    if (filters.weekDays !== null) c++;
    if (filters.searchTerm.trim()) c++;
    return c;
  }, [filters]);

  // Print
  const printJobPreferences = () => {
    const win = window.open("", "_blank");
    if (!win) return;

    const driverName = driver?.name || "Unknown Driver";
    const seniority = driver?.seniorityNumber || "N/A";
    const date = new Date().toLocaleDateString();

    const rows =
      jobPreferences.length === 0
        ? `<tr><td colspan="5" style="text-align:center;padding:20px;">No job preferences selected.</td></tr>`
        : jobPreferences
            .map((jobId, idx) => {
              const j = jobs.find((x) => x.jobId === jobId);
              if (!j) return "";
              return `<tr>
                <td>Pick ${idx + 1}</td>
                <td>${j.jobId}</td>
                <td>${j.startTime}</td>
                <td>${j.weekDays}</td>
                <td>${j.isAirport ? "Airport" : "Regular"}</td>
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
    body{font-family:Arial, sans-serif; padding:20px;}
    h1{margin:0 0 6px;}
    .row{display:flex; margin:4px 0;}
    .label{width:160px; font-weight:bold;}
    table{width:100%; border-collapse:collapse; margin-top:16px;}
    th,td{border:1px solid #ddd; padding:8px; text-align:left;}
    th{background:#f2f2f2;}
  </style>
</head>
<body>
  <h1>Job Preferences</h1>
  <div class="row"><div class="label">Driver Name:</div><div>${driverName}</div></div>
  <div class="row"><div class="label">Employee ID:</div><div>${employeeId}</div></div>
  <div class="row"><div class="label">Seniority Number:</div><div>${seniority}</div></div>
  <div class="row"><div class="label">Date Submitted:</div><div>${date}</div></div>

  <table>
    <thead><tr><th>Preference</th><th>Job ID</th><th>Start Time</th><th>Days of Week</th><th>Location</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`);
    win.document.close();

    setTimeout(() => {
      win.print();
      if (driver) {
        logDriverActivity({
          driverId: employeeId || "",
          driverName: driver.name,
          action: "view",
          details: "Printed job preferences",
        });
      }
    }, 300);
  };

  if (isCutoffReached && !hasStartedRef.current) {
    return (
      <MainLayout title="Job Preferences">
        <div className="jss-container py-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Job Selection Closed</CardTitle>
              <CardDescription className="text-center">
                The job selection period has ended. Contact your supervisor if you need assistance.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
              <Button onClick={exit}>Return to Home</Button>
            </CardFooter>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Job Preferences">
      <div className="jss-container py-8">
        {/* Driver Info */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Driver Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4 items-center">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Driver Name</p>
                <p className="text-lg font-medium">{driver?.name || "Unknown Driver"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Employee ID</p>
                <p className="text-lg font-medium">{employeeId}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Facility</p>
                <p className="text-lg font-medium">
                  {siteName || driver?.siteId || "Unknown"}
                  <Badge variant="outline" className="ml-2">
                    {siteId || driver?.siteId || ""}
                  </Badge>
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Seniority Number</p>
                <Badge variant="outline" className="text-base px-3 py-1 font-bold">
                  {driver?.seniorityNumber || "N/A"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selection Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Select Your Job Preferences</CardTitle>
            <CardDescription>
              Add jobs in order of preference. Your first pick (Pick 1) will be considered first.
              <div className="mt-2">
                <Badge variant="outline" className="flex items-center w-fit">
                  <Plane size={14} className="mr-1" /> Airport
                </Badge>
                <span className="text-xs ml-2">indicates an airport job requiring certification</span>
              </div>
              {driver && !driver.airportCertified && (
                <Alert className="mt-2">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Airport jobs are not displayed as you are not airport certified.
                  </AlertDescription>
                </Alert>
              )}
            </CardDescription>
            {isCutoffActive && hasStartedRef.current && (
              <Alert className="mt-2 bg-yellow-50 border-yellow-200">
                <Info className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-sm text-yellow-700">
                  Note: The selection deadline has passed, but you can still complete and submit your current selections.
                </AlertDescription>
              </Alert>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Filters / search */}
            <div className="overflow-x-auto">
              <div className="flex justify-between mb-3 items-center">
                <h3 className="text-sm font-semibold">Available Jobs ({availableJobs.length})</h3>

                <div className="flex gap-2">
                  {/* Search */}
                  <div className="relative w-[200px]">
                    <Input
                      placeholder="Search jobs..."
                      value={filters.searchTerm}
                      onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                      className="h-9 pl-8"
                    />
                    <div className="absolute left-2 top-2 text-muted-foreground">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                    </div>
                  </div>

                  {/* Filter popover */}
                  <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="relative">
                        <Filter size={16} className="mr-2" />
                        Filter
                        {activeFilterCount > 0 && (
                          <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs">
                            {activeFilterCount}
                          </Badge>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                      <div className="space-y-4 p-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">Filter Jobs</h4>
                          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-xs">
                            Reset
                          </Button>
                        </div>

                        {/* Time range */}
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">Start Time Range</h5>
                          <div className="px-2">
                            <div className="relative mt-6 mb-6">
                              <Slider
                                value={filters.startTimeRange}
                                min={0}
                                max={24 * 60 - 1}
                                step={15}
                                onValueChange={(v) =>
                                  setFilters({ ...filters, startTimeRange: [v[0], v[1]] as [number, number] })
                                }
                                className="my-6"
                              />
                              {/* decorative end handles */}
                              <div
                                className="absolute w-4 h-4 bg-white border-2 border-primary rounded-full shadow-md"
                                style={{
                                  left: `calc(${(filters.startTimeRange[0] / (24 * 60 - 1)) * 100}% - 8px)`,
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  zIndex: 10,
                                }}
                              />
                              <div
                                className="absolute w-4 h-4 bg-white border-2 border-primary rounded-full shadow-md"
                                style={{
                                  left: `calc(${(filters.startTimeRange[1] / (24 * 60 - 1)) * 100}% - 8px)`,
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  zIndex: 10,
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{minutesToTime(filters.startTimeRange[0])}</span>
                            <span>{minutesToTime(filters.startTimeRange[1])}</span>
                          </div>
                        </div>

                        {/* Airport filter (only if certified) */}
                        {driver?.airportCertified && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium">Job Type</h5>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant={filters.showAirport === null ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => setFilters({ ...filters, showAirport: null })}
                                className="text-xs h-7"
                              >
                                All Jobs
                              </Button>
                              <Button
                                variant={filters.showAirport === true ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => setFilters({ ...filters, showAirport: true })}
                                className="text-xs h-7"
                              >
                                <Plane size={12} className="mr-1" />
                                Airport Only
                              </Button>
                              <Button
                                variant={filters.showAirport === false ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => setFilters({ ...filters, showAirport: false })}
                                className="text-xs h-7"
                              >
                                Non-Airport
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Weekdays */}
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">Week Days</h5>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant={filters.weekDays === null ? "secondary" : "outline"}
                              size="sm"
                              onClick={() => setFilters({ ...filters, weekDays: null })}
                              className="text-xs h-7"
                            >
                              All Schedules
                            </Button>
                            {weekDayOptions.map((opt) => (
                              <Button
                                key={opt}
                                variant={filters.weekDays === opt ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => setFilters({ ...filters, weekDays: opt })}
                                className="text-xs h-7"
                              >
                                {opt}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Table */}
              <div className="border rounded-md">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="font-semibold text-left p-2 pl-3 text-sm cursor-pointer" onClick={() => handleSort("jobId")}>
                        <div className="flex items-center">
                          Job ID
                          {sort.key === "jobId" ? (sort.direction === "asc" ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />) : <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />}
                        </div>
                      </th>
                      <th className="font-semibold text-left p-2 text-sm cursor-pointer" onClick={() => handleSort("startTime")}>
                        <div className="flex items-center">
                          Start Time
                          {sort.key === "startTime" ? (sort.direction === "asc" ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />) : <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />}
                        </div>
                      </th>
                      <th className="font-semibold text-left p-2 text-sm cursor-pointer" onClick={() => handleSort("weekDays")}>
                        <div className="flex items-center">
                          Days of Week
                          {sort.key === "weekDays" ? (sort.direction === "asc" ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />) : <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />}
                        </div>
                      </th>
                      <th className="font-semibold text-left p-2 text-sm cursor-pointer" onClick={() => handleSort("isAirport")}>
                        <div className="flex items-center">
                          Location
                          {sort.key === "isAirport" ? (sort.direction === "asc" ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />) : <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />}
                        </div>
                      </th>
                      <th className="font-semibold text-right p-2 pr-3 text-sm">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableJobs.length > 0 ? (
                      availableJobs.slice(0, 10).map((job) => (
                        <tr key={job.jobId} className="border-t hover:bg-muted/30">
                          <td className="p-2 pl-3 text-sm">{job.jobId}</td>
                          <td className="p-2 text-sm">{job.startTime}</td>
                          <td className="p-2 text-sm">{job.weekDays}</td>
                          <td className="p-2 text-sm">
                            {job.isAirport ? (
                              <Badge variant="outline" className="flex items-center w-fit">
                                <Plane size={12} className="mr-1" /> Airport
                              </Badge>
                            ) : (
                              "Regular"
                            )}
                          </td>
                          <td className="p-2 pr-3 text-right">
                            <Button size="sm" variant="ghost" onClick={() => addJobPreference(job.jobId)} className="h-7">
                              <Plus size={14} className="mr-1" /> Add
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-4 text-muted-foreground">
                          No jobs available that match your filters
                        </td>
                      </tr>
                    )}
                    {availableJobs.length > 10 && (
                      <tr className="border-t">
                        <td colSpan={5} className="text-center py-2 text-sm text-muted-foreground">
                          + {availableJobs.length - 10} more jobs available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Preferences */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold mb-3">Your Job Preferences ({jobPreferences.length})</h3>
              {jobPreferences.length === 0 ? (
                <div className="text-center p-6 border border-dashed rounded-md">
                  <p className="text-muted-foreground">No job preferences added yet. Select jobs from the list above.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobPreferences.map((jobId, index) => {
                    const job = jobs.find((j) => j.jobId === jobId);
                    return (
                      <div key={`${jobId}-${index}`} className="flex items-center gap-2">
                        <div className="min-w-[60px] font-medium">Pick {index + 1}</div>
                        <div className="flex-1 border rounded-md p-2 bg-muted/20">
                          <div className="flex items-center">
                            <span>
                              {jobId} • {job?.startTime} • {job?.weekDays}
                              {job?.isAirport && (
                                <Badge variant="outline" className="ml-2 flex items-center inline-flex">
                                  <Plane size={14} className="mr-1" /> Airport
                                </Badge>
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="outline" size="icon" onClick={() => moveJobUp(index)} disabled={index === 0}>
                            <ChevronUp size={18} />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => moveJobDown(index)}
                            disabled={index === jobPreferences.length - 1}
                          >
                            <ChevronDown size={18} />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => removeJobPreference(index)}>
                            <Trash2 size={18} className="text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <Alert className="bg-muted/50 mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {jobPreferences.length > 0 ? (
                    <>
                      You've selected {jobPreferences.length} job{jobPreferences.length !== 1 ? "s" : ""}. Jobs will be
                      assigned based on seniority and your preference order.
                    </>
                  ) : (
                    <>
                      You haven't selected any jobs. You can still save an empty preference list, but you won't be
                      assigned a job based on your preferences.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between flex-wrap gap-2">
            <div className="flex gap-2">
              <Button variant="outline" onClick={exit}>
                <LogOut size={18} className="mr-1" /> Exit
              </Button>

              {systemSettings.allowDriverPrinting && (
                <Button variant="outline" onClick={printJobPreferences}>
                  <Printer size={18} className="mr-1" /> Print
                </Button>
              )}
            </div>

            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="mr-1 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-1" /> Save Preferences
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
}
