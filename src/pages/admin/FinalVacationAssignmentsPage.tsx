import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Search, ArrowUpDown, Printer, Check, AlertCircle, Calendar, FileText } from 'lucide-react';
import useDriverStore from '@/store/driverStore';
import useVacationStore, { VacationAssignment, VacationWeek } from '@/store/vacationStore';

interface EnhancedVacationAssignment extends VacationAssignment {
  driverName: string;
  seniorityNumber: number;
  weekDetails: VacationWeek;
}

function FinalVacationAssignmentsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { drivers, isAdminAuthenticated, logAdminActivity } = useDriverStore();
  const { 
    vacationWeeks, 
    vacationPreferences, 
    calculateVacationAssignments, 
    assignVacationManually,
    removeManualAssignment
  } = useVacationStore();
  
  // Authentication check
  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate('/admin-portal');
    } else {
      // Log activity
      logAdminActivity('view', 'Accessed final vacation assignments page');
    }
  }, [isAdminAuthenticated, navigate, logAdminActivity]);
  
  // State for filter and sort
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{key: string; direction: 'asc' | 'desc'}>({
    key: 'seniorityNumber',
    direction: 'asc'
  });
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'assigned', 'unassigned'
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  
  // Get assignments
  const rawAssignments = calculateVacationAssignments();
  
  // Enhanced assignments with driver and week details
  const enhancedAssignments: EnhancedVacationAssignment[] = rawAssignments.map(assignment => {
    const driver = drivers.find(d => d.employeeId === assignment.driverId) || 
                  { name: 'Unknown', seniorityNumber: 999999 };
    
    const week = vacationWeeks.find(w => w.weekId === assignment.weekId) || 
                { weekId: 'Unknown', startDate: '', endDate: '', totalSlots: 0, remainingSlots: 0 };
    
    return {
      ...assignment,
      driverName: driver.name,
      seniorityNumber: driver.seniorityNumber,
      weekDetails: week
    };
  });
  
  // Get list of drivers without assignments
  const driversWithoutAssignments = drivers.filter(driver => 
    !enhancedAssignments.some(assignment => assignment.driverId === driver.employeeId)
  );
  
  // Get list of weeks with available slots
  const weeksWithAvailableSlots = vacationWeeks.filter(week => week.remainingSlots > 0);
  
  // Filtered and sorted assignments
  const filteredAssignments = enhancedAssignments
    .filter(assignment => {
      // Apply search filter
      const matchesSearch = 
        assignment.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.driverId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.weekId.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Apply status filter
      if (filterStatus === 'all') {
        return matchesSearch;
      }
      
      return matchesSearch;
    })
    .sort((a, b) => {
      // Apply sorting
      if (sortConfig.key === 'driverName') {
        return sortConfig.direction === 'asc'
          ? a.driverName.localeCompare(b.driverName)
          : b.driverName.localeCompare(a.driverName);
      }
      
      if (sortConfig.key === 'seniorityNumber') {
        return sortConfig.direction === 'asc'
          ? a.seniorityNumber - b.seniorityNumber
          : b.seniorityNumber - a.seniorityNumber;
      }
      
      if (sortConfig.key === 'weekId') {
        return sortConfig.direction === 'asc'
          ? a.weekId.localeCompare(b.weekId)
          : b.weekId.localeCompare(a.weekId);
      }
      
      if (sortConfig.key === 'startDate') {
        return sortConfig.direction === 'asc'
          ? new Date(a.weekDetails.startDate).getTime() - new Date(b.weekDetails.startDate).getTime()
          : new Date(b.weekDetails.startDate).getTime() - new Date(a.weekDetails.startDate).getTime();
      }
      
      if (sortConfig.key === 'assignmentType') {
        return sortConfig.direction === 'asc'
          ? a.assignmentType.localeCompare(b.assignmentType)
          : b.assignmentType.localeCompare(a.assignmentType);
      }
      
      return 0;
    });
  
  // Handle sorting
  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  // Handle manual assignment
  const handleManualAssignment = () => {
    if (!selectedDriver || !selectedWeek) {
      toast({
        title: "Validation Error",
        description: "Please select both a driver and a vacation week",
        variant: "destructive"
      });
      return;
    }
    
    // Check if selected week has available slots
    const week = vacationWeeks.find(w => w.weekId === selectedWeek);
    if (!week || week.remainingSlots <= 0) {
      toast({
        title: "No Available Slots",
        description: `Week ${selectedWeek} has no available slots`,
        variant: "destructive"
      });
      return;
    }
    
    // Check if driver already has an assignment
    if (enhancedAssignments.some(a => a.driverId === selectedDriver)) {
      toast({
        title: "Driver Already Assigned",
        description: "This driver already has a vacation assignment",
        variant: "destructive"
      });
      return;
    }
    
    // Process the assignment
    assignVacationManually(selectedDriver, selectedWeek);
    
    const driver = drivers.find(d => d.employeeId === selectedDriver);
    
    toast({
      title: "Assignment Created",
      description: `Successfully assigned ${driver?.name || 'driver'} to week ${selectedWeek}`,
    });
    
    logAdminActivity('create', `Manually assigned driver ${driver?.name || selectedDriver} to vacation week ${selectedWeek}`);
    
    // Reset selection
    setSelectedDriver(null);
    setSelectedWeek(null);
  };
  
  // Handle removing an assignment
  const handleRemoveAssignment = (assignment: EnhancedVacationAssignment) => {
    removeManualAssignment(assignment.weekId);
    
    toast({
      title: "Assignment Removed",
      description: `Successfully removed ${assignment.driverName}'s assignment to week ${assignment.weekId}`,
    });
    
    logAdminActivity('delete', `Removed ${assignment.driverName}'s vacation assignment for week ${assignment.weekId}`);
  };
  
  // Generate and print assignments for the driver lobby
  const printAssignments = () => {
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
    
    // Format current date for the report
    const dateTime = new Date().toLocaleDateString();
    
    // Create the HTML content for printing
    let printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Final Vacation Assignments - ${dateTime}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.5;
            margin: 0;
            padding: 20px;
          }
          h1, h2 {
            margin-top: 0;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #333;
          }
          .report-date {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th, td {
            padding: 10px;
            border: 1px solid #ddd;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          tr:hover {
            background-color: #f5f5f5;
          }
          .footer {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
          .week-heading {
            margin-top: 20px;
            margin-bottom: 10px;
            padding: 5px;
            background-color: #eee;
            border-left: 4px solid #333;
          }
          .no-assignments {
            padding: 15px;
            text-align: center;
            font-style: italic;
            color: #666;
          }
          @media print {
            .page-break {
              page-break-after: always;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>DRIVER VACATION ASSIGNMENTS</h1>
          <div class="report-date">Generated: ${dateTime}</div>
        </div>

        <h2>Assignments by Week</h2>
    `;
    
    // Group assignments by week
    const weekGroups = new Map<string, EnhancedVacationAssignment[]>();
    
    // Sort assignments by week start date and then by seniority
    const sortedAssignments = [...enhancedAssignments].sort((a, b) => {
      // First sort by week start date
      const dateCompare = new Date(a.weekDetails.startDate).getTime() - 
                         new Date(b.weekDetails.startDate).getTime();
      
      if (dateCompare !== 0) return dateCompare;
      
      // Then by seniority
      return a.seniorityNumber - b.seniorityNumber;
    });
    
    // Group the sorted assignments by week
    sortedAssignments.forEach(assignment => {
      const weekId = assignment.weekId;
      if (!weekGroups.has(weekId)) {
        weekGroups.set(weekId, []);
      }
      weekGroups.get(weekId)?.push(assignment);
    });
    
    // Sort weeks by start date
    const sortedWeeks = Array.from(weekGroups.keys())
      .map(weekId => {
        const weekDetails = vacationWeeks.find(w => w.weekId === weekId);
        return {
          weekId,
          startDate: weekDetails?.startDate || '',
          assignments: weekGroups.get(weekId) || []
        };
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
    // Add each week's assignments to the printout
    if (sortedWeeks.length > 0) {
      sortedWeeks.forEach(week => {
        const weekDetails = vacationWeeks.find(w => w.weekId === week.weekId);
        
        printContent += `
          <div class="week-heading">
            <h3>Week ${week.weekId}: ${weekDetails?.startDate || ''} to ${weekDetails?.endDate || ''}</h3>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Seniority</th>
                <th>Driver Name</th>
                <th>Employee ID</th>
                <th>Assignment Type</th>
              </tr>
            </thead>
            <tbody>
        `;
        
        week.assignments.forEach(assignment => {
          // Translate assignment type to human-readable form
          let assignmentTypeDisplay = '';
          switch (assignment.assignmentType) {
            case 'preference':
              assignmentTypeDisplay = 'Driver Preference';
              break;
            case 'seniority':
              assignmentTypeDisplay = 'Seniority Based';
              break;
            case 'manual':
              assignmentTypeDisplay = 'Manual Assignment';
              break;
            case 'vc-assigned':
              assignmentTypeDisplay = 'VC Assignment';
              break;
            default:
              assignmentTypeDisplay = assignment.assignmentType;
          }
          
          printContent += `
            <tr>
              <td>${assignment.seniorityNumber}</td>
              <td>${assignment.driverName}</td>
              <td>${assignment.driverId}</td>
              <td>${assignmentTypeDisplay}</td>
            </tr>
          `;
        });
        
        printContent += `
            </tbody>
          </table>
        `;
      });
    } else {
      printContent += `
        <div class="no-assignments">
          No vacation assignments have been made.
        </div>
      `;
    }
    
    // Add section for drivers without assignments
    printContent += `
      <div class="page-break"></div>
      <h2>Drivers Without Vacation Assignments (${driversWithoutAssignments.length})</h2>
    `;
    
    if (driversWithoutAssignments.length > 0) {
      printContent += `
        <table>
          <thead>
            <tr>
              <th>Seniority</th>
              <th>Driver Name</th>
              <th>Employee ID</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      // Sort by seniority
      const sortedDriversWithoutAssignments = [...driversWithoutAssignments]
        .sort((a, b) => a.seniorityNumber - b.seniorityNumber);
      
      sortedDriversWithoutAssignments.forEach(driver => {
        printContent += `
          <tr>
            <td>${driver.seniorityNumber}</td>
            <td>${driver.name}</td>
            <td>${driver.employeeId}</td>
          </tr>
        `;
      });
      
      printContent += `
          </tbody>
        </table>
      `;
    } else {
      printContent += `
        <div class="no-assignments">
          All drivers have been assigned vacation weeks.
        </div>
      `;
    }
    
    printContent += `
        <div class="footer">
          <p>This official document was generated by the Job Selection System.</p>
          <p>Contact system administrator for any questions regarding these assignments.</p>
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
      logAdminActivity('view', 'Printed vacation assignments for posting');
    }, 500);
  };
  
  return (
    <MainLayout title="Final Vacation Assignments">
      <div className="container max-w-6xl py-6">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate('/admin-dashboard')}
        >
          <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
        </Button>
        
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-2xl">Final Vacation Assignments</CardTitle>
              <CardDescription>
                View and manage driver vacation assignments
              </CardDescription>
            </div>
            <Button onClick={printAssignments}>
              <FileText size={16} className="mr-1" /> Generate Assignment Posting
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                  <CardTitle className="text-sm font-medium">Assigned Drivers</CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-4">
                  <div className="text-2xl font-bold">{enhancedAssignments.length}</div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round((enhancedAssignments.length / drivers.length) * 100)}% of drivers
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-medium">Unassigned Drivers</CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-4">
                  <div className="text-2xl font-bold">{driversWithoutAssignments.length}</div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round((driversWithoutAssignments.length / drivers.length) * 100)}% of drivers
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <Card className="flex-1">
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Manual Assignment</CardTitle>
                  <CardDescription>
                    Manually assign a vacation week to a driver
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="driver-select">Driver</Label>
                    <Select value={selectedDriver || ''} onValueChange={setSelectedDriver}>
                      <SelectTrigger id="driver-select">
                        <SelectValue placeholder="Select driver..." />
                      </SelectTrigger>
                      <SelectContent>
                        {driversWithoutAssignments
                          .sort((a, b) => a.seniorityNumber - b.seniorityNumber)
                          .map(driver => (
                            <SelectItem key={driver.employeeId} value={driver.employeeId}>
                              {driver.name} (Seniority: {driver.seniorityNumber})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="week-select">Vacation Week</Label>
                    <Select value={selectedWeek || ''} onValueChange={setSelectedWeek}>
                      <SelectTrigger id="week-select">
                        <SelectValue placeholder="Select vacation week..." />
                      </SelectTrigger>
                      <SelectContent>
                        {weeksWithAvailableSlots
                          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                          .map(week => (
                            <SelectItem key={week.weekId} value={week.weekId}>
                              {week.weekId}: {week.startDate} - {week.endDate} ({week.remainingSlots} slots)
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={handleManualAssignment}
                    disabled={!selectedDriver || !selectedWeek}
                  >
                    <Check size={16} className="mr-1" /> Create Assignment
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="flex-1">
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Assignments by Week</CardTitle>
                  <CardDescription>
                    Summary of vacation slot utilization
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[200px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Week</th>
                        <th className="text-left py-2 font-medium">Date Range</th>
                        <th className="text-right py-2 font-medium">Used / Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vacationWeeks
                        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                        .map(week => {
                          const assignmentsForWeek = enhancedAssignments.filter(
                            a => a.weekId === week.weekId
                          ).length;
                          const usedSlots = week.totalSlots - week.remainingSlots;
                          
                          return (
                            <tr key={week.weekId} className="border-b">
                              <td className="py-2">{week.weekId}</td>
                              <td className="py-2">{week.startDate} - {week.endDate}</td>
                              <td className="py-2 text-right">
                                <Badge 
                                  variant={usedSlots === week.totalSlots ? "secondary" : "outline"}
                                  className="ml-auto"
                                >
                                  {usedSlots} / {week.totalSlots}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div className="relative w-full md:w-[300px]">
                  <Input 
                    placeholder="Search assignments..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                  <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                </div>
                
                <div className="flex gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Assignments</SelectItem>
                      <SelectItem value="manual">Manual Only</SelectItem>
                      <SelectItem value="preference">Preference Only</SelectItem>
                      <SelectItem value="seniority">Seniority Only</SelectItem>
                    </SelectContent>
                  </Select>
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
                        onClick={() => handleSort('weekId')}
                      >
                        <div className="flex items-center">
                          Week
                          <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />
                        </div>
                      </th>
                      <th 
                        className="font-semibold text-left p-3 text-sm cursor-pointer"
                        onClick={() => handleSort('startDate')}
                      >
                        <div className="flex items-center">
                          Date Range
                          <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />
                        </div>
                      </th>
                      <th 
                        className="font-semibold text-left p-3 text-sm cursor-pointer"
                        onClick={() => handleSort('assignmentType')}
                      >
                        <div className="flex items-center">
                          Assignment Type
                          <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />
                        </div>
                      </th>
                      <th className="font-semibold text-right p-3 text-sm">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssignments.length > 0 ? (
                      filteredAssignments.map((assignment) => (
                        <tr key={`${assignment.driverId}-${assignment.weekId}`} className="border-t hover:bg-muted/30">
                          <td className="p-3">
                            <div className="font-medium">{assignment.driverName}</div>
                            <div className="text-xs text-muted-foreground">{assignment.driverId}</div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">
                              {assignment.seniorityNumber}
                            </Badge>
                          </td>
                          <td className="p-3">{assignment.weekId}</td>
                          <td className="p-3">
                            <div className="flex items-center">
                              <Calendar size={14} className="mr-1 text-muted-foreground" />
                              {assignment.weekDetails.startDate} - {assignment.weekDetails.endDate}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant={
                              assignment.assignmentType === 'manual' ? "secondary" : 
                              assignment.assignmentType === 'preference' ? "default" :
                              "outline"
                            }>
                              {assignment.assignmentType === 'manual' ? 'Manual Assignment' : 
                               assignment.assignmentType === 'preference' ? 'Driver Preference' : 
                               assignment.assignmentType === 'seniority' ? 'Seniority Based' :
                               'VC Assignment'}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            {assignment.assignmentType === 'manual' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-destructive"
                                onClick={() => handleRemoveAssignment(assignment)}
                              >
                                Remove
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-muted-foreground">
                          {searchTerm 
                            ? "No assignments match your search criteria" 
                            : "No vacation assignments have been created yet"
                          }
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

export default FinalVacationAssignmentsPage;