import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import useDriverStore from '@/store/driverStore';
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
  Printer
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Job } from '@/store/driverStore';
import { useIsMobile } from '@/hooks/use-mobile';

// Supabase client
import { supabase, signOutKiosk } from '@/lib/supabase';

interface SortConfig {
  key: keyof Job | '';
  direction: 'asc' | 'desc';
}

interface FilterConfig {
  startTimeRange: [number, number];
  showAirport: boolean | null;
  weekDays: string | null;
  searchTerm: string;
}

const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

function DriverPreferencesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isMobileDevice = useIsMobile();

  const employeeId: string | undefined = location.state?.employeeId;
  const authenticated: boolean | undefined = location.state?.authenticated;
  const siteId: string | undefined = location.state?.siteId;
  const siteName: string | undefined = location.state?.siteName;
  const companyId: string | undefined = location.state?.companyId;

  useEffect(() => {
    if (!employeeId) {
      navigate('/');
    } else if (!authenticated) {
      navigate('/driver-login', { state: { employeeId } });
    }
  }, [employeeId, authenticated, navigate]);

  const {
    jobs,
    submitPreferences,
    getDriverPreferences,
    isCutoffActive,
    drivers,
    systemSettings,
    logDriverActivity
  } = useDriverStore();

  const driverInfo = drivers.find(d => d.employeeId === employeeId);

  const hasStartedRef = React.useRef(false);
  const [isCutoffReached, setIsCutoffReached] = useState<boolean>(false);

  useEffect(() => {
    if (!hasStartedRef.current) setIsCutoffReached(isCutoffActive);
    if (driverInfo) {
      logDriverActivity({
        driverId: employeeId || '',
        driverName: driverInfo.name,
        action: 'view',
        details: 'Viewed job preferences page'
      });
    }
  }, [isCutoffActive, employeeId, driverInfo, logDriverActivity]);

  const storeExisting = getDriverPreferences(employeeId || '');
  const [jobPreferences, setJobPreferences] = useState<string[]>(storeExisting || []);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: 'asc' });
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    startTimeRange: [0, 24 * 60 - 1],
    showAirport: null,
    weekDays: null,
    searchTerm: ''
  });

  useEffect(() => {
    if (jobPreferences.length > 0 && !storeExisting) {
      hasStartedRef.current = true;
    }
  }, [jobPreferences, storeExisting]);

  // ====== SUPABASE: LOAD DRIVER PICKS ======
  useEffect(() => {
    const loadPicks = async () => {
      if (!employeeId) return;
      const { data, error } = await supabase
        .from('driver_picks')
        .select('job_id, preference_rank')
        .eq('driver_id', employeeId)
        .order('preference_rank', { ascending: true });

      if (error) {
        console.error('Load picks error:', error);
        return;
      }
      if (data && data.length) {
        setJobPreferences(data.map(r => r.job_id));
        hasStartedRef.current = true;
      }
    };
    loadPicks();
  }, [employeeId]);

  const handleSort = (key: keyof Job) => {
    setSortConfig(prev =>
      prev.key === key ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' }
    );
  };

  const sortAndFilterJobs = (jobsToSort: Job[]): Job[] => {
    let result = [...jobsToSort];
    if (siteId && companyId) {
      result = result.filter(j => j.siteId === siteId && j.companyId === companyId);
    } else if (driverInfo) {
      result = result.filter(j => j.siteId === driverInfo.siteId && j.companyId === driverInfo.companyId);
    }
    if (driverInfo && !driverInfo.airportCertified) {
      result = result.filter(j => !j.isAirport);
    }
    if (filterConfig.searchTerm.trim() !== '') {
      const term = filterConfig.searchTerm.toLowerCase();
      result = result.filter(
        j =>
          j.jobId.toLowerCase().includes(term) ||
          j.startTime.toLowerCase().includes(term) ||
          j.weekDays.toLowerCase().includes(term)
      );
    }
    result = result.filter(j => {
      const m = timeToMinutes(j.startTime);
      return m >= filterConfig.startTimeRange[0] && m <= filterConfig.startTimeRange[1];
    });
    if (filterConfig.showAirport !== null) {
      result = result.filter(j => j.isAirport === filterConfig.showAirport);
    }
    if (filterConfig.weekDays) {
      result = result.filter(j => j.weekDays.includes(filterConfig.weekDays!));
    }
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (sortConfig.key === 'startTime') {
          const ta = timeToMinutes(a.startTime);
          const tb = timeToMinutes(b.startTime);
          return sortConfig.direction === 'asc' ? ta - tb : tb - ta;
        }
        const ka = a[sortConfig.key] as any;
        const kb = b[sortConfig.key] as any;
        if (ka < kb) return sortConfig.direction === 'asc' ? -1 : 1;
        if (ka > kb) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  };

  const sortedJobs = sortAndFilterJobs(jobs);
  const availableJobs = sortedJobs.filter(j => !jobPreferences.includes(j.jobId));

  const addJobPreference = (jobId: string) => setJobPreferences(prev => [...prev, jobId]);
  const removeJobPreference = (index: number) => setJobPreferences(prev => prev.filter((_, i) => i !== index));
  const moveJobUp = (index: number) => {
    if (index === 0) return;
    const next = [...jobPreferences];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setJobPreferences(next);
  };
  const moveJobDown = (index: number) => {
    if (index === jobPreferences.length - 1) return;
    const next = [...jobPreferences];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setJobPreferences(next);
  };

  // ====== SUPABASE: SAVE PICKS ======
  const persistToSupabase = async (picks: string[]) => {
    if (!employeeId) return;
    const { error: delErr } = await supabase.from('driver_picks').delete().eq('driver_id', employeeId);
    if (delErr) throw delErr;

    if (picks.length === 0) return;

    const nowIso = new Date().toISOString();
    const rows = picks.map((jobId, idx) => ({
      driver_id: employeeId,
      job_id: jobId,
      preference_rank: idx + 1,
      submitted_at: nowIso,
      site_id: siteId ?? driverInfo?.siteId ?? null,
      company_id: companyId ?? driverInfo?.companyId ?? null
    }));

    const { error: upErr } = await supabase.from('driver_picks').insert(rows);
    if (upErr) throw upErr;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await persistToSupabase(jobPreferences);
      submitPreferences({
        driverId: employeeId || '',
        preferences: jobPreferences,
        submissionTime: new Date().toISOString()
      });
      toast({
        title: 'Preferences Saved',
        description:
          jobPreferences.length === 0
            ? "You've saved an empty preference list."
            : 'Your job preferences have been successfully submitted.'
      });
      if (driverInfo) {
        logDriverActivity({
          driverId: employeeId || '',
          driverName: driverInfo.name,
          action: 'save',
          details: `Saved ${jobPreferences.length} picks`
        });
      }
      hasStartedRef.current = true;
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Save Failed',
        description: 'We could not save your preferences. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ====== EXIT: SIGN OUT + RETURN TO HOME ======
  const exitPage = async () => {
    await signOutKiosk();         // clear in-memory Supabase session
    navigate('/');                // force return to homepage
    window.location.reload();     // ensure full reset of kiosk session
  };

  const resetFilters = () =>
    setFilterConfig({
      startTimeRange: [0, 24 * 60 - 1],
      showAirport: null,
      weekDays: null,
      searchTerm: ''
    });

  const weekDayOptions = [...new Set(jobs.map(j => j.weekDays))];

  const getActiveFilterCount = () => {
    let count = 0;
    if (filterConfig.startTimeRange[0] > 0 || filterConfig.startTimeRange[1] < 24 * 60 - 1) count++;
    if (filterConfig.showAirport !== null) count++;
    if (filterConfig.weekDays !== null) count++;
    if (filterConfig.searchTerm.trim() !== '') count++;
    return count;
  };

  const printJobPreferences = () => {
    // … unchanged …
  };

  // … rest of your render code stays the same …

  return (
    <MainLayout title="Job Preferences">
      {/* ... */}
      <CardFooter className="flex justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          <Button variant="outline" onClick={exitPage}>
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
      {/* ... */}
    </MainLayout>
  );
}

export default DriverPreferencesPage;
