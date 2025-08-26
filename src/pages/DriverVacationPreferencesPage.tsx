import React, { useState, useEffect } from 'react';
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
  Calendar,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Filter,
  Printer
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';

// Temporary placeholder structure for vacation weeks
interface VacationWeek {
  weekId: string;
  startDate: string;
  endDate: string;
  totalSlots: number;
  remainingSlots: number;
}

// Placeholder for vacation preferences
interface VacationPreference {
  driverId: string;
  preferences: string[];  // Array of weekIds in order of preference
  submissionTime: string;
}

interface SortConfig {
  key: keyof VacationWeek | '';
  direction: 'asc' | 'desc';
}

function DriverVacationPreferencesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isMobileDevice = useIsMobile();
  
  // Get employeeId and authentication status from location state or redirect back to home
  const employeeId = location.state?.employeeId;
  const authenticated = location.state?.authenticated;
  
  useEffect(() => {
    if (!employeeId) {
      navigate('/');
    } else if (!authenticated) {
      // Redirect to login page if not authenticated
      navigate('/driver-login', { state: { employeeId } });
    }
  }, [employeeId, authenticated, navigate]);
  
  const { 
    drivers,
    isCutoffActive,
    systemSettings,
    logDriverActivity
  } = useDriverStore();
  
  // Get current driver information from the store
  const driverInfo = drivers.find(driver => driver.employeeId === employeeId);
  
  // Mock vacation weeks data for demonstration
  const [vacationWeeks] = useState<VacationWeek[]>([
    { weekId: 'W001', startDate: '2025-01-06', endDate: '2025-01-12', totalSlots: 5, remainingSlots: 3 },
    { weekId: 'W002', startDate: '2025-01-13', endDate: '2025-01-19', totalSlots: 5, remainingSlots: 5 },
    { weekId: 'W003', startDate: '2025-01-20', endDate: '2025-01-26', totalSlots: 5, remainingSlots: 2 },
    { weekId: 'W004', startDate: '2025-01-27', endDate: '2025-02-02', totalSlots: 5, remainingSlots: 4 },
    { weekId: 'W005', startDate: '2025-02-03', endDate: '2025-02-09', totalSlots: 5, remainingSlots: 5 },
    { weekId: 'W006', startDate: '2025-02-10', endDate: '2025-02-16', totalSlots: 5, remainingSlots: 1 },
    { weekId: 'W007', startDate: '2025-02-17', endDate: '2025-02-23', totalSlots: 5, remainingSlots: 3 },
    { weekId: 'W008', startDate: '2025-02-24', endDate: '2025-03-02', totalSlots: 5, remainingSlots: 5 },
  ]);
  
  // Check if cutoff is active ONLY on initial load
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
        details: 'Viewed vacation preferences page'
      });
    }
  }, [isCutoffActive, employeeId, driverInfo, logDriverActivity]);
  
  // Mock vacation preferences for this driver (would be fetched from a store in real implementation)
  // For now we'll start with an empty array
  const [vacationPreferences, setVacationPreferences] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // When user interacts with preferences, mark that they've started making picks
  useEffect(() => {
    if (vacationPreferences.length > 0) {
      hasStartedRef.current = true;
    }
  }, [vacationPreferences]);
  
  // Function to handle sorting
  const handleSort = (key: keyof VacationWeek) => {
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
  
  // Sort and filter vacation weeks
  const sortAndFilterWeeks = (weeksToSort: VacationWeek[]): VacationWeek[] => {
    let result = [...weeksToSort];
    
    // Filter by search term
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(week => 
        week.weekId.toLowerCase().includes(term) ||
        week.startDate.toLowerCase().includes(term) ||
        week.endDate.toLowerCase().includes(term)
      );
    }
    
    // Sort the weeks
    if (sortConfig.key) {
      result.sort((a, b) => {
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
  
  // Sort all weeks
  const sortedWeeks = sortAndFilterWeeks(vacationWeeks);
  
  // Available weeks are those not already selected
  const availableWeeks = sortedWeeks.filter(week => !vacationPreferences.includes(week.weekId));
  
  // For sorting by date
  const sortedAvailableWeeks = [...availableWeeks].sort((a, b) => {
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });
  
  const addVacationPreference = (weekId: string) => {
    setVacationPreferences([...vacationPreferences, weekId]);
  };
  
  const removeVacationPreference = (index: number) => {
    setVacationPreferences(vacationPreferences.filter((_, i) => i !== index));
  };
  
  const moveWeekUp = (index: number) => {
    if (index === 0) return;
    const newPreferences = [...vacationPreferences];
    [newPreferences[index - 1], newPreferences[index]] = [newPreferences[index], newPreferences[index - 1]];
    setVacationPreferences(newPreferences);
  };
  
  const moveWeekDown = (index: number) => {
    if (index === vacationPreferences.length - 1) return;
    const newPreferences = [...vacationPreferences];
    [newPreferences[index], newPreferences[index + 1]] = [newPreferences[index + 1], newPreferences[index]];
    setVacationPreferences(newPreferences);
  };
  
  const handleSubmit = () => {
    setIsSubmitting(true);
    
    // Simulate API call or store update
    setTimeout(() => {
      // In a real implementation, you would update a vacationStore or similar
      // For now, we'll just show a success message
      
      setIsSubmitting(false);
      
      // Show toast notification but remain on the same page
      toast({
        title: "Vacation Preferences Saved",
        description: vacationPreferences.length === 0 
          ? "You've saved an empty preference list. No vacation weeks will be assigned to you based on preferences."
          : "Your vacation week preferences have been successfully submitted.",
        variant: "default",
      });
      
      // Log this activity
      if (driverInfo) {
        logDriverActivity({
          driverId: employeeId || '',
          driverName: driverInfo.name,
          action: 'create',
          details: `Submitted ${vacationPreferences.length} vacation week preferences`
        });
      }
    }, 800);
  };
  
  const exitPage = () => {
    navigate('/');
  };

  // Print functionality
  const printVacationPreferences = () => {
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
        <title>Vacation Preferences - ${driverName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          h1 { margin-bottom: 5px; }
          .header { margin-bottom: 20px; }
          .info-row { display: flex; margin-bottom: 5px; }
          .info-label { font-weight: bold; width: 150px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Vacation Week Preferences</h1>
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
              <th>Week ID</th>
              <th>Start Date</th>
              <th>End Date</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    // Add vacation preferences to table or show "No preferences" message
    if (vacationPreferences.length === 0) {
      printContent += `
        <tr>
          <td colspan="4" style="text-align: center; padding: 20px;">
            No vacation preferences have been selected. The driver has chosen to submit an empty preference list.
          </td>
        </tr>
      `;
    } else {
      // Add vacation preferences to table
      vacationPreferences.forEach((weekId, index) => {
        const week = vacationWeeks.find(week => week.weekId === weekId);
        if (week) {
          printContent += `
            <tr>
              <td>Pick ${index + 1}</td>
              <td>${week.weekId}</td>
              <td>${week.startDate}</td>
              <td>${week.endDate}</td>
            </tr>
          `;
        }
      });
    }
    
    printContent += `
          </tbody>
        </table>
        
        <div class="footer">
          This is an official record of your vacation preferences. Please keep for your records.
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
          details: 'Printed vacation preferences'
        });
      }
    }, 500);
  };

  // Handle cutoff message display
  if (isCutoffReached && !hasStartedRef.current) {
    return (
      <MainLayout title="Vacation Preferences">
        <div className="jss-container py-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Vacation Selection Closed</CardTitle>
              <CardDescription className="text-center">
                The vacation selection period has ended. Contact your supervisor if you need assistance.
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
    <MainLayout title="Vacation Preferences">
      <div className="jss-container py-8">
        {/* Driver Information Card */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Driver Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 items-center">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Driver Name</p>
                <p className="text-lg font-medium">{driverInfo?.name || "Unknown Driver"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Employee ID</p>
                <p className="text-lg font-medium">{employeeId}</p>
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
            <CardTitle>Select Your Vacation Preferences</CardTitle>
            <CardDescription>
              Add vacation weeks in order of preference. Your first pick (Pick 1) will be considered first.
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
            {/* Vacation Week List with Sortable Headers and Search */}
            <div className="overflow-x-auto">
              <div className="flex justify-between mb-3 items-center">
                <h3 className="text-sm font-semibold">Available Vacation Weeks ({availableWeeks.length})</h3>
                
                <div className="relative w-[200px]">
                  <Input 
                    placeholder="Search weeks..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9 pl-8"
                  />
                  <div className="absolute left-2 top-2 text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                  </div>
                </div>
              </div>

              <div className="border rounded-md">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="font-semibold text-left p-2 pl-3 text-sm cursor-pointer" onClick={() => handleSort('weekId')}>
                        <div className="flex items-center">
                          Week ID
                          {sortConfig.key === 'weekId' ? (
                            sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                          ) : <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />}
                        </div>
                      </th>
                      <th className="font-semibold text-left p-2 text-sm cursor-pointer" onClick={() => handleSort('startDate')}>
                        <div className="flex items-center">
                          Start Date
                          {sortConfig.key === 'startDate' ? (
                            sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                          ) : <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />}
                        </div>
                      </th>
                      <th className="font-semibold text-left p-2 text-sm cursor-pointer" onClick={() => handleSort('endDate')}>
                        <div className="flex items-center">
                          End Date
                          {sortConfig.key === 'endDate' ? (
                            sortConfig.direction === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                          ) : <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />}
                        </div>
                      </th>
                      <th className="font-semibold text-left p-2 text-sm cursor-pointer" onClick={() => handleSort('remainingSlots')}>
                        <div className="flex items-center">
                          Available Slots
                          {sortConfig.key === 'remainingSlots' ? (
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
                    {availableWeeks.length > 0 ? (
                      availableWeeks.map((week) => (
                        <tr key={week.weekId} className="border-t hover:bg-muted/30">
                          <td className="p-2 pl-3 text-sm">{week.weekId}</td>
                          <td className="p-2 text-sm">{week.startDate}</td>
                          <td className="p-2 text-sm">{week.endDate}</td>
                          <td className="p-2 text-sm">
                            <Badge variant={week.remainingSlots > 2 ? "outline" : week.remainingSlots > 0 ? "secondary" : "destructive"}>
                              {week.remainingSlots} / {week.totalSlots}
                            </Badge>
                          </td>
                          <td className="p-2 pr-3 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => addVacationPreference(week.weekId)}
                              className="h-7"
                              disabled={week.remainingSlots === 0}
                            >
                              <Plus size={14} className="mr-1" /> Add
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-4 text-muted-foreground">
                          No vacation weeks available that match your search
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold mb-3">Your Vacation Preferences ({vacationPreferences.length})</h3>
              {vacationPreferences.length === 0 ? (
                <div className="text-center p-6 border border-dashed rounded-md">
                  <p className="text-muted-foreground">No vacation preferences added yet. Select weeks from the list above.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {vacationPreferences.map((weekId, index) => {
                    const week = vacationWeeks.find(w => w.weekId === weekId);
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <div className="min-w-[60px] font-medium">
                          Pick {index + 1}
                        </div>
                        <div className="flex-1 border rounded-md p-2 bg-muted/20">
                          <div className="flex items-center">
                            <span>
                              {weekId} • {week?.startDate} to {week?.endDate}
                              <Badge variant="outline" className="ml-2 flex items-center inline-flex">
                                <Calendar size={14} className="mr-1" /> {week?.remainingSlots} slots
                              </Badge>
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => moveWeekUp(index)}
                            disabled={index === 0}
                          >
                            <ChevronUp size={18} />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => moveWeekDown(index)}
                            disabled={index === vacationPreferences.length - 1}
                          >
                            <ChevronDown size={18} />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => removeVacationPreference(index)}
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
                  {vacationPreferences.length > 0 ? (
                    <>
                      You've selected {vacationPreferences.length} vacation week{vacationPreferences.length !== 1 ? 's' : ''}.
                      Vacation weeks will be assigned based on seniority and your preference order.
                    </>
                  ) : (
                    <>
                      You haven't selected any vacation weeks. You can still save an empty preference list, but
                      you won't be assigned a vacation week based on your preferences.
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
                <Button variant="outline" onClick={printVacationPreferences}>
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

export default DriverVacationPreferencesPage;