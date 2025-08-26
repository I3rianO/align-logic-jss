import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import useDriverStore from '@/store/driverStore';
import { ChevronLeft, FileSpreadsheet, RefreshCcw, ArrowUp, ArrowDown, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

function LivePicksSnapshotPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    drivers, 
    jobs, 
    getUniqueDriverPreferences,
    calculateJobAssignments,
    getAssignedJobForDriver,
    exportAssignments,
    cleanPreferences
  } = useDriverStore();

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending';
  }>({
    key: 'submissionTime', 
    direction: 'descending'
  });
  
  // Show print dialog
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  // Clean preferences on component mount to sync with current drivers/jobs
  useEffect(() => {
    cleanPreferences();
  }, [cleanPreferences]);
  
  // Get unique driver preferences (no duplicates)
  const uniquePreferences = getUniqueDriverPreferences();
  
  // Format submission time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    // Use 24-hour format for time display
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };
  
  // Format date for print view
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Format time for print view
  const formatPrintTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };
  
  // Get job ID
  const getJobIdentifier = (jobId: string) => {
    const job = jobs.find(job => job.jobId === jobId);
    return job ? job.jobId : 'Unknown Job';
  };
  
  // Get driver name from ID
  const getDriverName = (employeeId: string) => {
    const driver = drivers.find(driver => driver.employeeId === employeeId);
    return driver ? driver.name : 'Unknown Driver';
  };
  
  // Get driver seniority from ID
  const getDriverSeniority = (employeeId: string) => {
    const driver = drivers.find(driver => driver.employeeId === employeeId);
    return driver ? driver.seniorityNumber : null;
  };
  
  // Mock refresh function
  const refreshData = () => {
    cleanPreferences(); // Clean preferences to remove invalid entries
    toast({
      title: "Data Refreshed",
      description: "Live picks snapshot has been updated.",
      variant: "default",
    });
  };
  
  // Export data function
  const handleExport = () => {
    const csvContent = exportAssignments();
    triggerDownloadWithSaveDialog(csvContent, 'job_assignments');
    
    toast({
      title: "Export Prepared",
      description: "Choose where to save the job assignments CSV file.",
      variant: "default",
    });
  };
  
  // Show print dialog
  const handleShowPrintDialog = () => {
    setShowPrintDialog(true);
  };
  
  // Print the selections directly using browser's print functionality
  const handlePrintSelections = () => {
    // Open the print dialog
    window.print();
    
    // Close the dialog after printing
    setTimeout(() => {
      setShowPrintDialog(false);
    }, 500);
  };
  
  // Create file download with save dialog
  const triggerDownloadWithSaveDialog = (content: string, defaultFilename: string) => {
    // Create a Blob with the CSV content
    const blob = new Blob([content], { type: 'text/csv' });
    
    // Set up the file properties
    const link = document.createElement('a');
    link.download = `${defaultFilename}.csv`;
    link.href = URL.createObjectURL(blob);
    
    // Add the link to the document (required for Firefox)
    document.body.appendChild(link);
    
    // Trigger the click event to open the save dialog
    link.click();
    
    // Clean up - remove the link from the document
    document.body.removeChild(link);
    
    // Release the URL object
    URL.revokeObjectURL(link.href);
  };
  
  // Go back to admin dashboard
  const goBack = () => {
    navigate('/admin-dashboard');
  };
  
  // Determine submission status statistics
  const eligibleDrivers = drivers.filter(d => d.isEligible);
  const submittedCount = uniquePreferences.length;
  const notSubmittedCount = eligibleDrivers.length - submittedCount;
  const submissionRate = eligibleDrivers.length > 0 
    ? Math.round((submittedCount / eligibleDrivers.length) * 100) 
    : 0;

  // Sort table functionality
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
  };

  const getSortedData = () => {
    return [...uniquePreferences].sort((a, b) => {
      let aValue, bValue;

      // Determine the values to compare based on the sort key
      if (sortConfig.key === 'driverName') {
        aValue = getDriverName(a.driverId).toLowerCase();
        bValue = getDriverName(b.driverId).toLowerCase();
      } else if (sortConfig.key === 'driverId') {
        aValue = a.driverId;
        bValue = b.driverId;
      } else if (sortConfig.key === 'submissionTime') {
        aValue = new Date(a.submissionTime).getTime();
        bValue = new Date(b.submissionTime).getTime();
      } else if (sortConfig.key === 'seniorityNumber') {
        aValue = getDriverSeniority(a.driverId) || 999999;
        bValue = getDriverSeniority(b.driverId) || 999999;
      } else {
        aValue = a[sortConfig.key as keyof typeof a] || '';
        bValue = b[sortConfig.key as keyof typeof b] || '';
      }

      // Perform the sort
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };

  const getSortedDriversWithoutPicks = () => {
    const driversWithoutPicks = eligibleDrivers.filter(
      driver => !uniquePreferences.some(pref => pref.driverId === driver.employeeId)
    );

    return [...driversWithoutPicks].sort((a, b) => {
      let aValue, bValue;

      // Determine the values to compare based on the sort key
      if (sortConfig.key === 'driverName' || sortConfig.key === 'name') {
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
      } else if (sortConfig.key === 'driverId' || sortConfig.key === 'employeeId') {
        aValue = a.employeeId;
        bValue = b.employeeId;
      } else if (sortConfig.key === 'seniorityNumber') {
        aValue = a.seniorityNumber;
        bValue = b.seniorityNumber;
      } else {
        // Default sort by name if sort key doesn't apply
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
      }

      // Perform the sort
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };

  // Render sort indicator
  const renderSortIndicator = (key: string) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? 
      <ArrowUp size={16} className="ml-1 text-[#60a5fa]" /> : 
      <ArrowDown size={16} className="ml-1 text-[#60a5fa]" />;
  };

  return (
    <MainLayout title="Live Picks Snapshot">
      <div className="jss-container max-w-5xl mx-auto">
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between bg-[#f7f9fa] py-4 px-6 border-b">
            <CardTitle className="text-xl font-bold tracking-wide">Job Preference Submissions</CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="secondary"
                onClick={handleShowPrintDialog}
                className="flex items-center gap-1"
              >
                <Printer size={16} /> Generate Driver Board Printout
              </Button>
              <Button 
                variant="outline" 
                onClick={refreshData}
                size="sm"
                className="admin-btn-secondary flex items-center gap-1 text-sm"
              >
                <RefreshCcw size={16} /> Refresh
              </Button>
              <Button 
                variant="outline" 
                onClick={handleExport}
                size="sm"
                className="admin-btn-secondary flex items-center gap-1 text-sm"
              >
                <FileSpreadsheet size={16} /> Export
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <Card className="p-3 shadow-sm hover:shadow-md transition-all duration-200 border rounded-lg bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium mb-1 tracking-wide text-[#222]">Submitted</p>
                    <p className="text-xl font-bold text-[#222]">{submittedCount}</p>
                  </div>
                  <Badge className="bg-green-600 px-2 text-sm font-semibold text-white">{submissionRate}%</Badge>
                </div>
              </Card>
              
              <Card className="p-3 shadow-sm hover:shadow-md transition-all duration-200 border rounded-lg bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium mb-1 tracking-wide text-[#222]">Not Submitted</p>
                    <p className="text-xl font-bold text-[#222]">{notSubmittedCount}</p>
                  </div>
                  <Badge variant="outline" className="px-2 text-sm font-semibold border-2 text-[#222]">{eligibleDrivers.length - submittedCount}</Badge>
                </div>
              </Card>
              
              <Card className="p-3 shadow-sm hover:shadow-md transition-all duration-200 border rounded-lg bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium mb-1 tracking-wide text-[#222]">Total Eligible</p>
                    <p className="text-xl font-bold text-[#222]">{eligibleDrivers.length}</p>
                  </div>
                  <Badge variant="outline" className="px-2 text-sm font-semibold border-2 text-[#222]">Drivers</Badge>
                </div>
              </Card>
            </div>
            
            <div className="mb-3 flex gap-2 items-center">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 inline-block bg-amber-500 rounded-full"></span>
                <span className="text-sm font-medium text-[#222]">Current projected job assignment</span>
              </div>
            </div>
            
            <div className="border rounded-lg overflow-hidden shadow-sm mb-4">
              <div className="max-h-[400px] overflow-y-auto">
                <Table className="admin-table">
                  <TableHeader>
                    <TableRow className="bg-[#f7f9fa]">
                      <TableHead onClick={() => requestSort('driverName')} className="cursor-pointer hover:bg-[#f0f7ff] transition-colors duration-200">
                        <div className="flex items-center font-bold text-xs uppercase tracking-wider text-[#222] py-2">
                          Driver Name
                          {renderSortIndicator('driverName')}
                        </div>
                      </TableHead>
                      <TableHead onClick={() => requestSort('driverId')} className="cursor-pointer hover:bg-[#f0f7ff] transition-colors duration-200">
                        <div className="flex items-center font-bold text-xs uppercase tracking-wider text-[#222] py-2">
                          Employee ID
                          {renderSortIndicator('driverId')}
                        </div>
                      </TableHead>
                      <TableHead onClick={() => requestSort('seniorityNumber')} className="cursor-pointer hover:bg-[#f0f7ff] transition-colors duration-200">
                        <div className="flex items-center font-bold text-xs uppercase tracking-wider text-[#222] py-2">
                          Seniority #
                          {renderSortIndicator('seniorityNumber')}
                        </div>
                      </TableHead>
                      <TableHead onClick={() => requestSort('submissionTime')} className="cursor-pointer hover:bg-[#f0f7ff] transition-colors duration-200">
                        <div className="flex items-center font-bold text-xs uppercase tracking-wider text-[#222] py-2">
                          Submission Time
                          {renderSortIndicator('submissionTime')}
                        </div>
                      </TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-[#222] py-2">Preferences</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getSortedData().length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-[#222] text-sm">
                          No job preferences submitted yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      getSortedData().map((pref) => {
                        // Get the current job assignment for this driver
                        const currentAssignment = getAssignedJobForDriver(pref.driverId);
                        const seniorityNumber = getDriverSeniority(pref.driverId);
                        
                        return (
                          <TableRow key={pref.driverId} className="hover:bg-[#f0f7ff] transition-colors duration-200">
                            <TableCell className="font-medium py-2 text-[#222] text-sm">{getDriverName(pref.driverId)}</TableCell>
                            <TableCell className="py-2 text-[#222] text-sm">{pref.driverId}</TableCell>
                            <TableCell className="py-2">
                              <Badge variant="outline" className="bg-[#93c5fd]/30 text-[#1e5bb9] border-0 font-semibold text-sm">
                                {seniorityNumber !== null ? seniorityNumber : 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2 text-[#222] text-sm">{formatTime(pref.submissionTime)}</TableCell>
                            <TableCell className="py-2">
                              <div className="flex flex-wrap gap-1 items-center">
                                {pref.preferences.map((jobId, index) => (
                                  <div key={index} className="flex items-center">
                                    <Badge 
                                      variant="outline" 
                                      className="border text-xs font-medium mr-1 h-5 py-0"
                                    >
                                      {index + 1}
                                    </Badge>
                                    <span 
                                      className={`text-sm ${currentAssignment === jobId ? 'font-bold bg-amber-100 px-2 py-0.5 rounded-md text-amber-800' : 'text-[#222]'}`}
                                    >
                                      {getJobIdentifier(jobId)}
                                      {currentAssignment === jobId && " ★"}
                                    </span>
                                    {index < pref.preferences.length - 1 && <span className="mx-0.5">•</span>}
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            {/* List of drivers who haven't submitted */}
            {notSubmittedCount > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-bold mb-3 text-[#222]">Drivers Who Haven't Submitted</h3>
                <div className="border rounded-lg overflow-hidden shadow-sm">
                  <div className="max-h-[300px] overflow-y-auto">
                    <Table className="admin-table">
                      <TableHeader>
                        <TableRow className="bg-[#f7f9fa]">
                          <TableHead onClick={() => requestSort('name')} className="cursor-pointer hover:bg-[#f0f7ff] transition-colors duration-200">
                            <div className="flex items-center font-bold text-xs uppercase tracking-wider text-[#222] py-2">
                              Driver Name
                              {renderSortIndicator('name')}
                            </div>
                          </TableHead>
                          <TableHead onClick={() => requestSort('employeeId')} className="cursor-pointer hover:bg-[#f0f7ff] transition-colors duration-200">
                            <div className="flex items-center font-bold text-xs uppercase tracking-wider text-[#222] py-2">
                              Employee ID
                              {renderSortIndicator('employeeId')}
                            </div>
                          </TableHead>
                          <TableHead onClick={() => requestSort('seniorityNumber')} className="cursor-pointer hover:bg-[#f0f7ff] transition-colors duration-200">
                            <div className="flex items-center font-bold text-xs uppercase tracking-wider text-[#222] py-2">
                              Seniority #
                              {renderSortIndicator('seniorityNumber')}
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getSortedDriversWithoutPicks().map((driver) => (
                          <TableRow key={driver.employeeId} className="hover:bg-[#f0f7ff] transition-colors duration-200">
                            <TableCell className="font-medium py-2 text-[#222] text-sm">{driver.name}</TableCell>
                            <TableCell className="py-2 text-[#222] text-sm">{driver.employeeId}</TableCell>
                            <TableCell className="py-2">
                              <Badge variant="outline" className="bg-[#93c5fd]/30 text-[#1e5bb9] border-0 font-semibold text-sm">
                                {driver.seniorityNumber}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-6">
              <Button 
                variant="outline" 
                onClick={goBack}
                size="sm"
                className="admin-btn-secondary text-sm"
              >
                <ChevronLeft size={16} className="mr-1" /> Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Print Dialog */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Printer size={18} className="mr-2" />
              Driver Board Printout
            </DialogTitle>
            <DialogDescription>
              Below is a preview of the driver board printout. Press "Print" to print this document for posting.
            </DialogDescription>
          </DialogHeader>
          
          {/* Printable Content */}
          <div className="print-document">
            <div className="print-header">
              <h1 className="text-2xl font-bold">Current Job Selection Status</h1>
              <p className="text-sm text-muted-foreground">Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
              <p className="text-sm text-muted-foreground">
                Submission Rate: {submissionRate}% ({submittedCount} of {eligibleDrivers.length} drivers)
              </p>
            </div>
            
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-2">Driver Submissions (by Seniority)</h2>
              <table className="print-table w-full">
                <thead>
                  <tr>
                    <th>Seniority #</th>
                    <th>Driver Name</th>
                    <th>Employee ID</th>
                    <th>Submission Time</th>
                    <th>Preferences (in order)</th>
                  </tr>
                </thead>
                <tbody>
                  {uniquePreferences
                    .sort((a, b) => {
                      // Sort by seniority number - lowest first
                      const driverA = drivers.find(d => d.employeeId === a.driverId);
                      const driverB = drivers.find(d => d.employeeId === b.driverId);
                      return (driverA?.seniorityNumber || 999) - (driverB?.seniorityNumber || 999);
                    })
                    .map((pref) => {
                      const driver = drivers.find(d => d.employeeId === pref.driverId);
                      if (!driver) return null;
                      
                      // Format preferences as a comma-separated list
                      const preferencesList = pref.preferences.map((jobId, index) => {
                        return `${index + 1}. ${jobId}`;
                      }).join(', ');
                      
                      return (
                        <tr key={pref.driverId}>
                          <td>{driver.seniorityNumber}</td>
                          <td>{driver.name}</td>
                          <td>{pref.driverId}</td>
                          <td>{formatDate(pref.submissionTime)} {formatPrintTime(pref.submissionTime)}</td>
                          <td>{preferencesList}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            
            {notSubmittedCount > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-2">Drivers Without Submissions (by Seniority)</h2>
                <table className="print-table w-full">
                  <thead>
                    <tr>
                      <th>Seniority #</th>
                      <th>Driver Name</th>
                      <th>Employee ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedDriversWithoutPicks().map((driver) => (
                      <tr key={driver.employeeId}>
                        <td>{driver.seniorityNumber}</td>
                        <td>{driver.name}</td>
                        <td>{driver.employeeId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="print-footer">
              <p>Job Selection System - Driver Board Information</p>
              <p>This document is for official use only.</p>
            </div>
          </div>
          
          <DialogFooter className="no-print">
            <Button variant="outline" onClick={() => setShowPrintDialog(false)}>
              Close
            </Button>
            <Button onClick={handlePrintSelections} className="flex items-center gap-2">
              <Printer size={16} />
              Print Driver Board
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

export default LivePicksSnapshotPage;