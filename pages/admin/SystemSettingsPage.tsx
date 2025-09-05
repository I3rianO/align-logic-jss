import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Settings, 
  ChevronLeft, 
  Key, 
  Calendar, 
  Clock, 
  LockKeyhole, 
  Check,
  ShieldCheck,
  FileText,
  Save,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import useDriverStore from "@/store/driverStore";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function SystemSettingsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    systemSettings, 
    updateSystemSettings, 
    validateAdminCredentials, 
    setAdminPassword 
  } = useDriverStore();

  // Portal access states
  const [isPortalOpen, setIsPortalOpen] = useState(true);
  const [allowDriverPrinting, setAllowDriverPrinting] = useState(systemSettings.allowDriverPrinting);
  
  // Scheduled closure states
  const [scheduledClosureEnabled, setScheduledClosureEnabled] = useState(false);
  const [scheduledClosureDate, setScheduledClosureDate] = useState("");
  const [scheduledClosureTime, setScheduledClosureTime] = useState("");
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  
  // Dialog states
  const [isClosureDialogOpen, setIsClosureDialogOpen] = useState(false);

  useEffect(() => {
    // Check if admin is logged in
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    
    if (!isLoggedIn) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access system settings",
        variant: "destructive",
      });
      navigate('/admin-portal');
    }
    
    // Initialize states from store
    setAllowDriverPrinting(systemSettings.allowDriverPrinting);
    
    // Set default scheduled date and time (tomorrow at current time)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateString = tomorrow.toISOString().split('T')[0];
    setScheduledClosureDate(dateString);
    
    // Format current time HH:MM
    const hours = String(tomorrow.getHours()).padStart(2, '0');
    const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
    setScheduledClosureTime(`${hours}:${minutes}`);
    
  }, [systemSettings, toast, navigate]);

  // Handler for changing admin password
  const handlePasswordChange = () => {
    // Reset error
    setPasswordError("");
    
    // Get current site information
    const adminSiteId = localStorage.getItem('adminSiteId');
    const adminCompanyId = localStorage.getItem('adminCompanyId');
    
    if (!adminSiteId || !adminCompanyId) {
      setPasswordError("Admin session information is missing. Please log in again.");
      return;
    }
    
    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }
    
    // Verify current password is correct - will check specifically for this site
    const isCurrentPasswordValid = validateAdminCredentials("admin", currentPassword);
    if (!isCurrentPasswordValid) {
      setPasswordError("Current password is incorrect");
      return;
    }
    
    // Change password - the setAdminPassword function will use the site ID from localStorage
    const success = setAdminPassword("admin", currentPassword, newPassword);
    
    if (success) {
      toast({
        title: "Password Changed",
        description: `Admin password has been updated successfully for ${adminCompanyId} > ${adminSiteId}`,
      });
      
      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPasswordError("Failed to update password. Please try again.");
    }
  };

  // Handler for toggling driver printing
  const handleTogglePrinting = () => {
    const newValue = !allowDriverPrinting;
    setAllowDriverPrinting(newValue);
    updateSystemSettings({ allowDriverPrinting: newValue });
    
    toast({
      title: newValue ? "Printing Enabled" : "Printing Disabled",
      description: newValue 
        ? "Drivers can now print their job selections" 
        : "Drivers can no longer print their job selections",
    });
  };

  // Handler for manual portal closure
  const handleManualClosure = (close: boolean) => {
    setIsPortalOpen(!close);
    
    // In a real implementation, this would update the server state
    // For now, just show a toast to simulate the action
    toast({
      title: close ? "Portal Closed" : "Portal Opened",
      description: close 
        ? "The driver portal has been manually closed" 
        : "The driver portal has been reopened",
    });
    
    setIsClosureDialogOpen(false);
  };

  // Handler for scheduled portal closure
  const handleScheduleClosure = () => {
    if (!scheduledClosureDate || !scheduledClosureTime) {
      toast({
        title: "Invalid Schedule",
        description: "Please set both date and time for scheduled closure",
        variant: "destructive",
      });
      return;
    }
    
    const scheduledDateTime = new Date(`${scheduledClosureDate}T${scheduledClosureTime}`);
    const now = new Date();
    
    if (scheduledDateTime <= now) {
      toast({
        title: "Invalid Schedule",
        description: "Scheduled closure must be in the future",
        variant: "destructive",
      });
      return;
    }
    
    setScheduledClosureEnabled(true);
    
    // Format for user-friendly display
    const formattedDateTime = scheduledDateTime.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    toast({
      title: "Closure Scheduled",
      description: `Portal will automatically close on ${formattedDateTime}`,
    });
  };

  // Handler for canceling scheduled closure
  const handleCancelSchedule = () => {
    setScheduledClosureEnabled(false);
    
    toast({
      title: "Schedule Canceled",
      description: "Scheduled portal closure has been canceled",
    });
  };

  return (
    <div className="bg-gradient-to-b from-slate-100 to-white min-h-screen">
      <div className="container px-4 py-8">
        {/* Header with back button */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/admin-dashboard")}
              className="mr-2 text-slate-600 hover:text-slate-900"
              size="sm"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Button>
          </div>
        </div>
        
        <div className="flex items-center mb-8">
          <div className="p-3 rounded-lg bg-indigo-100 mr-4">
            <Settings className="h-8 w-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">System Settings</h1>
            <p className="text-slate-500">Configure system-wide settings and controls</p>
          </div>
        </div>
        
        {/* Settings Tabs */}
        <Tabs defaultValue="portal-access" className="mb-8">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="portal-access" className="text-sm">
              <LockKeyhole className="h-4 w-4 mr-2" /> 
              Portal Access
            </TabsTrigger>
            <TabsTrigger value="scheduled-closure" className="text-sm">
              <Calendar className="h-4 w-4 mr-2" /> 
              Scheduled Closure
            </TabsTrigger>
            <TabsTrigger value="admin-password" className="text-sm">
              <Key className="h-4 w-4 mr-2" /> 
              Admin Password
            </TabsTrigger>
          </TabsList>

          {/* Portal Access Tab */}
          <TabsContent value="portal-access">
            <div className="grid gap-6">
              <Card>
                <CardHeader className="bg-gradient-to-b from-slate-50 to-white border-b">
                  <CardTitle className="flex items-center text-slate-900">
                    <LockKeyhole className="h-5 w-5 mr-2 text-indigo-600" />
                    Portal Access Control
                  </CardTitle>
                  <CardDescription>
                    Control driver access to the job selection portal
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {/* Manual Portal Closure */}
                    <div className="bg-white p-5 border rounded-lg space-y-4">
                      <h3 className="text-lg font-medium flex items-center">
                        <LockKeyhole className="h-5 w-5 mr-2 text-slate-600" />
                        Manual Portal Access Control
                      </h3>
                      <p className="text-slate-600">
                        Manually control whether drivers can access the job selection portal.
                      </p>
                      
                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <div className="font-medium">Portal Status</div>
                          <div className="text-sm text-slate-500">
                            {isPortalOpen ? "Portal is currently open" : "Portal is currently closed"}
                          </div>
                        </div>
                        <div className="flex gap-3">
                          {isPortalOpen ? (
                            <Button 
                              variant="destructive" 
                              onClick={() => setIsClosureDialogOpen(true)}
                            >
                              Close Portal
                            </Button>
                          ) : (
                            <Button 
                              variant="default" 
                              className="bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => handleManualClosure(false)}
                            >
                              Open Portal
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Driver Printing Control */}
                    <div className="bg-white p-5 border rounded-lg space-y-4">
                      <h3 className="text-lg font-medium flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-slate-600" />
                        Driver Printing Control
                      </h3>
                      <p className="text-slate-600">
                        Control whether drivers can print their job selections.
                      </p>
                      
                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <div className="font-medium">Allow Drivers to Print</div>
                          <div className="text-sm text-slate-500">
                            {allowDriverPrinting ? "Printing is enabled" : "Printing is disabled"}
                          </div>
                        </div>
                        <Switch 
                          checked={allowDriverPrinting}
                          onCheckedChange={handleTogglePrinting}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Scheduled Closure Tab */}
          <TabsContent value="scheduled-closure">
            <div className="grid gap-6">
              <Card>
                <CardHeader className="bg-gradient-to-b from-slate-50 to-white border-b">
                  <CardTitle className="flex items-center text-slate-900">
                    <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
                    Scheduled Portal Closure
                  </CardTitle>
                  <CardDescription>
                    Set a time for the portal to automatically close
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {scheduledClosureEnabled ? (
                    <div className="space-y-6">
                      <Alert className="bg-emerald-50 border-emerald-200">
                        <Check className="h-4 w-4 text-emerald-600" />
                        <AlertTitle className="text-emerald-800">Closure Scheduled</AlertTitle>
                        <AlertDescription className="text-emerald-700">
                          The portal is scheduled to close automatically on {new Date(`${scheduledClosureDate}T${scheduledClosureTime}`).toLocaleString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}.
                        </AlertDescription>
                      </Alert>
                      
                      <Button 
                        variant="outline" 
                        className="w-full border-rose-200 text-rose-600 hover:bg-rose-50"
                        onClick={handleCancelSchedule}
                      >
                        Cancel Scheduled Closure
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid gap-4">
                        <div>
                          <Label htmlFor="closure-date">Closure Date</Label>
                          <Input 
                            id="closure-date" 
                            type="date" 
                            value={scheduledClosureDate}
                            onChange={(e) => setScheduledClosureDate(e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="closure-time">Closure Time</Label>
                          <Input 
                            id="closure-time" 
                            type="time" 
                            value={scheduledClosureTime}
                            onChange={(e) => setScheduledClosureTime(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full"
                        onClick={handleScheduleClosure}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        Schedule Portal Closure
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Admin Password Tab */}
          <TabsContent value="admin-password">
            <div className="grid gap-6">
              <Card>
                <CardHeader className="bg-gradient-to-b from-slate-50 to-white border-b">
                  <CardTitle className="flex items-center text-slate-900">
                    <ShieldCheck className="h-5 w-5 mr-2 text-indigo-600" />
                    Admin Password Management
                  </CardTitle>
                  <CardDescription>
                    Change the administrator account password
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {passwordError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                          {passwordError}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div>
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input 
                        id="current-password" 
                        type="password"
                        placeholder="Enter current password" 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="new-password">New Password</Label>
                      <Input 
                        id="new-password" 
                        type="password"
                        placeholder="Enter new password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input 
                        id="confirm-password" 
                        type="password"
                        placeholder="Confirm new password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-slate-50">
                  <Button 
                    className="w-full"
                    onClick={handlePasswordChange}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Change Password
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Security Reminder Card */}
        <Card className="bg-blue-50 border-blue-200 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <ShieldCheck className="h-5 w-5 mr-2 text-blue-600" />
              Security Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-blue-700">
              <li className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Change your admin password regularly to maintain security</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Close the portal after job selection periods end</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Use scheduled closure to ensure on-time cutoffs</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 mr-2 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Control printing abilities based on company policy</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Portal Closure Confirmation Dialog */}
      <Dialog open={isClosureDialogOpen} onOpenChange={setIsClosureDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Driver Portal?</DialogTitle>
            <DialogDescription>
              This action will prevent drivers from accessing the job selection portal until you reopen it.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Drivers will be unable to submit or modify their job preferences while the portal is closed.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsClosureDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => handleManualClosure(true)}>
              Close Portal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}