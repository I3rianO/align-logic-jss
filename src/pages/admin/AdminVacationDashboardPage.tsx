import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import useVacationStore from '@/store/vacationStore';
import useDriverStore from '@/store/driverStore';
import { FileSpreadsheet, HelpCircle, LockKeyhole, Settings, Users, ClipboardList, CheckSquare, CalendarClock, XCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function AdminVacationDashboardPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    vacationWeeks,
    preferences, 
    isCutoffActive, 
    toggleCutoff, 
    calculateVacationAssignments,
    cutoffTime,
    setCutoffTime,
    isAutoCutoffScheduled,
    scheduleAutoCutoff,
    cleanPreferences,
    getEligibleDrivers
  } = useVacationStore();
  
  const { drivers } = useDriverStore();
  
  // State for dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  // Clean preferences on component mount
  useEffect(() => {
    cleanPreferences();
  }, [cleanPreferences]);
  
  // Format cutoff time for display
  const formatCutoffDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const formatCutoffTime = (date: Date) => {
    // Using 24-hour format
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };
  
  // Set up the default date and time values when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      
      const hours = String(cutoffTime.getHours()).padStart(2, '0');
      const minutes = String(cutoffTime.getMinutes()).padStart(2, '0');
      
      setSelectedDate(`${year}-${month}-${day}`);
      setSelectedTime(`${hours}:${minutes}`);
    }
  }, [isDialogOpen, cutoffTime]);
  
  // Get vacation assignments
  const vacationAssignments = calculateVacationAssignments();
  
  // Calculate assignment stats
  const eligibleDriverIds = getEligibleDrivers();
  const eligibleDrivers = drivers.filter(d => eligibleDriverIds.includes(d.employeeId));
  
  const driversWithPreferences = eligibleDrivers.filter(
    d => preferences.some(p => p.driverId === d.employeeId)
  );

  const completionRate = eligibleDrivers.length > 0 
    ? Math.round((driversWithPreferences.length / eligibleDrivers.length) * 100) 
    : 0;

  const totalVacationSlots = vacationWeeks.reduce((sum, week) => sum + week.totalSlots, 0);
  
  // Navigation functions
  const navigateToEditWeeks = () => navigate('/admin/vacation/weeks');
  const navigateToLiveVacationPicks = () => navigate('/admin/vacation/live-picks');
  const navigateToFinalVacationAssignments = () => navigate('/admin/vacation/final-assignments');
  const navigateToAdminDashboard = () => navigate('/admin');
  const navigateToHome = () => navigate('/');

  // Toggle cutoff status
  const handleCutoffToggle = (checked: boolean) => {
    toggleCutoff(checked);
    
    toast({
      title: checked ? "Vacation Portal Closed" : "Vacation Portal Opened",
      description: checked 
        ? "Drivers can no longer submit vacation preferences."
        : "Drivers can now submit vacation preferences.",
    });
  };
  
  // Handle auto cutoff scheduling
  const handleScheduleCutoff = (checked: boolean) => {
    scheduleAutoCutoff(checked);
    
    if (!checked) {
      toast({
        title: "Auto-Close Cancelled",
        description: "The scheduled portal closure has been cancelled.",
      });
    } else if (selectedDate && selectedTime) {
      const [year, month, day] = selectedDate.split('-').map(num => parseInt(num));
      const [hours, minutes] = selectedTime.split(':').map(num => parseInt(num));
      
      const newCutoffTime = new Date(year, month - 1, day, hours, minutes);
      setCutoffTime(newCutoffTime);
      
      toast({
        title: "Auto-Close Scheduled",
        description: `The portal will automatically close on ${formatCutoffDate(newCutoffTime)} at ${formatCutoffTime(newCutoffTime)}.`,
      });
      
      setIsDialogOpen(false);
    }
  };
  
  // Cancel scheduling
  const handleCancelScheduling = () => {
    setIsDialogOpen(false);
  };
  
  // Save cutoff schedule
  const handleSaveCutoffSchedule = () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Error",
        description: "Please select both a date and time for the portal closure.",
        variant: "destructive",
      });
      return;
    }
    
    // Parse the selected date and time
    const [year, month, day] = selectedDate.split('-').map(num => parseInt(num));
    const [hours, minutes] = selectedTime.split(':').map(num => parseInt(num));
    
    // Create new date object
    const newCutoffTime = new Date(year, month - 1, day, hours, minutes);
    
    // Validate that the date is in the future
    if (newCutoffTime <= new Date()) {
      toast({
        title: "Invalid Date",
        description: "The cutoff time must be in the future.",
        variant: "destructive",
      });
      return;
    }
    
    // Update the cutoff time
    setCutoffTime(newCutoffTime);
    scheduleAutoCutoff(true);
    
    toast({
      title: "Auto-Close Scheduled",
      description: `The portal will automatically close on ${formatCutoffDate(newCutoffTime)} at ${formatCutoffTime(newCutoffTime)}.`,
    });
    
    setIsDialogOpen(false);
  };

  return (
    <MainLayout title="Vacation Admin Dashboard">
      <div className="jss-container py-8">
        {/* Navigation Tabs */}
        <div className="mb-6">
          <Tabs defaultValue="vacation" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="job" onClick={navigateToAdminDashboard}>Job Selection</TabsTrigger>
              <TabsTrigger value="vacation">Vacation Selection</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Admin Stats Summary Cards */}
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Users size={24} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Eligible Drivers</p>
                <h3 className="text-2xl font-bold">{eligibleDrivers.length}</h3>
                <p className="text-xs text-muted-foreground">
                  {driversWithPreferences.length} have made preferences
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <ClipboardList size={24} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Vacation Weeks</p>
                <h3 className="text-2xl font-bold">{vacationWeeks.length}</h3>
                <p className="text-xs text-muted-foreground">
                  {totalVacationSlots} total slots available
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <CheckSquare size={24} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Selection Completion</p>
                <h3 className="text-2xl font-bold">{completionRate}%</h3>
                <p className="text-xs text-muted-foreground">
                  {driversWithPreferences.length} of {eligibleDrivers.length} eligible drivers
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Vacation Weeks Management Card */}
          <Card>
            <CardHeader>
              <CardTitle>Vacation Weeks Management</CardTitle>
              <CardDescription>
                Add, edit, or remove available vacation weeks and set slot allocation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full mb-4"
                onClick={navigateToEditWeeks}
              >
                <CalendarClock size={18} className="mr-2" /> Manage Vacation Weeks
              </Button>
            </CardContent>
          </Card>

          {/* Live Picks Card */}
          <Card>
            <CardHeader>
              <CardTitle>Live Vacation Picks</CardTitle>
              <CardDescription>
                Monitor which drivers have submitted vacation preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full mb-4"
                onClick={navigateToLiveVacationPicks}
              >
                <Users size={18} className="mr-2" /> View Live Picks
              </Button>
            </CardContent>
          </Card>
          
          {/* Final Assignments Card */}
          <Card>
            <CardHeader>
              <CardTitle>Final Vacation Assignments</CardTitle>
              <CardDescription>
                View, edit, and export final driver vacation assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full mb-4"
                onClick={navigateToFinalVacationAssignments}
              >
                <CheckSquare size={18} className="mr-2" /> View Assignments
              </Button>
              <div className="text-sm text-muted-foreground">
                Currently {vacationAssignments.length} drivers assigned to vacation weeks
              </div>
            </CardContent>
          </Card>
          
          {/* Portal Control Card */}
          <Card>
            <CardHeader>
              <CardTitle>Vacation Portal Control</CardTitle>
              <CardDescription>
                Open, close, or schedule closure of the vacation selection portal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="cutoff-toggle">
                  {isCutoffActive ? "Portal is closed" : "Portal is open"}
                </Label>
                <Switch
                  id="cutoff-toggle"
                  checked={isCutoffActive}
                  onCheckedChange={handleCutoffToggle}
                />
              </div>
              
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-cutoff-toggle">
                    Auto-close portal
                  </Label>
                  <Switch
                    id="auto-cutoff-toggle"
                    checked={isAutoCutoffScheduled}
                    onCheckedChange={handleScheduleCutoff}
                  />
                </div>
                {isAutoCutoffScheduled && (
                  <div className="text-sm flex items-center gap-2 text-muted-foreground">
                    <CalendarClock size={16} />
                    <span>
                      Scheduled for: {formatCutoffDate(cutoffTime)} at {formatCutoffTime(cutoffTime)}
                    </span>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <CalendarClock size={16} className="mr-2" />
                  {isAutoCutoffScheduled ? "Change Schedule" : "Schedule Closure"}
                </Button>
              </div>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
              When closed, drivers cannot submit or modify their vacation preferences.
            </CardFooter>
          </Card>
        </div>
        
        <div className="mt-6 flex justify-between">
          <Button variant="outline" onClick={navigateToHome}>
            <LockKeyhole size={18} className="mr-2" /> Return to Driver View
          </Button>
        </div>
      </div>
      
      {/* Schedule Cutoff Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Portal Closure</DialogTitle>
            <DialogDescription>
              Set a date and time when the vacation portal will automatically close.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cutoff-date" className="text-right">
                Date
              </Label>
              <Input
                id="cutoff-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cutoff-time" className="text-right">
                Time
              </Label>
              <Input
                id="cutoff-time"
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelScheduling}>
              <XCircle size={16} className="mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveCutoffSchedule}>
              <CalendarClock size={16} className="mr-2" />
              Schedule Closure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

export default AdminVacationDashboardPage;