import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import useDriverStore, { Driver, Site } from '@/store/driverStore';
import { ChevronLeft, PlusCircle, Save, Trash2, CheckSquare, Square, ArrowUp, ArrowDown, FileText, Copy } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import { DataGrid, DataGridColumn } from '@/components/ui/data-grid';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

function EditDriversPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { drivers, addDriver, updateDriver, deleteDriver, getDriversByCompanySite, currentCompanyId, currentSiteId } = useDriverStore();
  
  // State for the drivers list
  const [driversList, setDriversList] = useState<Driver[]>([]);
  const [siteName, setSiteName] = useState<string>('');
  const [isAddingDriver, setIsAddingDriver] = useState<boolean>(false);
  const [newDriver, setNewDriver] = useState<Driver>({
    employeeId: '',
    name: '',
    seniorityNumber: 0,
    vcStatus: false,
    airportCertified: false,
    isEligible: true,
    passwordSet: false,
    securityQuestionsSet: false,
    companyId: currentCompanyId,
    siteId: currentSiteId,
  });

  // State for bulk edit
  const [bulkDriversText, setBulkDriversText] = useState<string>('');
  
  // Update newDriver when company/site changes
  useEffect(() => {
    setNewDriver(prev => ({
      ...prev,
      companyId: currentCompanyId,
      siteId: currentSiteId,
    }));
  }, [currentCompanyId, currentSiteId]);
  const [bulkExportDialogOpen, setBulkExportDialogOpen] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<string>('table');
  
  // State for DataGrid
  const [gridData, setGridData] = useState<any[]>([]);

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Driver;
    direction: 'ascending' | 'descending';
  }>({
    key: 'seniorityNumber', 
    direction: 'ascending'
  });

  // Multi-select state
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

  // Update driversList when drivers change in the store
  useEffect(() => {
    // Filter drivers by site
    const siteDrivers = getDriversByCompanySite(currentCompanyId, currentSiteId);
    setDriversList(siteDrivers);
    
    // Get current site name
    const site = useDriverStore.getState().getSiteById(currentSiteId);
    if (site) {
      setSiteName(site.name);
    }
    
    // Format data for the grid view
    const formattedData = siteDrivers.map((driver, index) => ({
      id: index,
      employeeId: driver.employeeId,
      name: driver.name,
      seniorityNumber: driver.seniorityNumber,
      vcStatus: driver.vcStatus,
      airportCertified: driver.airportCertified,
      isEligible: driver.isEligible
    }));
    
    setGridData(formattedData);
  }, [drivers, currentCompanyId, currentSiteId, getDriversByCompanySite]);

  // Initialize bulk text when dialog opens
  useEffect(() => {
    if (bulkExportDialogOpen) {
      // Create a tab/CSV format text from drivers
      const csvHeader = "EmployeeID\tName\tSeniorityNumber\tVCStatus\tAirportCertified\tEligible";
      const csvRows = driversList.map(driver => 
        `${driver.employeeId}\t${driver.name}\t${driver.seniorityNumber}\t${driver.vcStatus ? 'Yes' : 'No'}\t${driver.airportCertified ? 'Yes' : 'No'}\t${driver.isEligible ? 'Yes' : 'No'}`
      ).join('\n');
      
      setBulkDriversText(`${csvHeader}\n${csvRows}`);
    }
  }, [bulkExportDialogOpen, driversList]);

  // Define data grid columns
  const dataGridColumns: DataGridColumn[] = [
    {
      header: 'Employee ID',
      accessorKey: 'employeeId',
      width: 150,
      sortable: true,
      cell: ({ row, rowIndex }: any) => (
        <Input
          value={row.employeeId || ''}
          onChange={(e) => {
            // Allow only digits and limit to exactly 7 characters
            const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 7);
            handleGridCellChange(rowIndex, 'employeeId', value);
          }}
          className="w-full h-8"
          maxLength={7}
        />
      ),
    },
    {
      header: 'Name',
      accessorKey: 'name',
      width: 250,
      sortable: true,
      cell: ({ row, rowIndex }: any) => (
        <Input
          value={row.name || ''}
          onChange={(e) => handleGridCellChange(rowIndex, 'name', e.target.value)}
          className="w-full h-8"
        />
      ),
    },
    {
      header: 'Seniority #',
      accessorKey: 'seniorityNumber',
      width: 120,
      sortable: true,
      cell: ({ row, rowIndex }: any) => (
        <Input
          type="number"
          min="0"
          value={row.seniorityNumber || 0}
          onChange={(e) => {
            const value = parseInt(e.target.value) || 0;
            if (value >= 0) {
              handleGridCellChange(rowIndex, 'seniorityNumber', value);
            }
          }}
          className="w-full h-8"
        />
      ),
    }
  ];

  // Handle saving changes to drivers
  const saveChanges = () => {
    if (selectedTab === 'bulk') {
      handleBulkImport();
      return;
    }

    if (selectedTab === 'master') {
      // Convert grid data to driver format
      const driversFromGrid = gridData.map(row => ({
        employeeId: row.employeeId,
        name: row.name,
        seniorityNumber: row.seniorityNumber || 0,
        vcStatus: row.vcStatus || false,
        airportCertified: row.airportCertified || false,
        isEligible: row.isEligible || true
      }));
      
      // Validate all driver IDs are 7 digits
      const invalidDrivers = driversFromGrid.filter(driver => !/^\d{7}$/.test(driver.employeeId));
      
      if (invalidDrivers.length > 0) {
        toast({
          title: "Invalid Employee IDs",
          description: "All Employee IDs must be exactly 7 digits.",
          variant: "destructive",
        });
        return;
      }
      
      // Check for any negative seniority numbers
      const negativeSeniority = driversFromGrid.filter(driver => driver.seniorityNumber < 0);
      
      if (negativeSeniority.length > 0) {
        toast({
          title: "Invalid Seniority Numbers",
          description: "Seniority numbers cannot be negative.",
          variant: "destructive",
        });
        return;
      }
      
      // Clear existing drivers and add the new ones
      drivers.forEach(driver => {
        deleteDriver(driver.employeeId);
      });
      
      driversFromGrid.forEach(driver => {
        // Ensure each driver has the correct company and site IDs
        const driverWithSite = {
          ...driver,
          companyId: currentCompanyId,
          siteId: currentSiteId,
          passwordSet: false,
          securityQuestionsSet: false
        };
        addDriver(driverWithSite);
      });
      
      toast({
        title: "Drivers Updated",
        description: "Driver information has been successfully updated.",
        variant: "default",
      });
      return;
    }

    // Validate all driver IDs are 7 digits for table view
    const invalidDrivers = driversList.filter(driver => !/^\d{7}$/.test(driver.employeeId));
    
    if (invalidDrivers.length > 0) {
      toast({
        title: "Invalid Employee IDs",
        description: "All Employee IDs must be exactly 7 digits.",
        variant: "destructive",
      });
      return;
    }
    
    // Check for any negative seniority numbers
    const negativeSeniority = driversList.filter(driver => driver.seniorityNumber < 0);
    
    if (negativeSeniority.length > 0) {
      toast({
        title: "Invalid Seniority Numbers",
        description: "Seniority numbers cannot be negative.",
        variant: "destructive",
      });
      return;
    }
    
    // Update all drivers in the store
    driversList.forEach(driver => {
      updateDriver(driver);
    });
    
    toast({
      title: "Drivers Updated",
      description: "Driver information has been successfully updated.",
      variant: "default",
    });
  };

  // Add a new row to the grid
  const handleAddGridRow = () => {
    const newRow = {
      id: gridData.length,
      employeeId: '',
      name: '',
      seniorityNumber: 0,
      vcStatus: false,
      airportCertified: false,
      isEligible: true,
      companyId: currentCompanyId,
      siteId: currentSiteId,
      passwordSet: false,
      securityQuestionsSet: false
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
    const lines = bulkDriversText.trim().split('\n');
    
    // Skip the first line if it's a header (contains string "EmployeeID" or similar)
    const startIndex = lines[0].includes('EmployeeID') || lines[0].includes('Employee') ? 1 : 0;
    
    // Process each line
    const newDrivers: Driver[] = [];
    const errors: string[] = [];
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines
      
      // Split by tab or multiple spaces or comma
      const parts = line.split(/[\t,]|(\s{2,})/g).filter(Boolean);
      
      if (parts.length < 3) {
        errors.push(`Line ${i+1}: Not enough data (need at least Employee ID, Name, and Seniority Number)`);
        continue;
      }
      
      const employeeId = parts[0].trim();
      
      // Check Employee ID is exactly 7 digits
      if (!/^\d{7}$/.test(employeeId)) {
        errors.push(`Line ${i+1}: Employee ID must be exactly 7 digits (found ${employeeId})`);
        continue;
      }
      
      const name = parts[1].trim();
      
      // Parse seniority number
      const seniorityNumber = parseInt(parts[2]);
      if (isNaN(seniorityNumber) || seniorityNumber < 0) {
        errors.push(`Line ${i+1}: Invalid Seniority Number (must be a non-negative number)`);
        continue;
      }
      
      // Parse boolean fields if they exist
      let vcStatus = false;
      let airportCertified = false;
      let isEligible = true;
      
      if (parts.length > 3) {
        vcStatus = ['yes', 'y', 'true', '1'].includes(parts[3].trim().toLowerCase());
      }
      
      if (parts.length > 4) {
        airportCertified = ['yes', 'y', 'true', '1'].includes(parts[4].trim().toLowerCase());
      }
      
      if (parts.length > 5) {
        isEligible = !['no', 'n', 'false', '0'].includes(parts[5].trim().toLowerCase());
      }
      
      newDrivers.push({
        employeeId,
        name,
        seniorityNumber,
        vcStatus,
        airportCertified,
        isEligible,
        passwordSet: false,
        securityQuestionsSet: false,
        companyId: currentCompanyId,
        siteId: currentSiteId
      });
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
    
    // Update the drivers list with the new drivers
    setDriversList(newDrivers);
    
    // Update grid data
    const newGridData = newDrivers.map((driver, index) => ({
      id: index,
      ...driver
    }));
    setGridData(newGridData);
    
    // Update all drivers in the store
    drivers.forEach(driver => {
      deleteDriver(driver.employeeId);
    });
    
    newDrivers.forEach(driver => {
      addDriver(driver);
    });
    
    toast({
      title: "Import Successful",
      description: `Successfully imported ${newDrivers.length} drivers.`,
      variant: "default",
    });
    
    // Switch to master list view
    setSelectedTab('master');
  };

  // Handle copying bulk export text
  const handleCopyBulkText = () => {
    navigator.clipboard.writeText(bulkDriversText)
      .then(() => {
        toast({
          title: "Copied to Clipboard",
          description: "Driver data has been copied to your clipboard.",
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

  // Handle adding a new driver
  const handleAddDriver = () => {
    // Set the company and site IDs for the new driver
    const driverWithSite = {
      ...newDriver,
      companyId: currentCompanyId,
      siteId: currentSiteId
    };
    
    // Validate employee ID
    if (!/^\d{7}$/.test(driverWithSite.employeeId)) {
      toast({
        title: "Invalid Employee ID",
        description: "Employee ID must be exactly 7 digits.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if employee ID already exists
    if (driversList.some(driver => driver.employeeId === newDriver.employeeId)) {
      toast({
        title: "Duplicate Employee ID",
        description: "A driver with this Employee ID already exists.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate seniority number is not negative
    if (newDriver.seniorityNumber < 0) {
      toast({
        title: "Invalid Seniority Number",
        description: "Seniority number cannot be negative.",
        variant: "destructive",
      });
      return;
    }
    
    // Add new driver
    addDriver(driverWithSite);
    setDriversList([...driversList, driverWithSite]);
    
    // Add to grid data
    const newGridRow = {
      id: gridData.length,
      ...driverWithSite
    };
    setGridData([...gridData, newGridRow]);
    
    // Reset form
    setNewDriver({
      employeeId: '',
      name: '',
      seniorityNumber: 0,
      vcStatus: false,
      airportCertified: false,
      isEligible: true,
      passwordSet: false,
      securityQuestionsSet: false,
      companyId: currentCompanyId,
      siteId: currentSiteId,
    });
    
    setIsAddingDriver(false);
    
    toast({
      title: "Driver Added",
      description: "New driver has been successfully added.",
      variant: "default",
    });
  };

  // Handle toggling a driver's selection
  const toggleDriverSelection = (employeeId: string) => {
    setSelectedDrivers(prevSelected => {
      if (prevSelected.includes(employeeId)) {
        return prevSelected.filter(id => id !== employeeId);
      } else {
        return [...prevSelected, employeeId];
      }
    });
  };

  // Handle toggling all drivers selection
  const toggleSelectAll = () => {
    if (selectAll) {
      // If currently all selected, deselect all
      setSelectedDrivers([]);
      setSelectAll(false);
    } else {
      // If not all selected, select all
      setSelectedDrivers(driversList.map(driver => driver.employeeId));
      setSelectAll(true);
    }
  };

  // Update selectAll status when selectedDrivers changes
  useEffect(() => {
    if (driversList.length > 0) {
      setSelectAll(selectedDrivers.length === driversList.length);
    }
  }, [selectedDrivers, driversList]);

  // Handle deleting multiple drivers
  const handleDeleteMultipleDrivers = () => {
    // Close the confirmation dialog
    setIsDeleteDialogOpen(false);
    
    // Delete all selected drivers
    selectedDrivers.forEach(employeeId => {
      deleteDriver(employeeId);
    });
    
    // Update the drivers list
    setDriversList(driversList.filter(driver => !selectedDrivers.includes(driver.employeeId)));
    
    // Update grid data
    setGridData(gridData.filter(row => !selectedDrivers.includes(row.employeeId)));
    
    // Clear selected drivers
    setSelectedDrivers([]);
    setSelectAll(false);
    
    toast({
      title: "Drivers Removed",
      description: `Successfully removed ${selectedDrivers.length} drivers.`,
      variant: "default",
    });
  };

  // Handle deleting a single driver
  const handleDeleteDriver = (employeeId: string) => {
    deleteDriver(employeeId);
    setDriversList(driversList.filter(driver => driver.employeeId !== employeeId));
    
    // Update grid data
    setGridData(gridData.filter(row => row.employeeId !== employeeId));
    
    toast({
      title: "Driver Removed",
      description: "Driver has been successfully removed.",
      variant: "default",
    });
  };

  // Handle updating a driver field
  const handleDriverFieldChange = (index: number, field: keyof Driver, value: any) => {
    const updatedDrivers = [...driversList];
    
    // Handle special validation for seniority number
    if (field === 'seniorityNumber') {
      const numValue = parseInt(value) || 0;
      // Don't allow negative seniority numbers
      if (numValue < 0) {
        return;
      }
      
      updatedDrivers[index][field] = numValue;
    } else if (field === 'employeeId') {
      // Allow only digits for employee ID and enforce exactly 7 digits
      const digitsOnly = value.replace(/\D/g, '').slice(0, 7);
      updatedDrivers[index][field] = digitsOnly;
    } else {
      // @ts-ignore - This is a safe operation as we're controlling the field names
      updatedDrivers[index][field] = value;
    }
    
    setDriversList(updatedDrivers);
  };

  // Go back to admin dashboard
  const goBack = () => {
    navigate('/admin');
  };
  
  // Select/deselect all for a specific field
  const toggleAll = (field: keyof Pick<Driver, 'vcStatus' | 'airportCertified' | 'isEligible'>, value: boolean) => {
    const updatedDrivers = driversList.map(driver => ({
      ...driver,
      [field]: value
    }));
    
    setDriversList(updatedDrivers);
    
    toast({
      title: value ? `All ${field} Selected` : `All ${field} Deselected`,
      description: `Successfully ${value ? 'selected' : 'deselected'} all drivers.`,
    });
  };
  
  // Check if all values for a field are the same
  const areAllSelected = (field: keyof Pick<Driver, 'vcStatus' | 'airportCertified' | 'isEligible'>) => {
    return driversList.length > 0 && driversList.every(driver => driver[field] === true);
  };

  // Sort table functionality
  const requestSort = (key: keyof Driver) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
  };

  // Get sorted driver list
  const getSortedDrivers = () => {
    return [...driversList].sort((a, b) => {
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

      // For other types (like numbers), compare directly
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
  const renderSortIndicator = (key: keyof Driver) => {
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
    <MainLayout title={`Edit Drivers - ${siteName}`}>
      <div className="jss-container py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between bg-[#f7f9fa] py-6 px-8 border-b">
            <CardTitle className="text-2xl font-bold tracking-wide">Driver Management - {siteName}</CardTitle>
            <div className="flex gap-3">
              <Button 
                onClick={saveChanges}
                className="bg-[#3b82f6] text-white hover:bg-[#3b82f6]/90 rounded-md px-5 py-2.5 font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <Save size={18} className="mr-2" /> Save Changes
              </Button>
              <Dialog open={isAddingDriver} onOpenChange={setIsAddingDriver}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-[#3b82f6] text-white hover:bg-[#3b82f6]/90 rounded-md px-5 py-2.5 font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
                  >
                    <PlusCircle size={18} className="mr-2" /> Add Driver
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white rounded-lg border shadow-[rgba(0,0,0,0.04)_0px_2px_8px]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Add New Driver</DialogTitle>
                    <DialogDescription className="text-[#333] text-base">
                      Enter the details for the new driver below.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                      <label htmlFor="employeeId" className="text-sm font-medium">
                        Employee ID (7 digits)
                      </label>
                      <Input
                        id="employeeId"
                        placeholder="e.g. 0123456 or 1234567"
                        value={newDriver.employeeId}
                        onChange={(e) => setNewDriver({...newDriver, employeeId: e.target.value.replace(/[^0-9]/g, '').slice(0, 7)})}
                        maxLength={7}
                        inputMode="numeric"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        Name
                      </label>
                      <Input
                        id="name"
                        placeholder="Full Name"
                        value={newDriver.name}
                        onChange={(e) => setNewDriver({...newDriver, name: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <label htmlFor="seniorityNumber" className="text-sm font-medium">
                        Seniority Number (lower = higher seniority, must be unique)
                      </label>
                      <Input
                        id="seniorityNumber"
                        type="number"
                        min="0"
                        placeholder="e.g. 1"
                        value={newDriver.seniorityNumber || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          if (value >= 0) {
                            setNewDriver({...newDriver, seniorityNumber: value});
                          }
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="vcStatus"
                          checked={newDriver.vcStatus}
                          onCheckedChange={(checked) => setNewDriver({...newDriver, vcStatus: checked === true})}
                        />
                        <label htmlFor="vcStatus" className="text-sm font-medium">
                          VC Status
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="airportCertified"
                          checked={newDriver.airportCertified}
                          onCheckedChange={(checked) => setNewDriver({...newDriver, airportCertified: checked === true})}
                        />
                        <label htmlFor="airportCertified" className="text-sm font-medium">
                          Airport Certified
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isEligible"
                          checked={newDriver.isEligible}
                          onCheckedChange={(checked) => setNewDriver({...newDriver, isEligible: checked === true})}
                        />
                        <label htmlFor="isEligible" className="text-sm font-medium">
                          Eligible
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddingDriver(false)}
                      className="border border-[#3b82f6] text-[#3b82f6] hover:bg-[#93c5fd]/20 rounded-md px-5 py-2.5 font-medium transition-all duration-200"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddDriver}
                      className="bg-[#3b82f6] text-white hover:bg-[#3b82f6]/90 rounded-md px-5 py-2.5 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                      disabled={newDriver.employeeId.length !== 7}
                    >
                      Add Driver
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              {/* Bulk Export Dialog */}
              <Dialog open={bulkExportDialogOpen} onOpenChange={setBulkExportDialogOpen}>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Export Driver Data</DialogTitle>
                    <DialogDescription>
                      Copy this data to use in spreadsheets or to save as a backup
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="py-4">
                    <Textarea
                      className="font-mono text-sm h-[400px]"
                      value={bulkDriversText}
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
                    {selectedDrivers.length > 0 && (
                      <Button 
                        variant="destructive" 
                        onClick={() => setIsDeleteDialogOpen(true)} 
                        className="flex items-center gap-2"
                      >
                        <Trash2 size={16} /> Delete Selected ({selectedDrivers.length})
                      </Button>
                    )}
                  </div>
                  <Button variant="outline" onClick={() => setBulkExportDialogOpen(true)}>
                    <FileText size={16} className="mr-2" /> Export Data
                  </Button>
                </div>
              
                <div className="border rounded-lg overflow-hidden shadow-[rgba(0,0,0,0.04)_0px_2px_8px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#f7f9fa]">
                        <TableHead className="w-[40px] text-center">
                          <Checkbox
                            checked={selectAll}
                            onCheckedChange={toggleSelectAll}
                            aria-label="Select all drivers"
                          />
                        </TableHead>
                        <TableHead onClick={() => requestSort('employeeId')} className="w-[100px] cursor-pointer hover:bg-[#f0f7ff] transition-colors duration-200">
                          <div className="flex items-center font-semibold text-xs uppercase tracking-wider text-[#333] py-4">
                            Employee ID
                            {renderSortIndicator('employeeId')}
                          </div>
                        </TableHead>
                        <TableHead onClick={() => requestSort('name')} className="cursor-pointer hover:bg-[#f0f7ff] transition-colors duration-200">
                          <div className="flex items-center font-semibold text-xs uppercase tracking-wider text-[#333] py-4">
                            Name
                            {renderSortIndicator('name')}
                          </div>
                        </TableHead>
                        <TableHead onClick={() => requestSort('seniorityNumber')} className="w-[100px] cursor-pointer hover:bg-[#f0f7ff] transition-colors duration-200">
                          <div className="flex items-center font-semibold text-xs uppercase tracking-wider text-[#333] py-4">
                            Seniority #
                            {renderSortIndicator('seniorityNumber')}
                          </div>
                        </TableHead>
                        <TableHead onClick={() => requestSort('vcStatus')} className="w-[100px] cursor-pointer hover:bg-[#f0f7ff] transition-colors duration-200">
                          <div className="flex justify-center items-center font-semibold text-xs uppercase tracking-wider text-[#333] py-4">
                            VC Status
                            {renderSortIndicator('vcStatus')}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering the column sort
                                toggleAll('vcStatus', !areAllSelected('vcStatus'));
                              }}
                              title={areAllSelected('vcStatus') ? "Deselect All" : "Select All"}
                              className="ml-1 h-6 w-6"
                            >
                              {areAllSelected('vcStatus') ? <Square size={14} /> : <CheckSquare size={14} />}
                            </Button>
                          </div>
                        </TableHead>
                        <TableHead onClick={() => requestSort('airportCertified')} className="w-[100px] cursor-pointer hover:bg-[#f0f7ff] transition-colors duration-200">
                          <div className="flex justify-center items-center font-semibold text-xs uppercase tracking-wider text-[#333] py-4">
                            Airport
                            {renderSortIndicator('airportCertified')}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering the column sort
                                toggleAll('airportCertified', !areAllSelected('airportCertified'));
                              }}
                              title={areAllSelected('airportCertified') ? "Deselect All" : "Select All"}
                              className="ml-1 h-6 w-6"
                            >
                              {areAllSelected('airportCertified') ? <Square size={14} /> : <CheckSquare size={14} />}
                            </Button>
                          </div>
                        </TableHead>
                        <TableHead onClick={() => requestSort('isEligible')} className="w-[100px] cursor-pointer hover:bg-[#f0f7ff] transition-colors duration-200">
                          <div className="flex justify-center items-center font-semibold text-xs uppercase tracking-wider text-[#333] py-4">
                            Job Eligible
                            {renderSortIndicator('isEligible')}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering the column sort
                                toggleAll('isEligible', !areAllSelected('isEligible'));
                              }}
                              title={areAllSelected('isEligible') ? "Deselect All" : "Select All"}
                              className="ml-1 h-6 w-6"
                            >
                              {areAllSelected('isEligible') ? <Square size={14} /> : <CheckSquare size={14} />}
                            </Button>
                          </div>
                        </TableHead>
                        <TableHead className="w-[80px] font-semibold text-xs uppercase tracking-wider text-[#333] py-4">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getSortedDrivers().map((driver, index) => {
                        // Find the original index in driversList for correct updates
                        const originalIndex = driversList.findIndex(d => d.employeeId === driver.employeeId);
                        
                        return (
                          <TableRow key={driver.employeeId} className="hover:bg-[#f0f7ff] transition-colors duration-200">
                            <TableCell className="text-center">
                              <Checkbox
                                checked={selectedDrivers.includes(driver.employeeId)}
                                onCheckedChange={() => toggleDriverSelection(driver.employeeId)}
                                aria-label={`Select ${driver.name}`}
                              />
                            </TableCell>
                            <TableCell className="py-4">
                              <Input
                                value={driver.employeeId}
                                onChange={(e) => {
                                  // Allow only digits and limit to exactly 7 characters
                                  const digitsOnly = e.target.value.replace(/[^0-9]/g, '').slice(0, 7);
                                  handleDriverFieldChange(originalIndex, 'employeeId', digitsOnly);
                                }}
                                className="admin-input"
                                maxLength={7}
                                inputMode="numeric"
                              />
                            </TableCell>
                            <TableCell className="py-4">
                              <Input
                                value={driver.name}
                                onChange={(e) => handleDriverFieldChange(originalIndex, 'name', e.target.value)}
                                className="admin-input"
                              />
                            </TableCell>
                            <TableCell className="py-4">
                              <Input
                                type="number"
                                min="0"
                                value={driver.seniorityNumber}
                                onChange={(e) => handleDriverFieldChange(originalIndex, 'seniorityNumber', parseInt(e.target.value) || 0)}
                                className="admin-input"
                              />
                            </TableCell>
                            <TableCell className="text-center py-4">
                              <Checkbox
                                checked={driver.vcStatus}
                                onCheckedChange={(checked) => handleDriverFieldChange(originalIndex, 'vcStatus', checked === true)}
                              />
                            </TableCell>
                            <TableCell className="text-center py-4">
                              <Checkbox
                                checked={driver.airportCertified}
                                onCheckedChange={(checked) => handleDriverFieldChange(originalIndex, 'airportCertified', checked === true)}
                              />
                            </TableCell>
                            <TableCell className="text-center py-4">
                              <Checkbox
                                checked={driver.isEligible}
                                onCheckedChange={(checked) => handleDriverFieldChange(originalIndex, 'isEligible', checked === true)}
                              />
                            </TableCell>
                            <TableCell className="py-4">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteDriver(driver.employeeId)}
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
                        Are you sure you want to delete {selectedDrivers.length} driver{selectedDrivers.length !== 1 ? 's' : ''}? 
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteMultipleDrivers}
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
                      placeholder="Paste data from Excel here (format: EmployeeID, Name, Seniority)"
                      className="min-h-[100px]"
                      value={bulkDriversText}
                      onChange={(e) => setBulkDriversText(e.target.value)}
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
                <ChevronLeft size={18} className="mr-2" /> Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

export default EditDriversPage;