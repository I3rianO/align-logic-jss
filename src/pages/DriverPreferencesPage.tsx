import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import useDriverStore from '@/store/driverStore';
import { 
  Check, 
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
  X,
  Printer
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Job } from '@/store/driverStore';
import { useIsMobile } from '@/hooks/use-mobile';

interface SortConfig {
  key: keyof Job | '';
  direction: 'asc' | 'desc';
}

interface FilterConfig {
  startTimeRange: [number, number]; // Minutes from midnight
  showAirport: boolean | null; // true = only airport, false = only non-airport, null = both
  weekDays: string | null; // specific day pattern or null for all
  searchTerm: string;
}

// Helper function to convert time string to minutes
const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper function to convert minutes to time string
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
  
  // Get employeeId, authentication status and site information from location state
  const employeeId = location.state?.employeeId;
  const authenticated = location.state?.authenticated;
  const siteId = location.state?.siteId;
  const siteName = location.state?.siteName;
  const companyId = location.state?.companyId;
  
  useEffect(() => {
    if (!employeeId) {
      navigate('/');
    } else if (!authenticated) {
      // Redirect to login page if not authenticated
      navigate('/driver-login', { state: { employeeId } });
    }
  }, [employeeId, authenticated, navigate]);
  
  const { 
    jobs, 
    preferences, 
    submitPreferences, 
    getDriverPreferences, 
    isCutoffActive, 
    drivers,
    systemSettings,
    logDriverActivity
  } = useDriverStore();
  
  // Get current driver information from the store
  const driverInfo = drivers.find(driver => driver.employeeId === employeeId);
  
  // Check if cutoff is active ONLY on initial load
  // Using a ref to track if user already started making selections
  const hasStartedRef = React.useRef(false);
  const [isCutoffReached, setIsCutoffReached] = useState<boolean>(false);
  
  useEffect(() => {
    // If the user hasn't started making picks yet, check the cutoff status
    if (!hasStartedRef.current) {
      setIsCutoffReached(isCutoffActive);
    }
    
    // Log driver viewing preferences
    if (driverInfo) {
      logDriverActivity({
        driverId: employeeId || '',
        driverName: driverInfo.name,
        action: 'view',
        details: 'Viewed job preferences page'
      });
    }
  }, [isCutoffActive, employeeId, driverInfo, logDriverActivity]);
  
  // Get existing preferences for this driver
  const existingPrefs = getDriverPreferences(employeeId || '');
  
  // Initialize job preferences state
  const [jobPreferences, setJobPreferences] = useState<string[]>(existingPrefs || []);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: 'asc' });
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    startTimeRange: [0, 24 * 60 - 1], // 0 minutes to 23:59
    showAirport: null,
    weekDays: null,
    searchTerm: '',
  });
  
  // When user interacts with preferences, mark that they've started making picks
  useEffect(() => {
    if (jobPreferences.length > 0 && !existingPrefs) {
      hasStartedRef.current = true;
    }
  }, [jobPreferences, existingPrefs]);
  
  // Function to handle sorting
  const handleSort = (key: keyof Job) => {
    setSortConfig((prevConfig) => {
      if (prevConfig.key === key) {
        return {
          ...prevConfig,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  };
  
  // Sort and filter jobs
  const sortAndFilterJobs = (jobsToSort: Job[]): Job[] => {
    let result = [...jobsToSort];
    
    // First, filter jobs by the driver's site - only show jobs from the same site
    if (siteId && companyId) {
      result = result.filter(job => job.siteId === siteId && job.companyId === companyId);
    } else if (driverInfo) {
      // Fallback to use the driver's assigned site if not provided in state
      result = result.filter(job => job.siteId === driverInfo.siteId && job.companyId === driverInfo.companyId);
    }
    
    // If driver is not airport certified, filter out airport jobs
    if (driverInfo && !driverInfo.airportCertified) {
      result = result.filter(job => !job.isAirport);
    }
    
    // Filter by search term
    if (filterConfig.searchTerm.trim() !== '') {
      const term = filterConfig.searchTerm.toLowerCase();
      result = result.filter(job => 
        job.jobId.toLowerCase().includes(term) ||
        job.startTime.toLowerCase().includes(term) ||
        job.weekDays.toLowerCase().includes(term)
      );
    }
    
    // Filter by start time range
    result = result.filter(job => {
      const jobMinutes = timeToMinutes(job.startTime);
      return jobMinutes >= filterConfig.startTimeRange[0] && jobMinutes <= filterConfig.startTimeRange[1];
    });
    
    // Filter by airport status
    if (filterConfig.showAirport !== null) {
      result = result.filter(job => job.isAirport === filterConfig.showAirport);
    }
    
    // Filter by weekDays
    if (filterConfig.weekDays) {
      result = result.filter(job => job.weekDays.includes(filterConfig.weekDays));
    }
    
    // Sort the jobs
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (sortConfig.key === 'startTime') {
          const timeA = timeToMinutes(a.startTime);
          const timeB = timeToMinutes(b.startTime);
          return sortConfig.direction === 'asc' ? timeA - timeB : timeB - timeA;
        }
        
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return result;
  };
  
  // Sort all jobs
  const sortedJobs = sortAndFilterJobs(jobs);
  
  // Available jobs are those not already selected
  const availableJobs = sortedJobs.filter(job => !jobPreferences.includes(job.jobId));
  
  // For sorting by start time
  const sortedAvailableJobs = [...availableJobs].sort((a, b) => {
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });
  
  const addJobPreference = (jobId: string) => {
    setJobPreferences([...jobPreferences, jobId]);
  };
  
  const removeJobPreference = (index: number) => {
    setJobPreferences(jobPreferences.filter((_, i) => i !== index));
  };
  
  const moveJobUp = (index: number) => {
    if (index === 0) return;
    const newPreferences = [...jobPreferences];
    [newPreferences[index - 1], newPreferences[index]] = [newPreferences[index], newPreferences[index - 1]];
    setJobPreferences(newPreferences);
  };
  
  const moveJobDown = (index: number) => {
    if (index === jobPreferences.length - 1) return;
    const newPreferences = [...jobPreferences];
    [newPreferences[index], newPreferences[index + 1]] = [newPreferences[index + 1], newPreferences[index]];
    setJobPreferences(newPreferences);
  };
  
  const handleSubmit = () => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      submitPreferences({
        driverId: employeeId || '',
        preferences: jobPreferences,
        submissionTime: new Date().toISOString(),
      });
      
      setIsSubmitting(false);
      
      // Show toast notification but remain on the same page
      toast({
        title: "Preferences Saved",
        description: jobPreferences.length === 0 
          ? "You've saved an empty preference list. No jobs will be assigned to you based on preferences."
          : "Your job preferences have been successfully submitted.",
        variant: "default",
      });
    }, 800);
  };
  
  const exitPage = () => {
    navigate('/');
  };

  // Reset filters
  const resetFilters = () => {
    setFilterConfig({
      startTimeRange: [0, 24 * 60 - 1],
      showAirport: null,
      weekDays: null,
      searchTerm: '',
    });
  };

  // Extract unique weekdays for filter options
  const weekDayOptions = [...new Set(jobs.map(job => job.weekDays))];

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    
    if (filterConfig.startTimeRange[0] > 0 || filterConfig.startTimeRange[1] < 24 * 60 - 1) count++;
    if (filterConfig.showAirport !== null) count++;
    if (filterConfig.weekDays !== null) count++;
    if (filterConfig.searchTerm.trim() !== '') count++;
    
    return count;
  };

  // Function to render job details with airport indicator
  const renderJobDetails = (jobId: string) => {
    const job = jobs.find(job => job.jobId === jobId);
    if (!job) return jobId;
    
    return (
      <div className="flex items-center">
        <span>{jobId} • {job.startTime} • {job.weekDays}</span>
        {job.isAirport && (
          <Badge variant="outline" className="ml-2 flex items-center">
            <Plane size={14} className="mr-1" /> Airport
          </Badge>
        )}
      </div>
    );
  };

  // Print functionality
  const printJobPreferences = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const driverName = driverInfo?.name || "Unknown Driver";
    const seniorityNumber = driverInfo?.seniorityNumber || "N/A";
    const currentDate = new Date().toLocaleDateString();
    
    // Create print content
    let printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Job Preferences - ${driverName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          h1 { margin-bottom: 5px; }
          .header { margin-bottom: 20px; }
          .info-row { display: flex; margin-bottom: 5px; }
          .info-label { font-weight: bold; width: 150px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .airport { font-weight: bold; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Job Preferences</h1>
          <div class="info-row">
            <div class="info-label">Driver Name:</div>
            <div>${driverName}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Employee ID:</div>
            <div>${employeeId}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Seniority Number:</div>
            <div>${seniorityNumber}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Date Submitted:</div>
            <div>${currentDate}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Preference Order</th>
              <th>Job ID</th>
              <th>Start Time</th>
              <th>Days of Week</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    // Add job preferences to table or show "No preferences" message
    if (jobPreferences.length === 0) {
      printContent += `
        <tr>
          <td colspan="5" style="text-align: center; padding: 20px;">
            No job preferences have been selected. The driver has chosen to submit an empty preference list.
          </td>
        </tr>
      `;
    } else {
      // Add job preferences to table
      jobPreferences.forEach((jobId, index) => {
        const job = jobs.find(job => job.jobId === jobId);
        if (job) {
          printContent += `
            <tr>
              <td>Pick ${index + 1}</td>
              <td>${job.jobId}</td>
              <td>${job.startTime}</td>
              <td>${job.weekDays}</td>
              <td class="${job.isAirport ? 'airport' : ''}">${job.isAirport ? 'Airport' : 'Regular'}</td>
            </tr>
          `;
        }
      });
    }
    
    printContent += `
          </tbody>
        </table>
        
        <div class="footer">
          This is an official record of your job preferences. Please keep for your records.
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      
      // Log the print activity
      if (driverInfo) {
        logDriverActivity({
          driverId: employeeId || '',
          driverName: driverInfo.name,
          action: 'view',
          details: 'Printed job preferences'
        });
      }
    }, 500);
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
              <Button onClick={exitPage}>Return to Home</Button>
            </CardFooter>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Job Preferences">
      <div className="jss-container py-8">
        {/* Driver Information Card */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Driver Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4 items-center">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Driver Name</p>
                <p className="text-lg font-medium">{driverInfo?.name || "Unknown Driver"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Employee ID</p>
                <p className="text-lg font-medium">{employeeId}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Facility</p>
                <p className="text-lg font-medium">
                  {siteName || driverInfo?.siteId || "Unknown"}
                  <Badge variant="outline" className="ml-2">
                    {siteId || driverInfo?.siteId || ""}
                  </Badge>
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Seniority Number</p>
                <Badge variant="outline" className="text-base px-3 py-1 font-bold">
                  {driverInfo?.seniorityNumber || "N/A"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

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
              {driverInfo && !driverInfo.airportCertified && (
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
            {/* Job List with Sortable Headers and Filter */}
            <div className="overflow-x-auto">
              <div className="flex justify-between mb-3 items-center">
                <h3 className="text-sm font-semibold">Available Jobs ({availableJobs.length})</h3>
                
                <div className="flex gap-2">
                  {/* Search input */}
                  <div className="relative w-[200px]">
                    <Input 
                      placeholder="Search jobs..." 
                      value={filterConfig.searchTerm}
                      onChange={(e) => setFilterConfig({...filterConfig, searchTerm: e.target.value})}
                      className="h-9 pl-8"
                    />
                    <div className="absolute left-2 top-2 text-muted-foreground">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                    </div>
                  </div>

                  {/* Filter button with popover */}
                  <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="relative">
                        <Filter size={16} className="mr-2" />
                        Filter
                        {getActiveFilterCount() > 0 && (
                          <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs">
                            {getActiveFilterCount()}
                          </Badge>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                      <div className="space-y-4 p-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">Filter Jobs</h4>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={resetFilters}
                            className="h-7 text-xs"
                          >
                            Reset
                          </Button>
                        </div>
                        
                        {/* Start time range filter with circular handles on both ends */}
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">Start Time Range</h5>
                          <div className="px-2">
                            <div className="relative mt-6 mb-6">
                              <Slider 
                                value={filterConfig.startTimeRange} 
                                min={0} 
                                max={24 * 60 - 1} 
                                step={15} 
                                onValueChange={(value) => setFilterConfig({...filterConfig, startTimeRange: [value[0], value[1]]})}
                                className="my-6"
                              />
                              {/* Styled circular handles on both ends */}
                              <div 
                                className="absolute w-4 h-4 bg-white border-2 border-primary rounded-full shadow-md"
                                style={{ 
                                  left: `calc(${(filterConfig.startTimeRange[0] / ((24 * 60 - 1))) * 100}% - 8px)`, 
                                  top: '50%', 
                                  transform: 'translateY(-50%)',
                                  zIndex: 10
                                }}
                              />
                              <div 
                                className="absolute w-4 h-4 bg-white border-2 border-primary rounded-full shadow-md"
                                style={{ 
                                  left: `calc(${(filterConfig.startTimeRange[1] / ((24 * 60 - 1))) * 100}% - 8px)`, 
                                  top: '50%', 
                                  transform: 'translateY(-50%)',
                                  zIndex: 10
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{minutesToTime(filterConfig.startTimeRange[0])}</span>
                            <span>{minutesToTime(filterConfig.startTimeRange[1])}</span>
                          </div>
                        </div>

                        {/* Only show Airport job filter if driver is airport certified */}
                        {driverInfo && driverInfo.airportCertified && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium">Job Type</h5>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant={filterConfig.showAirport === null ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => setFilterConfig({...filterConfig, showAirport: null})}
                                className="text-xs h-7"
                              >
                                All Jobs
                              </Button>
                              <Button
                                variant={filterConfig.showAirport === true ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => setFilterConfig({...filterConfig, showAirport: true})}
                                className="text-xs h-7"
                              >
                                <Plane size={12} className="mr-1" />
                                Airport Only
                              </Button>
                              <Button
                                variant={filterConfig.showAirport === false ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => setFilterConfig({...filterConfig, showAirport: false})}
                                className="text-xs h-7"
                              >
                                Non-Airport
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Week days filter */}
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">Week Days</h5>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant={filterConfig.weekDays === null ? "secondary" : "outline"}
                              size="sm"
                              onClick={() => setFilterConfig({...filterConfig, weekDays: null})}
                              className="text-xs h-7"
                            >
                              All Schedules
                            </Button>
                            {weekDayOptions.map((option) => (
                              <Button
                                key={option}
                                variant={filterConfig.weekDays === option ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => setFilterConfig({...filterConfig, weekDays: option})}
                                className="text-xs h-7"
                              >
                                {option}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="border rounded-md">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="font-semibold text-left p-2 pl-3 text-sm cursor-pointer" onClick={() => handleSort('jobId')}>
                        <div className="flex items-center">
                          Job ID
                          {sortConfig.key === 'jobId' ? (
                            sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                          ) : <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />}
                        </div>
                      </th>
                      <th className="font-semibold text-left p-2 text-sm cursor-pointer" onClick={() => handleSort('startTime')}>
                        <div className="flex items-center">
                          Start Time
                          {sortConfig.key === 'startTime' ? (
                            sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                          ) : <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />}
                        </div>
                      </th>
                      <th className="font-semibold text-left p-2 text-sm cursor-pointer" onClick={() => handleSort('weekDays')}>
                        <div className="flex items-center">
                          Days of Week
                          {sortConfig.key === 'weekDays' ? (
                            sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                          ) : <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />}
                        </div>
                      </th>
                      <th className="font-semibold text-left p-2 text-sm cursor-pointer" onClick={() => handleSort('isAirport')}>
                        <div className="flex items-center">
                          Location
                          {sortConfig.key === 'isAirport' ? (
                            sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                          ) : <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />}
                        </div>
                      </th>
                      <th className="font-semibold text-right p-2 pr-3 text-sm">
                        Action
                      </th>
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
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => addJobPreference(job.jobId)}
                              className="h-7"
                            >
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

            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold mb-3">Your Job Preferences ({jobPreferences.length})</h3>
              {jobPreferences.length === 0 ? (
                <div className="text-center p-6 border border-dashed rounded-md">
                  <p className="text-muted-foreground">No job preferences added yet. Select jobs from the list above.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobPreferences.map((jobId, index) => {
                    const job = jobs.find(j => j.jobId === jobId);
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <div className="min-w-[60px] font-medium">
                          Pick {index + 1}
                        </div>
                        {/* Job details display - no dropdown */}
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
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => moveJobUp(index)}
                            disabled={index === 0}
                          >
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
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => removeJobPreference(index)}
                          >
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
                      You've selected {jobPreferences.length} job{jobPreferences.length !== 1 ? 's' : ''}.
                      Jobs will be assigned based on seniority and your preference order.
                    </>
                  ) : (
                    <>
                      You haven't selected any jobs. You can still save an empty preference list, but
                      you won't be assigned a job based on your preferences.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between flex-wrap gap-2">
            <div className="flex gap-2">
              <Button variant="outline" onClick={exitPage}>
                <LogOut size={18} className="mr-1" /> Exit
              </Button>
              
              {/* Print button - only show if enabled in system settings */}
              {systemSettings.allowDriverPrinting && (
                <Button variant="outline" onClick={printJobPreferences}>
                  <Printer size={18} className="mr-1" /> Print
                </Button>
              )}
            </div>
            
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
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

export default DriverPreferencesPage;