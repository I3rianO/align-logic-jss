import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import useDriverStore, { Job } from '@/store/driverStore';
import { ChevronLeft, PlusCircle, Save, Trash2, CheckSquare, Square, ArrowUp, ArrowDown, FileText, Copy } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import { DataGrid, DataGridColumn } from '@/components/ui/data-grid';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function EditJobsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { jobs, addJob, updateJob, deleteJob } = useDriverStore();
  
  // State for the jobs list
  const [jobsList, setJobsList] = useState<Job[]>(jobs);
  const [isAddingJob, setIsAddingJob] = useState<boolean>(false);
  const [newJob, setNewJob] = useState<Job>({
    jobId: '',
    startTime: '08:00',
    isAirport: false,
    weekDays: 'Mon-Fri'
  });

  // State for bulk edit
  const [bulkJobsText, setBulkJobsText] = useState<string>('');
  const [bulkExportDialogOpen, setBulkExportDialogOpen] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<string>('table');

  // State for Grid view
  const [gridData, setGridData] = useState<any[]>([]);

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Job;
    direction: 'ascending' | 'descending';
  }>({
    key: 'jobId', 
    direction: 'ascending'
  });

  // Time input state for more controlled time input
  const [timeInputs, setTimeInputs] = useState<{ [jobId: string]: string }>({});
  const [newJobHour, setNewJobHour] = useState<string>("08");
  const [newJobMinute, setNewJobMinute] = useState<string>("00");

  // Multi-select state
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

  // Hours and minutes for dropdowns
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  // Update jobsList when jobs change in the store
  useEffect(() => {
    setJobsList(jobs);
    
    // Initialize time inputs
    const initialTimeInputs = jobs.reduce((acc, job) => {
      acc[job.jobId] = job.startTime;
      return acc;
    }, {} as { [jobId: string]: string });
    
    setTimeInputs(initialTimeInputs);

    // Format data for the grid view
    const formattedData = jobs.map((job, index) => {
      const [hour, minute] = job.startTime.split(':');
      return {
        id: index,
        jobId: job.jobId,
        weekDays: job.weekDays,
        startTimeHour: hour,
        startTimeMinute: minute,
        isAirport: job.isAirport
      };
    });
    
    setGridData(formattedData);
  }, [jobs]);

  // Define data grid columns
  const dataGridColumns: DataGridColumn[] = [
    {
      header: 'Job ID',
      accessorKey: 'jobId',
      width: 150,
      sortable: true,
      cell: ({ row, rowIndex }: any) => (
        <Input
          value={row.jobId || ''}
          onChange={(e) => handleGridCellChange(rowIndex, 'jobId', e.target.value)}
          className="w-full h-8"
        />
      ),
    },
    {
      header: 'Work Days',
      accessorKey: 'weekDays',
      width: 150,
      sortable: true,
      cell: ({ row, rowIndex }: any) => (
        <Input
          value={row.weekDays || ''}
          onChange={(e) => handleGridCellChange(rowIndex, 'weekDays', e.target.value)}
          className="w-full h-8"
        />
      ),
    },
    {
      header: 'Start Time',
      accessorKey: 'startTime',
      width: 220,
      sortable: true,
      cell: ({ row, rowIndex }: any) => (
        <div className="flex items-center gap-1">
          <Select 
            value={row.startTimeHour || '00'}
            onValueChange={(newHour) => handleGridCellChange(rowIndex, 'startTimeHour', newHour)}
          >
            <SelectTrigger className="w-[80px] h-8">
              <SelectValue placeholder="Hour" />
            </SelectTrigger>
            <SelectContent>
              {hours.map((h) => (
                <SelectItem key={h} value={h}>{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-base font-medium">:</span>
          <Select 
            value={row.startTimeMinute || '00'}
            onValueChange={(newMinute) => handleGridCellChange(rowIndex, 'startTimeMinute', newMinute)}
          >
            <SelectTrigger className="w-[80px] h-8">
              <SelectValue placeholder="Minute" />
            </SelectTrigger>
            <SelectContent>
              {minutes.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ),
    }
  ];

  // Initialize bulk text when dialog opens
  useEffect(() => {
    if (bulkExportDialogOpen) {
      // Create a tab/CSV format text from jobs
      const csvHeader = "JobID\tWeekDays\tStartTime\tAirport";
      const csvRows = jobsList.map(job => 
        `${job.jobId}\t${job.weekDays}\t${job.startTime}\t${job.isAirport ? 'Yes' : 'No'}`
      ).join('\n');
      
      setBulkJobsText(`${csvHeader}\n${csvRows}`);
    }
  }, [bulkExportDialogOpen, jobsList]);

  // Handle saving changes to jobs
  const saveChanges = () => {
    if (selectedTab === 'bulk') {
      handleBulkImport();
      return;
    }

    if (selectedTab === 'master') {
      // Convert grid data back to job format
      const jobsFromGrid = gridData.map(row => ({
        jobId: row.jobId,
        weekDays: row.weekDays,
        startTime: `${row.startTimeHour || '00'}:${row.startTimeMinute || '00'}`,
        isAirport: row.isAirport || false
      }));
      
      // Validate job data
      const invalidJobs = jobsFromGrid.filter(job => !job.jobId.trim());
      
      if (invalidJobs.length > 0) {
        toast({
          title: "Invalid Job IDs",
          description: "All Job IDs must be specified.",
          variant: "destructive",
        });
        return;
      }
      
      // Check for duplicate job IDs
      const jobIds = jobsFromGrid.map(job => job.jobId);
      const hasDuplicates = jobIds.some((id, index) => 
        jobIds.indexOf(id) !== index
      );
      
      if (hasDuplicates) {
        toast({
          title: "Duplicate Job IDs",
          description: "Each job must have a unique Job ID.",
          variant: "destructive",
        });
        return;
      }
      
      // Clear existing jobs and add the new ones
      jobs.forEach(job => {
        deleteJob(job.jobId);
      });
      
      jobsFromGrid.forEach(job => {
        addJob(job);
      });
      
      toast({
        title: "Jobs Updated",
        description: "Job information has been successfully updated.",
        variant: "default",
      });
      return;
    }

    // Validate all job IDs are not empty
    const invalidJobs = jobsList.filter(job => !job.jobId.trim());
    
    if (invalidJobs.length > 0) {
      toast({
        title: "Invalid Job IDs",
        description: "All Job IDs must be specified.",
        variant: "destructive",
      });
      return;
    }
    
    // Check for duplicate job IDs
    const jobIds = jobsList.map(job => job.jobId);
    const hasDuplicates = jobIds.some((id, index) => 
      jobIds.indexOf(id) !== index
    );
    
    if (hasDuplicates) {
      toast({
        title: "Duplicate Job IDs",
        description: "Each job must have a unique Job ID.",
        variant: "destructive",
      });
      return;
    }
    
    // Update all jobs in the store
    jobsList.forEach(job => {
      updateJob(job);
    });
    
    toast({
      title: "Jobs Updated",
      description: "Job information has been successfully updated.",
      variant: "default",
    });
  };

  // Add a new row to the grid
  const handleAddGridRow = () => {
    const newRow = {
      id: gridData.length,
      jobId: '',
      weekDays: 'Mon-Fri',
      startTimeHour: '08',
      startTimeMinute: '00',
      isAirport: false
    };
    
    setGridData([...gridData, newRow]);
  };

  // Handle grid cell changes
  const handleGridCellChange = (rowIndex: number, field: string, value: any) => {
    const updatedData = [...gridData];
    updatedData[rowIndex][field] = value;
    setGridData(updatedData);
  };

  // Handle bulk import from text
  const handleBulkImport = () => {
    // Parse the text content
    const lines = bulkJobsText.trim().split('\n');
    
    // Skip the first line if it's a header (contains string "JobID" or similar)
    const startIndex = lines[0].includes('JobID') || lines[0].includes('Job ID') ? 1 : 0;
    
    // Process each line
    const newJobs: Job[] = [];
    const errors: string[] = [];
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines
      
      // Split by tab or multiple spaces or comma
      const parts = line.split(/[\t,]|(\s{2,})/g).filter(Boolean);
      
      if (parts.length < 3) {
        errors.push(`Line ${i+1}: Not enough data (need at least Job ID, Week Days, and Start Time)`);
        continue;
      }
      
      const jobId = parts[0].trim();
      
      // Check Job ID is not empty
      if (!jobId) {
        errors.push(`Line ${i+1}: Job ID cannot be empty`);
        continue;
      }
      
      const weekDays = parts[1].trim();
      
      // Validate start time format (HH:MM or H:MM)
      const startTime = parts[2].trim();
      if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(startTime)) {
        errors.push(`Line ${i+1}: Invalid Start Time format. Use 24-hour format HH:MM`);
        continue;
      }
      
      // Parse isAirport if it exists
      let isAirport = false;
      if (parts.length > 3) {
        isAirport = ['yes', 'y', 'true', '1', 'airport'].includes(parts[3].trim().toLowerCase());
      }
      
      newJobs.push({
        jobId,
        weekDays,
        startTime,
        isAirport
      });
    }
    
    // Check for duplicate job IDs
    const jobIds = newJobs.map(job => job.jobId);
    const hasDuplicateIds = jobIds.some((id, index) => 
      jobIds.indexOf(id) !== index
    );
    
    if (hasDuplicateIds) {
      errors.push("Duplicate Job IDs found. Each job must have a unique Job ID.");
    }
    
    // If there are errors, show them to the user
    if (errors.length > 0) {
      toast({
        title: "Import Errors",
        description: (
          <div>
            <p>Please fix the following errors:</p>
            <ul className="list-disc pl-4 mt-2">
              {errors.slice(0, 3).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
              {errors.length > 3 && <li>...and {errors.length - 3} more errors</li>}
            </ul>
          </div>
        ),
        variant: "destructive",
      });
      return;
    }
    
    // Update the jobs list with the new jobs
    setJobsList(newJobs);
    
    // Update grid data
    const newGridData = newJobs.map((job, index) => {
      const [hour, minute] = job.startTime.split(':');
      return {
        id: index,
        jobId: job.jobId,
        weekDays: job.weekDays,
        startTimeHour: hour,
        startTimeMinute: minute,
        isAirport: job.isAirport
      };
    });
    
    setGridData(newGridData);
    
    // Update all jobs in the store
    jobs.forEach(job => {
      deleteJob(job.jobId);
    });
    
    newJobs.forEach(job => {
      addJob(job);
    });
    
    toast({
      title: "Import Successful",
      description: `Successfully imported ${newJobs.length} jobs.`,
      variant: "default",
    });
    
    // Switch to master view
    setSelectedTab('master');
  };

  // Handle copying bulk export text
  const handleCopyBulkText = () => {
    navigator.clipboard.writeText(bulkJobsText)
      .then(() => {
        toast({
          title: "Copied to Clipboard",
          description: "Job data has been copied to your clipboard.",
          variant: "default",
        });
        setBulkExportDialogOpen(false);
      })
      .catch(() => {
        toast({
          title: "Copy Failed",
          description: "Failed to copy data to clipboard. Please try again or select and copy manually.",
          variant: "destructive",
        });
      });
  };

  // Handle adding a new job
  const handleAddJob = () => {
    // Validate job ID
    if (!newJob.jobId.trim()) {
      toast({
        title: "Invalid Job ID",
        description: "Job ID must be specified.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if job ID already exists
    if (jobsList.some(job => job.jobId === newJob.jobId)) {
      toast({
        title: "Duplicate Job ID",
        description: "A job with this Job ID already exists.",
        variant: "destructive",
      });
      return;
    }
    
    // Format the job's start time from hour and minute selections
    const formattedStartTime = `${newJobHour}:${newJobMinute}`;
    
    // Create the job with properly formatted time
    const jobToAdd = {
      ...newJob,
      startTime: formattedStartTime
    };
    
    // Add new job
    addJob(jobToAdd);
    setJobsList([...jobsList, jobToAdd]);
    
    // Add to grid data
    const newGridRow = {
      id: gridData.length,
      jobId: jobToAdd.jobId,
      weekDays: jobToAdd.weekDays,
      startTimeHour: newJobHour,
      startTimeMinute: newJobMinute,
      isAirport: jobToAdd.isAirport
    };
    setGridData([...gridData, newGridRow]);
    
    // Reset form
    setNewJob({
      jobId: '',
      startTime: '08:00',
      isAirport: false,
      weekDays: 'Mon-Fri'
    });
    setNewJobHour("08");
    setNewJobMinute("00");
    
    setIsAddingJob(false);
    
    toast({
      title: "Job Added",
      description: "New job has been successfully added.",
      variant: "default",
    });
  };

  // Handle toggling a job's selection
  const toggleJobSelection = (jobId: string) => {
    setSelectedJobs(prevSelected => {
      if (prevSelected.includes(jobId)) {
        return prevSelected.filter(id => id !== jobId);
      } else {
        return [...prevSelected, jobId];
      }
    });
  };

  // Handle toggling all jobs selection
  const toggleSelectAll = () => {
    if (selectAll) {
      // If currently all selected, deselect all
      setSelectedJobs([]);
      setSelectAll(false);
    } else {
      // If not all selected, select all
      setSelectedJobs(jobsList.map(job => job.jobId));
      setSelectAll(true);
    }
  };

  // Update selectAll status when selectedJobs changes
  useEffect(() => {
    if (jobsList.length > 0) {
      setSelectAll(selectedJobs.length === jobsList.length);
    }
  }, [selectedJobs, jobsList]);

  // Handle deleting multiple jobs
  const handleDeleteMultipleJobs = () => {
    // Close the confirmation dialog
    setIsDeleteDialogOpen(false);
    
    // Delete all selected jobs
    selectedJobs.forEach(jobId => {
      deleteJob(jobId);
    });
    
    // Update the jobs list
    setJobsList(jobsList.filter(job => !selectedJobs.includes(job.jobId)));
    
    // Update grid data
    setGridData(gridData.filter(row => !selectedJobs.includes(row.jobId)));
    
    // Clear selected jobs
    setSelectedJobs([]);
    setSelectAll(false);
    
    toast({
      title: "Jobs Removed",
      description: `Successfully removed ${selectedJobs.length} jobs.`,
      variant: "default",
    });
  };

  // Handle deleting a single job
  const handleDeleteJob = (jobId: string) => {
    deleteJob(jobId);
    setJobsList(jobsList.filter(job => job.jobId !== jobId));
    
    // Update grid data
    setGridData(gridData.filter(row => row.jobId !== jobId));
    
    toast({
      title: "Job Removed",
      description: "Job has been successfully removed.",
      variant: "default",
    });
  };

  // Handle updating a job field
  const handleJobFieldChange = (index: number, field: keyof Job, value: any) => {
    const updatedJobs = [...jobsList];
    
    // Special handling for time input to avoid the cursor jump issue with 24-hour format
    if (field === 'startTime') {
      // Only update if the value is valid
      if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value) || value === '') {
        updatedJobs[index][field] = value;
      }
    } else {
      // @ts-ignore - This is a safe operation as we're controlling the field names
      updatedJobs[index][field] = value;
    }
    
    setJobsList(updatedJobs);
  };

  // Handle time change for a job
  const handleTimeChange = (index: number, hour: string, minute: string) => {
    const updatedJobs = [...jobsList];
    updatedJobs[index].startTime = `${hour}:${minute}`;
    setJobsList(updatedJobs);
  };

  // Go back to admin dashboard
  const goBack = () => {
    navigate('/admin');
  };
  
  // Select/deselect all for airport jobs
  const toggleAllAirport = (value: boolean) => {
    const updatedJobs = jobsList.map(job => ({
      ...job,
      isAirport: value
    }));
    
    setJobsList(updatedJobs);
    
    toast({
      title: value ? "All Jobs Set as Airport" : "All Airport Status Cleared",
      description: `Successfully ${value ? 'marked' : 'unmarked'} all jobs.`,
    });
  };
  
  // Check if all jobs are airport jobs
  const areAllAirport = () => {
    return jobsList.length > 0 && jobsList.every(job => job.isAirport === true);
  };

  // Sort table functionality
  const requestSort = (key: keyof Job) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
  };

  // Get sorted job list
  const getSortedJobs = () => {
    return [...jobsList].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Special handling for string comparisons (case insensitive)
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      // Special handling for boolean values
      if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        // Use separate variables for the numeric comparison
        const aNum = aValue ? 1 : 0;
        const bNum = bValue ? 1 : 0;
        
        // Perform the sort based on numeric values
        if (aNum < bNum) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aNum > bNum) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      }

      // Special handling for startTime to sort properly
      if (sortConfig.key === 'startTime') {
        const [aHour, aMinute] = (aValue as string).split(':').map(Number);
        const [bHour, bMinute] = (bValue as string).split(':').map(Number);
        
        const aMinutes = aHour * 60 + aMinute;
        const bMinutes = bHour * 60 + bMinute;
        
        if (aMinutes < bMinutes) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aMinutes > bMinutes) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      }

      // For other types, compare directly
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
  const renderSortIndicator = (key: keyof Job) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? <ArrowUp size={16} className="ml-1 text-accent" /> : <ArrowDown size={16} className="ml-1 text-accent" />;
  };

  // Handle data grid changes
  const handleDataGridChange = (newData: any[]) => {
    setGridData(newData);
  };

  return (
    <MainLayout title="Edit Jobs">
      <div className="jss-container py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between bg-[#f7f9fa] py-6 px-8 border-b">
            <CardTitle className="text-2xl font-bold tracking-wide">Job Management</CardTitle>
            <div className="flex gap-3">
              <Button 
                onClick={saveChanges}
                className="bg-[#3b82f6] text-white hover:bg-[#3b82f6]/90 rounded-md px-5 py-2.5 font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <Save size={18} /> Save Changes
              </Button>
              <Dialog open={isAddingJob} onOpenChange={setIsAddingJob}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-[#3b82f6] text-white hover:bg-[#3b82f6]/90 rounded-md px-5 py-2.5 font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
                  >
                    <PlusCircle size={18} /> Add Job
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white rounded-lg border shadow-[rgba(0,0,0,0.04)_0px_2px_8px]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Add New Job</DialogTitle>
                    <DialogDescription className="text-[#333] text-base">
                      Enter the details for the new job below.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6 py-4">
                    <div className="grid gap-2">
                      <label htmlFor="jobId" className="text-sm font-medium text-[#333] tracking-wide">
                        Job ID
                      </label>
                      <Input
                        id="jobId"
                        placeholder="e.g. J001"
                        value={newJob.jobId}
                        onChange={(e) => setNewJob({...newJob, jobId: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <label htmlFor="weekDays" className="text-sm font-medium text-[#333] tracking-wide">
                        Work Days
                      </label>
                      <Input
                        id="weekDays"
                        placeholder="e.g. Mon-Fri"
                        value={newJob.weekDays}
                        onChange={(e) => setNewJob({...newJob, weekDays: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-[#333] tracking-wide">
                        Start Time
                      </label>
                      <div className="flex items-center gap-2">
                        <Select value={newJobHour} onValueChange={setNewJobHour}>
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Hour" />
                          </SelectTrigger>
                          <SelectContent>
                            {hours.map(hour => (
                              <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-lg font-medium">:</span>
                        <Select value={newJobMinute} onValueChange={setNewJobMinute}>
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Minute" />
                          </SelectTrigger>
                          <SelectContent>
                            {minutes.map(minute => (
                              <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isAirport"
                        checked={newJob.isAirport}
                        onCheckedChange={(checked) => setNewJob({...newJob, isAirport: checked === true})}
                      />
                      <label htmlFor="isAirport" className="text-sm font-medium text-[#333] tracking-wide">
                        Airport Job (requires certification)
                      </label>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddingJob(false)}
                      className="border border-[#3b82f6] text-[#3b82f6] hover:bg-[#93c5fd]/20 rounded-md px-5 py-2.5 font-medium transition-all duration-200"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddJob}
                      className="bg-[#3b82f6] text-white hover:bg-[#3b82f6]/90 rounded-md px-5 py-2.5 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      Add Job
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              {/* Bulk Export Dialog */}
              <Dialog open={bulkExportDialogOpen} onOpenChange={setBulkExportDialogOpen}>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Export Job Data</DialogTitle>
                    <DialogDescription>
                      Copy this data to use in spreadsheets or to save as a backup
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="py-4">
                    <Textarea
                      className="font-mono text-sm h-[400px]"
                      value={bulkJobsText}
                      readOnly
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setBulkExportDialogOpen(false)}>
                      Close
                    </Button>
                    <Button onClick={handleCopyBulkText}>
                      <Copy size={16} className="mr-2" /> Copy to Clipboard
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full mb-6">
              <TabsList className="grid w-[600px] grid-cols-2">
                <TabsTrigger value="table">Table View</TabsTrigger>
                <TabsTrigger value="master">Master List</TabsTrigger>
              </TabsList>
              
              <TabsContent value="table" className="mt-6">
                <div className="mb-4 flex justify-between">
                  <div className="flex items-center space-x-2">
                    {selectedJobs.length > 0 && (
                      <Button 
                        variant="destructive" 
                        onClick={() => setIsDeleteDialogOpen(true)} 
                        className="flex items-center gap-2"
                      >
                        <Trash2 size={16} /> Delete Selected ({selectedJobs.length})
                      </Button>
                    )}
                  </div>
                  <Button variant="outline" onClick={() => setBulkExportDialogOpen(true)}>
                    <FileText size={16} className="mr-2" /> Export Data
                  </Button>
                </div>
                
                <div className="border rounded-lg overflow-hidden shadow-[rgba(0,0,0,0.04)_0px_2px_8px]">
                  <Table className="admin-table">
                    <TableHeader>
                      <TableRow className="bg-[#f7f9fa]">
                        <TableHead className="w-[40px] text-center">
                          <Checkbox
                            checked={selectAll}
                            onCheckedChange={toggleSelectAll}
                            aria-label="Select all jobs"
                          />
                        </TableHead>
                        <TableHead onClick={() => requestSort('jobId')} className="w-[100px] cursor-pointer hover:bg-[#f0f7ff] transition-colors duration-200">
                          <div className="flex items-center font-semibold text-xs uppercase tracking-wider text-[#333] py-4">
                            Job ID
                            {renderSortIndicator('jobId')}
                          </div>
                        </TableHead>
                        <TableHead onClick={() => requestSort('weekDays')} className="cursor-pointer hover:bg-[#f0f7ff] transition-colors duration-200">
                          <div className="flex items-center font-semibold text-xs uppercase tracking-wider text-[#333] py-4">
                            Work Days
                            {renderSortIndicator('weekDays')}
                          </div>
                        </TableHead>
                        <TableHead onClick={() => requestSort('startTime')} className="w-[220px] cursor-pointer hover:bg-[#f0f7ff] transition-colors duration-200">
                          <div className="flex items-center justify-center font-semibold text-xs uppercase tracking-wider text-[#333] py-4">
                            Start Time
                            {renderSortIndicator('startTime')}
                          </div>
                        </TableHead>
                        <TableHead onClick={() => requestSort('isAirport')} className="w-[120px] cursor-pointer hover:bg-[#f0f7ff] transition-colors duration-200">
                          <div className="flex justify-center items-center font-semibold text-xs uppercase tracking-wider text-[#333] py-4">
                            Airport Job
                            {renderSortIndicator('isAirport')}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering the column sort
                                toggleAllAirport(!areAllAirport());
                              }}
                              title={areAllAirport() ? "Deselect All" : "Select All"}
                              className="ml-1 h-6 w-6"
                            >
                              {areAllAirport() ? <Square size={14} /> : <CheckSquare size={14} />}
                            </Button>
                          </div>
                        </TableHead>
                        <TableHead className="w-[80px] font-semibold text-xs uppercase tracking-wider text-[#333] py-4">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getSortedJobs().map((job, index) => {
                        // Find the original index in jobsList for correct updates
                        const originalIndex = jobsList.findIndex(j => j.jobId === job.jobId);
                        
                        // Parse the current time into hours and minutes
                        const [hour, minute] = job.startTime.split(':');
                        
                        return (
                          <TableRow key={job.jobId} className="hover:bg-[#f0f7ff] transition-colors duration-200">
                            <TableCell className="text-center">
                              <Checkbox
                                checked={selectedJobs.includes(job.jobId)}
                                onCheckedChange={() => toggleJobSelection(job.jobId)}
                                aria-label={`Select ${job.jobId}`}
                              />
                            </TableCell>
                            <TableCell className="py-4">
                              <Input
                                value={job.jobId}
                                onChange={(e) => handleJobFieldChange(originalIndex, 'jobId', e.target.value)}
                                className="admin-input"
                              />
                            </TableCell>
                            <TableCell className="py-4">
                              <Input
                                value={job.weekDays}
                                onChange={(e) => handleJobFieldChange(originalIndex, 'weekDays', e.target.value)}
                                className="admin-input"
                              />
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center gap-2">
                                <Select 
                                  value={hour.padStart(2, '0')}
                                  onValueChange={(newHour) => handleTimeChange(originalIndex, newHour, minute.padStart(2, '0'))}
                                >
                                  <SelectTrigger className="w-[100px]">
                                    <SelectValue placeholder="Hour" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {hours.map((h) => (
                                      <SelectItem key={h} value={h}>{h}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <span className="text-lg font-medium">:</span>
                                <Select 
                                  value={minute.padStart(2, '0')}
                                  onValueChange={(newMinute) => handleTimeChange(originalIndex, hour.padStart(2, '0'), newMinute)}
                                >
                                  <SelectTrigger className="w-[100px]">
                                    <SelectValue placeholder="Minute" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {minutes.map((m) => (
                                      <SelectItem key={m} value={m}>{m}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-4">
                              <Checkbox
                                checked={job.isAirport}
                                onCheckedChange={(checked) => handleJobFieldChange(originalIndex, 'isAirport', checked === true)}
                              />
                            </TableCell>
                            <TableCell className="py-4">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteJob(job.jobId)}
                                className="hover:bg-red-50 transition-colors duration-200"
                              >
                                <Trash2 size={18} className="text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedJobs.length} job{selectedJobs.length !== 1 ? 's' : ''}? 
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteMultipleJobs}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TabsContent>
              
              <TabsContent value="master" className="mt-6">
                <div className="mb-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Master List</h3>
                    <p className="text-sm text-muted-foreground">Paste data directly from Excel with unlimited rows</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleAddGridRow} className="flex items-center gap-2">
                      <PlusCircle size={16} /> Add Row
                    </Button>
                    <Button variant="outline" onClick={() => setBulkExportDialogOpen(true)} className="flex items-center gap-2">
                      <FileText size={16} /> Export Data
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-lg overflow-hidden shadow-sm">
                  {/* Paste here area */}
                  <div className="bg-[#f9fbfc] p-4 border-b">
                    <Textarea
                      placeholder="Paste data from Excel here (format: JobID, WorkDays, StartTime)"
                      className="min-h-[100px]"
                      value={bulkJobsText}
                      onChange={(e) => setBulkJobsText(e.target.value)}
                    />
                    <div className="flex justify-end mt-2">
                      <Button onClick={handleBulkImport} className="flex items-center gap-2">
                        <Save size={16} /> Process Pasted Data
                      </Button>
                    </div>
                  </div>
                  
                  {/* Master grid list */}
                  <DataGrid 
                    columns={dataGridColumns}
                    data={gridData}
                    onDataChange={handleDataGridChange}
                    onAddRow={handleAddGridRow}
                  />
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="mt-8">
              <Button 
                variant="outline" 
                onClick={goBack}
                className="border-2 border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6]/5 rounded-md px-5 py-3 font-medium transition-all duration-200 flex items-center gap-2"
              >
                <ChevronLeft size={18} /> Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

export default EditJobsPage;