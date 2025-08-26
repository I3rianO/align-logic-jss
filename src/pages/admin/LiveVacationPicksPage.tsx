import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Search, ArrowUpDown, Printer } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useDriverStore from '@/store/driverStore';
import useVacationStore, { VacationPreference, VacationWeek } from '@/store/vacationStore';

function LiveVacationPicksPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { drivers, isAdminAuthenticated, logAdminActivity } = useDriverStore();
  const { vacationWeeks, vacationPreferences } = useVacationStore();
  
  // Authentication check
  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate('/admin-portal');
    } else {
      // Log activity
      logAdminActivity('view', 'Viewed live vacation picks page');
    }
  }, [isAdminAuthenticated, navigate, logAdminActivity]);
  
  // State for filtering and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{key: string; direction: 'asc' | 'desc'}>({
    key: 'submissionTime',
    direction: 'desc'
  });
  const [activeTab, setActiveTab] = useState('by-driver');
  
  // Sort preferences by time (most recent first by default)
  const sortedPreferences = [...vacationPreferences]
    .filter(pref => {
      const driver = drivers.find(d => d.employeeId === pref.driverId);
      if (!driver) return false;
      
      const searchLower = searchTerm.toLowerCase();
      return driver.name.toLowerCase().includes(searchLower) ||
        driver.employeeId.toLowerCase().includes(searchLower);
    })
    .sort((a, b) => {
      const driver1 = drivers.find(d => d.employeeId === a.driverId);
      const driver2 = drivers.find(d => d.employeeId === b.driverId);
      
      if (sortConfig.key === 'driverName') {
        const name1 = (driver1?.name || '').toLowerCase();
        const name2 = (driver2?.name || '').toLowerCase();
        return sortConfig.direction === 'asc'
          ? name1.localeCompare(name2)
          : name2.localeCompare(name1);
      }
      
      if (sortConfig.key === 'seniorityNumber') {
        const seniority1 = driver1?.seniorityNumber || 0;
        const seniority2 = driver2?.seniorityNumber || 0;
        return sortConfig.direction === 'asc'
          ? seniority1 - seniority2
          : seniority2 - seniority1;
      }
      
      if (sortConfig.key === 'numPreferences') {
        return sortConfig.direction === 'asc'
          ? a.preferences.length - b.preferences.length
          : b.preferences.length - a.preferences.length;
      }
      
      if (sortConfig.key === 'submissionTime') {
        return sortConfig.direction === 'asc'
          ? new Date(a.submissionTime).getTime() - new Date(b.submissionTime).getTime()
          : new Date(b.submissionTime).getTime() - new Date(a.submissionTime).getTime();
      }
      
      return 0;
    });
  
  // Get list of drivers with no preferences
  const driversWithNoPreferences = drivers.filter(driver => 
    !vacationPreferences.some(pref => pref.driverId === driver.employeeId)
  );
  
  // Handle sort
  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  // Get preference summary by week
  const preferencesByWeek = vacationWeeks.map(week => {
    // Count how many drivers have this week as their first choice
    const firstChoiceCount = vacationPreferences.filter(
      pref => pref.preferences[0] === week.weekId
    ).length;
    
    // Count how many drivers have this week in any of their preferences
    const totalPreferencesCount = vacationPreferences.filter(
      pref => pref.preferences.includes(week.weekId)
    ).length;
    
    // Get drivers who have this week as their first choice
    const firstChoiceDrivers = vacationPreferences
      .filter(pref => pref.preferences[0] === week.weekId)
      .map(pref => {
        const driver = drivers.find(d => d.employeeId === pref.driverId);
        return {
          driverId: pref.driverId,
          name: driver?.name || 'Unknown',
          seniorityNumber: driver?.seniorityNumber || 999999
        };
      })
      .sort((a, b) => a.seniorityNumber - b.seniorityNumber);
    
    return {
      ...week,
      firstChoiceCount,
      totalPreferencesCount,
      firstChoiceDrivers
    };
  }).sort((a, b) => {
    // Sort by start date
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });
  
  // Function to print a snapshot of the current picks
  const printPicksSnapshot = () => {
    // Open a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Print Error",
        description: "Unable to open print window. Please check your browser settings.",
        variant: "destructive"
      });
      return;
    }
    
    // Format current date and time
    const dateTime = new Date().toLocaleString();
    
    // Create the HTML content for printing
    let printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Vacation Picks Snapshot - ${dateTime}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.5;
            margin: 0;
            padding: 20px;
          }
          h1, h2 {
            margin-top: 0;
          }
          h3 {
            margin-top: 20px;
            margin-bottom: 10px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            text-align: left;
            padding: 8px;
            border: 1px solid #ddd;
          }
          th {
            background-color: #f2f2f2;
          }
          .header-info {
            margin-bottom: 20px;
          }
          .footer {
            margin-top: 30px;
            border-top: 1px solid #ddd;
            padding-top: 10px;
            font-size: 12px;
            color: #666;
          }
          .page-break {
            page-break-after: always;
          }
        </style>
      </head>
      <body>
        <div class="header-info">
          <h1>Vacation Picks Snapshot</h1>
          <p><strong>Generated:</strong> ${dateTime}</p>
          <p><strong>Total Drivers:</strong> ${drivers.length}</p>
          <p><strong>Drivers Who Submitted Preferences:</strong> ${vacationPreferences.length}</p>
          <p><strong>Drivers Without Preferences:</strong> ${driversWithNoPreferences.length}</p>
        </div>

        <h2>Vacation Weeks Summary</h2>
        <table>
          <thead>
            <tr>
              <th>Week ID</th>
              <th>Date Range</th>
              <th>Slots</th>
              <th>Remaining</th>
              <th>First Choice</th>
              <th>Total Picks</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    // Add week data
    preferencesByWeek.forEach(week => {
      printContent += `
        <tr>
          <td>${week.weekId}</td>
          <td>${week.startDate} to ${week.endDate}</td>
          <td>${week.totalSlots}</td>
          <td>${week.remainingSlots}</td>
          <td>${week.firstChoiceCount}</td>
          <td>${week.totalPreferencesCount}</td>
        </tr>
      `;
    });
    
    printContent += `
          </tbody>
        </table>
        
        <div class="page-break"></div>
        
        <h2>Driver Preferences</h2>
        <table>
          <thead>
            <tr>
              <th>Driver</th>
              <th>Employee ID</th>
              <th>Seniority</th>
              <th>Submission Time</th>
              <th>Preferences</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    // Sort by seniority for print
    const printSortedPreferences = [...vacationPreferences].sort((a, b) => {
      const driver1 = drivers.find(d => d.employeeId === a.driverId);
      const driver2 = drivers.find(d => d.employeeId === b.driverId);
      return (driver1?.seniorityNumber || 0) - (driver2?.seniorityNumber || 0);
    });
    
    // Add driver preference data
    printSortedPreferences.forEach(pref => {
      const driver = drivers.find(d => d.employeeId === pref.driverId);
      if (!driver) return;
      
      // Format the preferences list with corresponding week dates
      const preferencesDisplay = pref.preferences.map((weekId, index) => {
        const week = vacationWeeks.find(w => w.weekId === weekId);
        return `${index + 1}. ${weekId} (${week?.startDate || 'Unknown'} - ${week?.endDate || 'Unknown'})`;
      }).join('<br>');
      
      printContent += `
        <tr>
          <td>${driver.name}</td>
          <td>${driver.employeeId}</td>
          <td>${driver.seniorityNumber}</td>
          <td>${new Date(pref.submissionTime).toLocaleString()}</td>
          <td>${preferencesDisplay || 'No preferences'}</td>
        </tr>
      `;
    });
    
    printContent += `
          </tbody>
        </table>
        
        <div class="page-break"></div>
        
        <h2>Drivers Without Preferences</h2>
        <table>
          <thead>
            <tr>
              <th>Driver</th>
              <th>Employee ID</th>
              <th>Seniority</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    // Add drivers with no preferences, sorted by seniority
    const sortedDriversWithNoPreferences = [...driversWithNoPreferences]
      .sort((a, b) => a.seniorityNumber - b.seniorityNumber);
    
    if (sortedDriversWithNoPreferences.length > 0) {
      sortedDriversWithNoPreferences.forEach(driver => {
        printContent += `
          <tr>
            <td>${driver.name}</td>
            <td>${driver.employeeId}</td>
            <td>${driver.seniorityNumber}</td>
          </tr>
        `;
      });
    } else {
      printContent += `
        <tr>
          <td colspan="3" style="text-align: center;">All drivers have submitted preferences</td>
        </tr>
      `;
    }
    
    printContent += `
          </tbody>
        </table>
        
        <div class="footer">
          <p>This report was generated from the Job Selection System administration dashboard.</p>
        </div>
      </body>
      </html>
    `;
    
    // Write the content to the new window and print
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      
      // Log the print activity
      logAdminActivity('view', 'Printed vacation picks snapshot');
    }, 500);
  };
  
  // Get driver information by ID
  const getDriverInfo = (driverId: string) => {
    return drivers.find(d => d.employeeId === driverId) || { name: 'Unknown', seniorityNumber: 0 };
  };
  
  // Get week information by ID
  const getWeekInfo = (weekId: string) => {
    return vacationWeeks.find(w => w.weekId === weekId);
  };
  
  return (
    <MainLayout title="Live Vacation Picks">
      <div className="container max-w-6xl py-6">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate('/admin-dashboard')}
        >
          <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
        </Button>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-2xl">Live Vacation Picks</CardTitle>
              <CardDescription>
                Real-time view of driver vacation preferences
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              className="ml-auto" 
              onClick={printPicksSnapshot}
            >
              <Printer size={16} className="mr-1" /> Generate Report
            </Button>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-4">
                    <div className="text-2xl font-bold">{drivers.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm font-medium">Submitted Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-4">
                    <div className="text-2xl font-bold">{vacationPreferences.length}</div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round((vacationPreferences.length / drivers.length) * 100)}% of drivers
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm font-medium">Without Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-4">
                    <div className="text-2xl font-bold">{driversWithNoPreferences.length}</div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round((driversWithNoPreferences.length / drivers.length) * 100)}% of drivers
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-2">
                  <TabsTrigger value="by-driver">By Driver</TabsTrigger>
                  <TabsTrigger value="by-week">By Week</TabsTrigger>
                </TabsList>
                
                {/* By Driver Tab */}
                <TabsContent value="by-driver" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="relative w-[300px]">
                      <Input 
                        placeholder="Search drivers..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                      <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50">
                          <th 
                            className="font-semibold text-left p-3 text-sm cursor-pointer"
                            onClick={() => handleSort('driverName')}
                          >
                            <div className="flex items-center">
                              Driver Name
                              <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />
                            </div>
                          </th>
                          <th 
                            className="font-semibold text-left p-3 text-sm cursor-pointer"
                            onClick={() => handleSort('seniorityNumber')}
                          >
                            <div className="flex items-center">
                              Seniority
                              <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />
                            </div>
                          </th>
                          <th 
                            className="font-semibold text-left p-3 text-sm cursor-pointer"
                            onClick={() => handleSort('numPreferences')}
                          >
                            <div className="flex items-center">
                              # Preferences
                              <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />
                            </div>
                          </th>
                          <th 
                            className="font-semibold text-left p-3 text-sm cursor-pointer"
                            onClick={() => handleSort('submissionTime')}
                          >
                            <div className="flex items-center">
                              Submission Time
                              <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedPreferences.length > 0 ? (
                          sortedPreferences.map((pref) => {
                            const driver = getDriverInfo(pref.driverId);
                            return (
                              <tr key={pref.driverId} className="border-t hover:bg-muted/30">
                                <td className="p-3">
                                  <div className="font-medium">{driver.name}</div>
                                  <div className="text-xs text-muted-foreground">{pref.driverId}</div>
                                </td>
                                <td className="p-3">
                                  <Badge variant="outline">
                                    {driver.seniorityNumber}
                                  </Badge>
                                </td>
                                <td className="p-3">
                                  {pref.preferences.length} 
                                  {pref.preferences.length > 0 && (
                                    <div className="mt-1 text-xs">
                                      First choice: <span className="font-medium">{pref.preferences[0]}</span> 
                                    </div>
                                  )}
                                </td>
                                <td className="p-3">
                                  <div>{new Date(pref.submissionTime).toLocaleDateString()}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(pref.submissionTime).toLocaleTimeString()}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={4} className="text-center py-6 text-muted-foreground">
                              {searchTerm 
                                ? "No drivers match your search criteria" 
                                : "No driver preferences have been submitted yet"
                              }
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Drivers with No Preferences */}
                  {driversWithNoPreferences.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mt-6 mb-3">
                        Drivers Without Vacation Preferences ({driversWithNoPreferences.length})
                      </h3>
                      <div className="border rounded-md overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="font-semibold text-left p-3 text-sm">Driver Name</th>
                              <th className="font-semibold text-left p-3 text-sm">Employee ID</th>
                              <th className="font-semibold text-left p-3 text-sm">Seniority</th>
                            </tr>
                          </thead>
                          <tbody>
                            {driversWithNoPreferences
                              .sort((a, b) => a.seniorityNumber - b.seniorityNumber)
                              .filter(driver => 
                                driver.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                driver.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
                              )
                              .map((driver) => (
                                <tr key={driver.employeeId} className="border-t hover:bg-muted/30">
                                  <td className="p-3 font-medium">{driver.name}</td>
                                  <td className="p-3">{driver.employeeId}</td>
                                  <td className="p-3">
                                    <Badge variant="outline">{driver.seniorityNumber}</Badge>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                {/* By Week Tab */}
                <TabsContent value="by-week">
                  <div className="space-y-6">
                    {preferencesByWeek.map((week) => (
                      <Card key={week.weekId} className="overflow-hidden">
                        <CardHeader className="bg-muted/30 py-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <CardTitle className="text-lg">
                                {week.weekId}
                              </CardTitle>
                              <CardDescription>
                                {week.startDate} to {week.endDate}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-center px-2">
                                <div className="text-sm font-medium">Slots</div>
                                <div className="text-2xl font-bold">{week.totalSlots}</div>
                              </div>
                              <div className="text-center px-2">
                                <div className="text-sm font-medium">First Choice</div>
                                <div className="text-2xl font-bold">{week.firstChoiceCount}</div>
                              </div>
                              <div className="text-center px-2">
                                <div className="text-sm font-medium">Total Picks</div>
                                <div className="text-2xl font-bold">{week.totalPreferencesCount}</div>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="py-4">
                          <div className="space-y-3">
                            <h4 className="font-medium">First Choice Drivers (by Seniority)</h4>
                            {week.firstChoiceDrivers.length > 0 ? (
                              <div className="border rounded-md overflow-hidden">
                                <table className="w-full">
                                  <thead>
                                    <tr className="bg-muted/50">
                                      <th className="font-semibold text-left p-2 text-sm">Seniority</th>
                                      <th className="font-semibold text-left p-2 text-sm">Driver</th>
                                      <th className="font-semibold text-left p-2 text-sm">Employee ID</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {week.firstChoiceDrivers.map((driver) => (
                                      <tr key={driver.driverId} className="border-t">
                                        <td className="p-2">
                                          <Badge variant="outline">{driver.seniorityNumber}</Badge>
                                        </td>
                                        <td className="p-2 font-medium">{driver.name}</td>
                                        <td className="p-2">{driver.driverId}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-muted-foreground text-sm p-2">
                                No drivers have selected this week as their first choice
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

export default LiveVacationPicksPage;