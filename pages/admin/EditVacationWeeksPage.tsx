import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Plus, Save, Pencil, Trash2, ArrowLeft, ArrowUpDown, Check, X } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import useDriverStore from '@/store/driverStore';
import useVacationStore, { VacationWeek } from '@/store/vacationStore';
import { format } from 'date-fns';

function EditVacationWeeksPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdminAuthenticated, logAdminActivity } = useDriverStore();
  const { 
    vacationWeeks, 
    addVacationWeek, 
    updateVacationWeek, 
    deleteVacationWeek 
  } = useVacationStore();
  
  // Authentication check
  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate('/admin-portal');
    } else {
      // Log activity
      logAdminActivity('view', 'Accessed vacation weeks management page');
    }
  }, [isAdminAuthenticated, navigate, logAdminActivity]);
  
  // State for vacation week management
  const [sortConfig, setSortConfig] = useState<{key: keyof VacationWeek | ''; direction: 'asc' | 'desc'}>({ key: '', direction: 'asc' });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentWeek, setCurrentWeek] = useState<VacationWeek | null>(null);
  const [formData, setFormData] = useState<{
    weekId: string;
    startDate: string;
    endDate: string;
    totalSlots: number;
  }>({
    weekId: '',
    startDate: '',
    endDate: '',
    totalSlots: 5
  });
  
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
  const filteredWeeks = [...vacationWeeks]
    .filter(week => 
      week.weekId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      week.startDate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      week.endDate.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortConfig.key) {
        // Default sort by start date
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      }
      
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'totalSlots' ? parseInt(value) || 0 : value
    });
  };
  
  // Open add vacation week dialog
  const openAddDialog = () => {
    setFormData({
      weekId: `W${(vacationWeeks.length + 1).toString().padStart(3, '0')}`,
      startDate: '',
      endDate: '',
      totalSlots: 5
    });
    setIsAddDialogOpen(true);
  };
  
  // Open edit vacation week dialog
  const openEditDialog = (week: VacationWeek) => {
    setCurrentWeek(week);
    setFormData({
      weekId: week.weekId,
      startDate: week.startDate,
      endDate: week.endDate,
      totalSlots: week.totalSlots
    });
    setIsEditDialogOpen(true);
  };
  
  // Open delete vacation week dialog
  const openDeleteDialog = (week: VacationWeek) => {
    setCurrentWeek(week);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle add vacation week
  const handleAddWeek = () => {
    if (!formData.weekId || !formData.startDate || !formData.endDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    // Check if week ID already exists
    if (vacationWeeks.some(week => week.weekId === formData.weekId)) {
      toast({
        title: "Duplicate Week ID",
        description: `Week ID "${formData.weekId}" already exists`,
        variant: "destructive"
      });
      return;
    }
    
    // Add the new week
    const newWeek: VacationWeek = {
      ...formData,
      remainingSlots: formData.totalSlots
    };
    
    addVacationWeek(newWeek);
    
    toast({
      title: "Vacation Week Added",
      description: `Successfully added week ${formData.weekId}`,
    });
    
    logAdminActivity('create', `Added vacation week ${formData.weekId}`);
    
    setIsAddDialogOpen(false);
  };
  
  // Handle edit vacation week
  const handleEditWeek = () => {
    if (!currentWeek || !formData.weekId || !formData.startDate || !formData.endDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    // Check if week ID already exists (but not the current week)
    if (formData.weekId !== currentWeek.weekId && 
        vacationWeeks.some(week => week.weekId === formData.weekId)) {
      toast({
        title: "Duplicate Week ID",
        description: `Week ID "${formData.weekId}" already exists`,
        variant: "destructive"
      });
      return;
    }
    
    // Calculate new remaining slots
    const usedSlots = currentWeek.totalSlots - currentWeek.remainingSlots;
    const newRemainingSlots = Math.max(0, formData.totalSlots - usedSlots);
    
    // Update the week
    const updatedWeek: VacationWeek = {
      ...formData,
      remainingSlots: newRemainingSlots
    };
    
    updateVacationWeek(updatedWeek);
    
    toast({
      title: "Vacation Week Updated",
      description: `Successfully updated week ${formData.weekId}`,
    });
    
    logAdminActivity('update', `Updated vacation week ${formData.weekId}`);
    
    setIsEditDialogOpen(false);
  };
  
  // Handle delete vacation week
  const handleDeleteWeek = () => {
    if (!currentWeek) return;
    
    deleteVacationWeek(currentWeek.weekId);
    
    toast({
      title: "Vacation Week Deleted",
      description: `Successfully deleted week ${currentWeek.weekId}`,
    });
    
    logAdminActivity('delete', `Deleted vacation week ${currentWeek.weekId}`);
    
    setIsDeleteDialogOpen(false);
  };
  
  return (
    <MainLayout title="Edit Vacation Weeks">
      <div className="container max-w-6xl py-6">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate('/admin-dashboard')}
        >
          <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Vacation Weeks Management</CardTitle>
            <CardDescription>
              Create and manage vacation weeks that drivers can select for their preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="relative w-[300px]">
                <Input 
                  placeholder="Search vacation weeks..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
                <div className="absolute left-2 top-2 text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                </div>
              </div>
              <Button onClick={openAddDialog}>
                <Plus size={16} className="mr-1" /> Add Vacation Week
              </Button>
            </div>
            
            <div className="border rounded-md">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th 
                      className="font-semibold text-left p-3 text-sm cursor-pointer"
                      onClick={() => handleSort('weekId')}
                    >
                      <div className="flex items-center">
                        Week ID
                        <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />
                      </div>
                    </th>
                    <th 
                      className="font-semibold text-left p-3 text-sm cursor-pointer"
                      onClick={() => handleSort('startDate')}
                    >
                      <div className="flex items-center">
                        Start Date
                        <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />
                      </div>
                    </th>
                    <th 
                      className="font-semibold text-left p-3 text-sm cursor-pointer"
                      onClick={() => handleSort('endDate')}
                    >
                      <div className="flex items-center">
                        End Date
                        <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />
                      </div>
                    </th>
                    <th 
                      className="font-semibold text-left p-3 text-sm cursor-pointer"
                      onClick={() => handleSort('totalSlots')}
                    >
                      <div className="flex items-center">
                        Total Slots
                        <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />
                      </div>
                    </th>
                    <th 
                      className="font-semibold text-left p-3 text-sm cursor-pointer"
                      onClick={() => handleSort('remainingSlots')}
                    >
                      <div className="flex items-center">
                        Remaining
                        <ArrowUpDown size={14} className="ml-1 text-muted-foreground" />
                      </div>
                    </th>
                    <th className="font-semibold text-right p-3 text-sm">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWeeks.length > 0 ? (
                    filteredWeeks.map((week) => (
                      <tr key={week.weekId} className="border-t hover:bg-muted/30">
                        <td className="p-3 text-sm">{week.weekId}</td>
                        <td className="p-3 text-sm">{week.startDate}</td>
                        <td className="p-3 text-sm">{week.endDate}</td>
                        <td className="p-3 text-sm">{week.totalSlots}</td>
                        <td className="p-3 text-sm">{week.remainingSlots}</td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(week)}
                            >
                              <Pencil size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => openDeleteDialog(week)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-muted-foreground">
                        No vacation weeks found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        
        {/* Add Vacation Week Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Vacation Week</DialogTitle>
              <DialogDescription>
                Create a new vacation week for drivers to select.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="weekId">Week ID</Label>
                <Input
                  id="weekId"
                  name="weekId"
                  value={formData.weekId}
                  onChange={handleInputChange}
                  placeholder="e.g., W001"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="totalSlots">Total Slots</Label>
                <Input
                  id="totalSlots"
                  name="totalSlots"
                  type="number"
                  min="1"
                  value={formData.totalSlots}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddWeek}>
                <Save size={16} className="mr-1" /> Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Edit Vacation Week Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Vacation Week</DialogTitle>
              <DialogDescription>
                Update the details of this vacation week.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-weekId">Week ID</Label>
                <Input
                  id="edit-weekId"
                  name="weekId"
                  value={formData.weekId}
                  onChange={handleInputChange}
                  placeholder="e.g., W001"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-startDate">Start Date</Label>
                <Input
                  id="edit-startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-endDate">End Date</Label>
                <Input
                  id="edit-endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-totalSlots">Total Slots</Label>
                <Input
                  id="edit-totalSlots"
                  name="totalSlots"
                  type="number"
                  min="1"
                  value={formData.totalSlots}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditWeek}>
                <Save size={16} className="mr-1" /> Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Delete Vacation Week Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Vacation Week</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this vacation week? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {currentWeek && (
              <div className="border rounded-md p-4 mb-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-medium">Week ID:</div>
                  <div>{currentWeek.weekId}</div>
                  <div className="font-medium">Date Range:</div>
                  <div>{currentWeek.startDate} to {currentWeek.endDate}</div>
                  <div className="font-medium">Slots:</div>
                  <div>
                    {currentWeek.remainingSlots} of {currentWeek.totalSlots} remaining
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteWeek}>
                <Trash2 size={16} className="mr-1" /> Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

export default EditVacationWeeksPage;