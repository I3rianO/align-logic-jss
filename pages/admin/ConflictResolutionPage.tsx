import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import useDriverStore from '@/store/driverStore';
import { ChevronLeft, Search, ArrowUpDown, MessageSquare, Users, AlertCircle, CheckCircle2, PrinterIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface ConflictDetail {
  jobId: string;
  jobDetails: {
    startTime: string;
    weekDays: string;
    isAirport: boolean;
  };
  disputingDrivers: {
    driverId: string;
    driverName: string;
    seniorityNumber: number;
    submissionTime: string;
    gotJob: boolean;
  }[];
  winningDriver?: {
    driverId: string;
    driverName: string;
    seniorityNumber: number;
  };
  resolved: boolean;
}

function ConflictResolutionPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<ConflictDetail | null>(null);
  
  const { 
    drivers, 
    jobs, 
    getUniqueDriverPreferences, 
    calculateJobAssignments,
    cleanPreferences
  } = useDriverStore();
  
  // Clean preferences on component mount
  useEffect(() => {
    cleanPreferences();
  }, [cleanPreferences]);
  
  // Get all necessary data
  const jobAssignments = calculateJobAssignments();
  const uniquePreferences = getUniqueDriverPreferences();
  
  // Calculate job conflicts (jobs where multiple drivers selected it as their 1st choice)
  const jobConflicts = useMemo(() => {
    const conflicts: ConflictDetail[] = [];
    
    // Group preferences by first choice
    const firstChoiceMap: Record<string, string[]> = {};
    
    uniquePreferences.forEach(pref => {
      if (pref.preferences.length > 0) {
        const firstChoice = pref.preferences[0];
        if (!firstChoiceMap[firstChoice]) {
          firstChoiceMap[firstChoice] = [];
        }
        firstChoiceMap[firstChoice].push(pref.driverId);
      }
    });
    
    // Process each job with multiple first choices
    Object.entries(firstChoiceMap).forEach(([jobId, driverIds]) => {
      if (driverIds.length > 1) {
        // This job has a conflict - multiple drivers wanting it as first choice
        const job = jobs.find(j => j.jobId === jobId);
        
        if (!job) return; // Skip if job not found
        
        // Find which driver (if any) actually got assigned this job
        const assignment = jobAssignments.find(a => a.jobId === jobId);
        
        // Get all drivers involved in the conflict
        const disputingDrivers = driverIds.map(driverId => {
          const driver = drivers.find(d => d.employeeId === driverId);
          const pref = uniquePreferences.find(p => p.driverId === driverId);
          
          if (!driver || !pref) return null;
          
          return {
            driverId,
            driverName: driver.name,
            seniorityNumber: driver.seniorityNumber,
            submissionTime: pref.submissionTime,
            gotJob: assignment ? assignment.driverId === driverId : false
          };
        }).filter(Boolean) as {
          driverId: string;
          driverName: string;
          seniorityNumber: number;
          submissionTime: string;
          gotJob: boolean;
        }[];
        
        // Find the winning driver (if any)
        const winningDriver = disputingDrivers.find(d => d.gotJob);
        
        conflicts.push({
          jobId,
          jobDetails: {
            startTime: job.startTime,
            weekDays: job.weekDays,
            isAirport: job.isAirport
          },
          disputingDrivers: disputingDrivers.sort((a, b) => a.seniorityNumber - b.seniorityNumber),
          winningDriver: winningDriver ? {
            driverId: winningDriver.driverId,
            driverName: winningDriver.driverName,
            seniorityNumber: winningDriver.seniorityNumber
          } : undefined,
          resolved: !!assignment
        });
      }
    });
    
    return conflicts;
  }, [uniquePreferences, jobs, jobAssignments, drivers]);
  
  // Filter conflicts based on search term
  const filteredConflicts = useMemo(() => {
    if (!searchTerm) return jobConflicts;
    
    const term = searchTerm.toLowerCase();
    return jobConflicts.filter(conflict => 
      conflict.jobId.toLowerCase().includes(term) ||
      conflict.disputingDrivers.some(d => 
        d.driverName.toLowerCase().includes(term) || 
        d.driverId.toLowerCase().includes(term)
      )
    );
  }, [jobConflicts, searchTerm]);
  
  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };
  
  // Handle print conflict details
  const handlePrintConflictDetails = (conflict: ConflictDetail) => {
    setSelectedConflict(conflict);
    setPrintDialogOpen(true);
  };
  
  // Execute print
  const executePrint = () => {
    window.print();
    setTimeout(() => {
      setPrintDialogOpen(false);
    }, 500);
  };
  
  return (
    <MainLayout title="Job Selection Conflicts">
      <div className="container max-w-6xl py-6">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate('/admin-dashboard')}
        >
          <ChevronLeft size={16} className="mr-1" /> Back to Dashboard
        </Button>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Job Selection Conflicts</CardTitle>
            <CardDescription>
              View and resolve job selection conflicts where multiple drivers selected the same job as their first choice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Summary statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Conflicts</p>
                      <p className="text-2xl font-bold">{jobConflicts.length}</p>
                    </div>
                    <MessageSquare className="text-blue-500" />
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Resolved</p>
                      <p className="text-2xl font-bold text-green-600">{jobConflicts.filter(c => c.resolved).length}</p>
                    </div>
                    <CheckCircle2 className="text-green-500" />
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Unresolved</p>
                      <p className="text-2xl font-bold text-amber-600">{jobConflicts.filter(c => !c.resolved).length}</p>
                    </div>
                    <AlertCircle className="text-amber-500" />
                  </div>
                </Card>
                
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Drivers Involved</p>
                      <p className="text-2xl font-bold">{
                        new Set(jobConflicts.flatMap(c => c.disputingDrivers.map(d => d.driverId))).size
                      }</p>
                    </div>
                    <Users className="text-blue-500" />
                  </div>
                </Card>
              </div>
              
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conflicts by job ID or driver name..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Help information */}
              <div className="p-4 rounded-md bg-blue-50 border border-blue-200 mb-4">
                <div className="flex items-start">
                  <MessageSquare className="text-blue-600 mr-2 mt-1" size={16} />
                  <div>
                    <h4 className="text-blue-800 font-medium">Understanding Job Selection Conflicts</h4>
                    <p className="text-blue-700 text-sm">
                      When multiple drivers select the same job as their first choice, the system resolves the conflict based on seniority.
                      The driver with the highest seniority (lowest seniority number) gets their first choice.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Conflicts table */}
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job ID</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Conflict Status</TableHead>
                      <TableHead>Drivers Involved</TableHead>
                      <TableHead>Driver Awarded Job</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConflicts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                          {searchTerm ? "No conflicts match your search" : "No job selection conflicts detected"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredConflicts.map((conflict) => (
                        <TableRow key={conflict.jobId} className="group hover:bg-muted/50">
                          <TableCell className="font-medium">
                            {conflict.jobId}
                            {conflict.jobDetails.isAirport && (
                              <Badge className="bg-blue-500 ml-2">Airport</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {conflict.jobDetails.startTime} ({conflict.jobDetails.weekDays})
                          </TableCell>
                          <TableCell>
                            {conflict.resolved ? (
                              <Badge className="bg-green-500">Resolved</Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-600 border-amber-500">Unresolved</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {conflict.disputingDrivers.map((driver, idx) => (
                                <Badge 
                                  key={driver.driverId}
                                  variant="outline"
                                  className={`${driver.gotJob ? 'border-green-500 text-green-600' : ''}`}
                                >
                                  {driver.driverName} ({driver.seniorityNumber})
                                  {idx < conflict.disputingDrivers.length - 1 ? ',' : ''}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {conflict.winningDriver ? (
                              <div>
                                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                                  {conflict.winningDriver.driverName}
                                </Badge>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Seniority: {conflict.winningDriver.seniorityNumber}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic text-sm">Unresolved</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePrintConflictDetails(conflict)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <PrinterIcon className="h-4 w-4 mr-1" /> Print Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Resolution policy */}
              <div className="p-4 rounded-md bg-gray-50 border">
                <h3 className="font-medium text-base mb-2">Conflict Resolution Policy</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    <span className="font-medium">Seniority Priority:</span> The driver with the highest seniority (lowest seniority number) 
                    receives their first choice when multiple drivers select the same job.
                  </li>
                  <li>
                    <span className="font-medium">Alternate Assignments:</span> Other drivers involved in the conflict are assigned their next 
                    available preference (that hasn't been taken by a higher seniority driver).
                  </li>
                  <li>
                    <span className="font-medium">Special Qualifications:</span> For airport jobs, only airport-certified drivers are eligible,
                    and the highest seniority airport-certified driver gets the job.
                  </li>
                  <li>
                    <span className="font-medium">Manual Overrides:</span> In special circumstances, administrators may manually assign jobs, 
                    which will be clearly marked as "Manual" assignments.
                  </li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Print Dialog */}
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <PrinterIcon className="h-5 w-5 mr-2" />
              Print Conflict Resolution Details
            </DialogTitle>
          </DialogHeader>
          
          {/* Printable content */}
          {selectedConflict && (
            <div className="print-document space-y-6 py-4">
              <div>
                <h2 className="text-2xl font-bold">Job Selection Conflict Details</h2>
                <p className="text-muted-foreground">Generated on {new Date().toLocaleDateString()}</p>
              </div>
              
              <div className="border-b pb-4">
                <h3 className="text-xl font-semibold mb-2">Job Information</h3>
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="font-medium pr-4">Job ID:</td>
                      <td>{selectedConflict.jobId}</td>
                    </tr>
                    <tr>
                      <td className="font-medium pr-4">Start Time:</td>
                      <td>{selectedConflict.jobDetails.startTime}</td>
                    </tr>
                    <tr>
                      <td className="font-medium pr-4">Work Days:</td>
                      <td>{selectedConflict.jobDetails.weekDays}</td>
                    </tr>
                    <tr>
                      <td className="font-medium pr-4">Airport Job:</td>
                      <td>{selectedConflict.jobDetails.isAirport ? 'Yes' : 'No'}</td>
                    </tr>
                    <tr>
                      <td className="font-medium pr-4">Resolution Status:</td>
                      <td>{selectedConflict.resolved ? 'Resolved' : 'Unresolved'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="border-b pb-4">
                <h3 className="text-xl font-semibold mb-2">Drivers Involved</h3>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Driver Name</th>
                      <th className="text-left py-2">Employee ID</th>
                      <th className="text-left py-2">Seniority #</th>
                      <th className="text-left py-2">Submission Time</th>
                      <th className="text-left py-2">Job Awarded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedConflict.disputingDrivers.map(driver => (
                      <tr key={driver.driverId} className="border-b">
                        <td className="py-2">{driver.driverName}</td>
                        <td className="py-2">{driver.driverId}</td>
                        <td className="py-2">{driver.seniorityNumber}</td>
                        <td className="py-2">{formatTime(driver.submissionTime)}</td>
                        <td className="py-2">{driver.gotJob ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="border-b pb-4">
                <h3 className="text-xl font-semibold mb-2">Resolution Summary</h3>
                {selectedConflict.resolved ? (
                  <div>
                    <p>
                      This job was awarded to <strong>{selectedConflict.winningDriver?.driverName}</strong> (Employee ID: {selectedConflict.winningDriver?.driverId}) 
                      with seniority number <strong>{selectedConflict.winningDriver?.seniorityNumber}</strong>.
                    </p>
                    <p className="mt-2">
                      This decision was made based on the company's job selection policy, which awards contested jobs to the 
                      driver with the highest seniority (lowest seniority number) who selected it as their first choice.
                    </p>
                  </div>
                ) : (
                  <p>
                    This conflict has not yet been resolved. The job will be awarded based on the company's job selection policy,
                    which awards contested jobs to the driver with the highest seniority (lowest seniority number) who selected it as their first choice.
                  </p>
                )}
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-2">Conflict Resolution Policy</h3>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>
                    When multiple drivers select the same job as their first choice, the driver with the highest seniority (lowest seniority number) 
                    receives their first choice.
                  </li>
                  <li>
                    Other drivers involved in the conflict are assigned their next available preference (that hasn't been taken by a higher seniority driver).
                  </li>
                  <li>
                    For airport jobs, only airport-certified drivers are eligible, and the highest seniority airport-certified driver gets the job.
                  </li>
                  <li>
                    In special circumstances, administrators may manually assign jobs, which will be clearly marked as "Manual" assignments.
                  </li>
                </ol>
              </div>
              
              <div className="pt-4 text-sm text-center text-muted-foreground">
                <p>This document was generated by the Job Selection System for administrative purposes only.</p>
                <p>Contact system administrator with any questions about this resolution.</p>
              </div>
            </div>
          )}
          
          <DialogFooter className="no-print">
            <Button variant="outline" onClick={() => setPrintDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={executePrint}>
              <PrinterIcon className="h-4 w-4 mr-2" /> Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

export default ConflictResolutionPage;