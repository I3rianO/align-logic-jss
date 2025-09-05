import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import useDriverStore from '@/store/driverStore';
import { findSiteByEmployeeId } from '@/utils/employeeRouting';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Briefcase, CircleHelp, ArrowRight, Loader2, Shield, Clock, Mountain, Users, Building2, Phone, Mail, Info, Home } from 'lucide-react';
import JssLogo from '@/components/logo/JssLogo';

function HomePage() {
  const [employeeId, setEmployeeId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { drivers, jobs, cutoffTime, systemSettings } = useDriverStore();
  const { kioskMode } = systemSettings;

  // Apply kiosk mode on mount
  useEffect(() => {
    if (kioskMode) {
      applyKioskMode();
    }

    return () => {
      // Cleanup kiosk mode when component unmounts
      if (kioskMode) {
        removeKioskMode();
      }
    };
  }, [kioskMode]);

  // Function to apply kiosk mode restrictions
  const applyKioskMode = () => {
    // Add a fullscreen request
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => {
        console.log('Error attempting to enable fullscreen mode:', err);
      });
    }

    // Add a class to the body to indicate kiosk mode is active
    document.body.classList.add('kiosk-mode');

    // Add a style element with CSS to hide browser UI and prevent common keyboard shortcuts
    const style = document.createElement('style');
    style.id = 'kiosk-mode-styles';
    style.innerHTML = `
      /* Hide context menu */
      html.kiosk-mode {
        overflow: hidden;
        user-select: none;
      }
      .kiosk-mode-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 999999;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);

    // Create overlay div to catch certain events
    const overlay = document.createElement('div');
    overlay.className = 'kiosk-mode-overlay';
    overlay.id = 'kiosk-mode-overlay';
    document.body.appendChild(overlay);

    // Prevent context menu
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // Prevent keyboard shortcuts
    const handleKeyDown = (e) => {
      // Prevent keyboard shortcuts like Alt+F4, Ctrl+W, Alt+Tab, etc.
      if (
        // Alt+F4
        (e.altKey && e.key === 'F4') ||
        // Ctrl+W
        (e.ctrlKey && e.key === 'w') ||
        // Alt+Tab
        (e.altKey && e.key === 'Tab') ||
        // Windows key
        e.key === 'Meta' ||
        // Alt+Left/Right arrows for navigation
        (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) ||
        // F11 for fullscreen
        e.key === 'F11' ||
        // Alt+Home
        (e.altKey && e.key === 'Home') ||
        // Ctrl+N for new window
        (e.ctrlKey && e.key === 'n') ||
        // Alt+space
        (e.altKey && e.key === ' ')
      ) {
        e.preventDefault();
        return false;
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    // Store event listeners for cleanup
    window.kioskEventListeners = {
      contextmenu: handleContextMenu,
      keydown: handleKeyDown
    };
  };

  // Function to remove kiosk mode restrictions
  const removeKioskMode = () => {
    // Exit fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => {
        console.log('Error attempting to exit fullscreen mode:', err);
      });
    }

    // Remove the kiosk mode class
    document.body.classList.remove('kiosk-mode');

    // Remove the style element
    const styleElement = document.getElementById('kiosk-mode-styles');
    if (styleElement) {
      styleElement.remove();
    }

    // Remove the overlay div
    const overlay = document.getElementById('kiosk-mode-overlay');
    if (overlay) {
      overlay.remove();
    }

    // Remove event listeners
    if (window.kioskEventListeners) {
      document.removeEventListener('contextmenu', window.kioskEventListeners.contextmenu);
      document.removeEventListener('keydown', window.kioskEventListeners.keydown);
      delete window.kioskEventListeners;
    }
  };

  // Calculate and update countdown every second
  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();
      const difference = cutoffTime.getTime() - now.getTime();

      if (difference <= 0) {
        // Time has passed
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      // Calculate time remaining
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    // Initial calculation
    calculateCountdown();

    // Update countdown every second
    const timer = setInterval(calculateCountdown, 1000);

    // Clear interval on component unmount
    return () => clearInterval(timer);
  }, [cutoffTime]);

  const handleEmployeeIdSubmit = useCallback((event) => {
    event.preventDefault();
    
    if (!employeeId.trim()) {
      toast({
        title: "Error",
        description: "Please enter your Employee ID",
        variant: "destructive",
      });
      return;
    }

    // Check if the employee ID is not exactly 7 characters
    if (employeeId.length !== 7) {
      toast({
        title: "Invalid Employee ID",
        description: "Employee ID must be exactly 7 characters",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    // Check if the employee exists and get their assigned site
    setTimeout(() => {
      // Use our utility function to find driver's site information
      const result = findSiteByEmployeeId(employeeId);
      
      if (result.error && !result.driver) {
        // No driver found - display error
        toast({
          title: "Employee ID Not Recognized",
          description: result.error,
          variant: "destructive",
        });
        setIsLoading(false);
      } else if (result.error && result.driver) {
        // Driver found but site error - warn but still let them log in
        toast({
          title: "Facility Not Found",
          description: result.error,
          variant: "warning",
        });
        navigate('/driver-login', { state: { employeeId } });
      } else if (result.driver && result.site) {
        // Success - route to driver's assigned facility
        navigate('/driver-login', { 
          state: { 
            employeeId,
            siteId: result.site.id,
            siteName: result.site.name,
            companyId: result.site.companyId
          } 
        });
      } else {
        // This should never happen but is a fallback
        navigate('/driver-login', { state: { employeeId } });
      }
    }, 800);
  }, [employeeId, drivers, navigate, toast]);
  
  // Fixed admin portal navigation to prevent blank screen
  const handleAdminLogin = () => {
    // Navigate to admin portal - fixed to ensure proper route access
    // This resolves the issue with blank screen when clicking admin portal button
    const adminPortalPath = '/admin-portal';
    navigate(adminPortalPath);
  };

  // Format cutoff date and time for display - using 24-hour format
  const formatCutoffDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric'
    });
  };

  const formatCutoffTime = (date) => {
    // Using 24-hour format
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Registration request state
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [siteCode, setSiteCode] = useState('');
  const [siteName, setSiteName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Format countdown for display
  const formatCountdown = () => {
    const { days, hours, minutes, seconds } = countdown;
    let result = '';
    
    if (days > 0) result += `${days} day${days !== 1 ? 's' : ''} `;
    if (hours > 0 || days > 0) result += `${hours} hour${hours !== 1 ? 's' : ''} `;
    if (minutes > 0 || hours > 0 || days > 0) result += `${minutes} minute${minutes !== 1 ? 's' : ''} `;
    result += `${seconds} second${seconds !== 1 ? 's' : ''} remaining`;
    
    return result;
  };
  
  // Handle registration request submission
  const handleRegistrationSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!companyName.trim() || !contactName.trim() || !contactEmail.trim() || !contactPhone.trim() || 
        !siteCode.trim() || !siteName.trim() || !siteAddress.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Validate site code format (letters and numbers only, 3-5 characters)
    if (!/^[A-Z0-9]{3,5}$/.test(siteCode)) {
      toast({
        title: "Invalid Site Code",
        description: "Site code must be 3-5 uppercase letters/numbers (e.g., JACFL)",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Submit registration request
    setTimeout(() => {
      const requestId = useDriverStore.getState().addRegistrationRequest({
        companyName,
        contactName,
        contactEmail,
        contactPhone,
        notes,
        siteCode,
        siteName,
        siteAddress,
      });
      
      setIsSubmitting(false);
      setRegistrationOpen(false);
      
      // Reset form
      setCompanyName('');
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setNotes('');
      setSiteCode('');
      setSiteName('');
      setSiteAddress('');
      
      toast({
        title: "Registration Submitted",
        description: `Your request has been submitted (ID: ${requestId}). We will contact you soon.`,
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      {/* Header with mountain background - better integrated with overall design */}
      <div className="relative">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop" 
            alt="Mountain landscape" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 to-blue-900/80 z-10"></div>
        
        <div className="relative z-20 container mx-auto px-4 py-24 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="mb-6 transform hover:scale-105 transition-transform duration-300">
              <JssLogo size="lg" withText={false} />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-white drop-shadow-lg tracking-tight leading-tight">
              Job Selection System
            </h1>
            <p className="text-2xl md:text-3xl font-medium text-blue-100 drop-shadow-md tracking-wide mb-6 max-w-none">
              Driver Portal
            </p>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full mb-6"></div>
            <p className="text-blue-200 max-w-lg mx-auto">
              Access your job preferences, submit selections, and view assignments - all in one convenient location.
            </p>
          </div>
        </div>

        {/* Improved transition - removed wavy shape and replaced with subtle gradient */}
        <div className="h-8 bg-gradient-to-b from-blue-900/90 to-white relative z-20"></div>
      </div>
      
      <main className="flex-grow container mx-auto px-4 py-8 md:py-8 relative z-20">
        {/* Main content area with mountain-inspired theme */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Side - Tabs and Content */}
          <div className="w-full lg:w-2/3">
            <Tabs 
              defaultValue="overview" 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="mb-8 inline-flex h-14 items-center justify-center rounded-md bg-white p-1 text-muted-foreground shadow-md border">
                <TabsTrigger 
                  value="overview" 
                  className="inline-flex items-center justify-center whitespace-nowrap px-6 py-3 text-base font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="weekly-jobs" 
                  className="inline-flex items-center justify-center whitespace-nowrap px-6 py-3 text-base font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
                  Weekly Jobs
                </TabsTrigger>
                <TabsTrigger 
                  value="how-it-works" 
                  className="inline-flex items-center justify-center whitespace-nowrap px-6 py-3 text-base font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  <CircleHelp className="h-5 w-5 mr-2 text-blue-600" />
                  How It Works
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-0">
                <Card className="border shadow-lg hover:shadow-xl transition-all duration-200 bg-white overflow-hidden">
                  <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                  <CardContent className="p-8">
                    <div className="flex items-center mb-5">
                      <div className="p-2 rounded-lg bg-blue-100 mr-4">
                        <Mountain className="h-6 w-6 text-blue-700" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-blue-900">Weekly Job Selection</h2>
                    </div>
                    <p className="text-lg leading-relaxed mb-10 text-slate-600">
                      Current status and important information for your job selection process
                    </p>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-8 rounded-lg border border-blue-200 mb-10 flex flex-col md:flex-row md:items-center gap-6">
                      <div className="w-14 h-14 flex items-center justify-center bg-white rounded-full shadow-md">
                        <Clock className="h-7 w-7 text-blue-600 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-xl md:text-2xl mb-2 text-blue-900">Selection Period Active</h3>
                        <p className="text-lg mb-1 font-medium text-blue-800">{formatCountdown()}</p>
                        <p className="text-base text-blue-700">Deadline: {formatCutoffDate(cutoffTime)} at {formatCutoffTime(cutoffTime)}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                      <div className="border border-blue-100 rounded-lg p-6 bg-gradient-to-br from-white to-blue-50 shadow-md hover:shadow-lg transition-all duration-200">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-full">
                            <Briefcase className="h-5 w-5 text-blue-600" />
                          </div>
                          <h3 className="font-semibold text-lg md:text-xl text-blue-900">Available Jobs</h3>
                        </div>
                        <p className="text-lg mb-0 text-blue-800">{jobs.length} jobs available for selection</p>
                      </div>
                      
                      <div className="border border-blue-100 rounded-lg p-6 bg-gradient-to-br from-white to-blue-50 shadow-md hover:shadow-lg transition-all duration-200">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-full">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <h3 className="font-semibold text-lg md:text-xl text-blue-900">Assignment Method</h3>
                        </div>
                        <p className="text-lg mb-0 text-blue-800">Seniority-based preference selection</p>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 rounded-lg border border-slate-200">
                      <p className="text-lg leading-relaxed text-slate-700 max-w-[700px] mb-0">
                        Enter your Employee ID in the panel on the right to access your personal job selection portal. 
                        All selections must be submitted before the deadline.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="weekly-jobs" className="mt-0">
                <Card className="border shadow-lg hover:shadow-xl transition-all duration-200 bg-white overflow-hidden">
                  <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                  <CardContent className="p-8">
                    <div className="flex items-center mb-5">
                      <div className="p-2 rounded-lg bg-blue-100 mr-4">
                        <Briefcase className="h-6 w-6 text-blue-700" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-blue-900">Weekly Jobs</h2>
                    </div>
                    <p className="text-lg leading-relaxed mb-10 text-slate-600">Available jobs for selection</p>
                    
                    {jobs && jobs.length > 0 ? (
                      <div className="space-y-8">
                        <div className="overflow-hidden rounded-lg border shadow-lg">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                              <tr>
                                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-blue-900 uppercase tracking-wider">Job ID</th>
                                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-blue-900 uppercase tracking-wider">Start Time</th>
                                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-blue-900 uppercase tracking-wider">Days of Week</th>
                                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-blue-900 uppercase tracking-wider">Location</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {jobs.map((job, index) => (
                                <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-blue-50/50'} hover:bg-blue-100/50 transition-colors`}>
                                  <td className="px-6 py-5 whitespace-nowrap text-base font-medium text-blue-900">{job.jobId}</td>
                                  <td className="px-6 py-5 whitespace-nowrap text-base text-blue-800">{job.startTime}</td>
                                  <td className="px-6 py-5 whitespace-nowrap text-base text-blue-800">{job.weekDays}</td>
                                  <td className="px-6 py-5 whitespace-nowrap text-base text-blue-800">{job.location || (job.isAirport ? 'Airport' : 'Local')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 rounded-lg border border-slate-200">
                          <p className="text-lg leading-relaxed font-medium text-slate-700 mb-0">
                            Log in to select and rank your job preferences from the list above.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-16 border rounded-lg bg-blue-50/60 shadow-inner">
                        <p className="text-xl font-medium text-blue-800">No weekly jobs are currently available for selection.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="how-it-works" className="mt-0">
                <Card className="border shadow-lg hover:shadow-xl transition-all duration-200 bg-white overflow-hidden">
                  <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                  <CardContent className="p-8">
                    <div className="flex items-center mb-5">
                      <div className="p-2 rounded-lg bg-blue-100 mr-4">
                        <CircleHelp className="h-6 w-6 text-blue-700" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-blue-900">How It Works</h2>
                    </div>
                    <p className="text-lg leading-relaxed mb-10 text-slate-600">Job selection process</p>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg border border-blue-100 mb-8">
                      <ol className="list-decimal space-y-6 pl-6 text-lg max-w-[700px] text-blue-900">
                        <li className="pl-2">Log in with your Employee ID</li>
                        <li className="pl-2">Set up or enter your password</li>
                        <li className="pl-2">Browse available weekly jobs</li>
                        <li className="pl-2">Select your job preferences in order of priority</li>
                        <li className="pl-2">Submit your preferences before the deadline</li>
                        <li className="pl-2">Jobs are assigned based on seniority</li>
                        <li className="pl-2">View your assigned job after the selection period closes</li>
                      </ol>
                    </div>
                    
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 rounded-lg border border-slate-200">
                      <p className="text-lg leading-relaxed text-slate-700 max-w-[700px] mb-0">
                        The Job Selection System ensures fair and efficient job assignments based on seniority while respecting driver preferences.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right Side - Login Panel - Mountain Inspired Design */}
          <div className="w-full lg:w-1/3">
            <Card className="border-none shadow-xl overflow-hidden bg-white">
              <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
              <CardContent className="p-8">
                <div className="flex items-center mb-5">
                  <div className="p-2 rounded-lg bg-blue-100 mr-4">
                    <Users className="h-6 w-6 text-blue-700" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-blue-900">Driver Access</h2>
                </div>
                <p className="text-lg leading-relaxed mb-8 text-slate-600">Enter your Employee ID to continue</p>
                
                <form onSubmit={handleEmployeeIdSubmit} className="space-y-6">
                  <div className="relative">
                    <Input
                      placeholder="Enter Employee ID"
                      value={employeeId}
                      onChange={(e) => {
                        // Only allow numbers and limit to exactly 7 characters
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        // Keep it at exactly 7 characters maximum
                        setEmployeeId(value.slice(0, 7));
                      }}
                      className="pl-12 py-6 text-lg border-2 border-blue-200 hover:border-blue-400 focus:border-blue-500 transition-colors rounded-md bg-blue-50/50"
                      maxLength={7}
                      inputMode="numeric"
                    />
                    <div className="absolute top-0 left-0 flex items-center justify-center h-full px-4">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-blue-600">
                        <circle cx="12" cy="8" r="5" />
                        <path d="M20 21a8 8 0 1 0-16 0" />
                      </svg>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex justify-center items-center gap-2 py-6 text-lg rounded-md shadow-md hover:shadow-lg transition-all duration-200"
                    disabled={isLoading || employeeId.length !== 7}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="h-5 w-5 ml-1" />
                      </>
                    )}
                  </Button>
                </form>
                
                <div className="relative py-6 flex items-center">
                  <div className="flex-grow border-t border-gray-300"></div>
                  <span className="flex-shrink mx-4 text-gray-600">or</span>
                  <div className="flex-grow border-t border-gray-300"></div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full flex justify-center items-center gap-2 py-6 text-lg border-2 border-blue-300 text-blue-700 bg-white hover:bg-blue-50 rounded-md transition-all duration-200"
                  onClick={handleAdminLogin}
                >
                  <Shield className="h-5 w-5 mr-1" />
                  Admin Portal
                </Button>
                
                <div className="mt-8 bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <p className="text-sm text-blue-700 mb-0">
                    Having trouble? Contact technical support at <span className="font-medium">boleary@ups.com</span> for assistance.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      {/* Footer - Mountain Themed */}
      <footer className="mt-auto relative">
        {/* Registration dialog */}
        <Dialog open={registrationOpen} onOpenChange={setRegistrationOpen}>
          <DialogContent className="max-w-md bg-white shadow-2xl border-none">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Building2 className="mr-2 h-5 w-5 text-blue-600" />
                Request System Access
              </DialogTitle>
              <DialogDescription>
                Fill out the form below to request access to the Job Selection System for your company or facility.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleRegistrationSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="companyName">
                  <span className="flex items-center text-sm font-medium">
                    <Building2 className="mr-1 h-4 w-4 text-blue-600" />
                    Company Name *
                  </span>
                </Label>
                <Input 
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter your company name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteCode">
                  <span className="flex items-center text-sm font-medium">
                    <Home className="mr-1 h-4 w-4 text-blue-600" />
                    Site Code * 
                    <span className="text-xs text-muted-foreground ml-1">(e.g. JACFL, DALTX)</span>
                  </span>
                </Label>
                <Input 
                  id="siteCode"
                  value={siteCode}
                  onChange={(e) => setSiteCode(e.target.value.toUpperCase())}
                  placeholder="Enter site code (e.g. JACFL)"
                  required
                  maxLength={5}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="siteName">
                  <span className="flex items-center text-sm font-medium">
                    <Home className="mr-1 h-4 w-4 text-blue-600" />
                    Site Name *
                  </span>
                </Label>
                <Input 
                  id="siteName"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="Enter site name (e.g. Jacksonville, FL)"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="siteAddress">
                  <span className="flex items-center text-sm font-medium">
                    <Building2 className="mr-1 h-4 w-4 text-blue-600" />
                    Site Address *
                  </span>
                </Label>
                <Input 
                  id="siteAddress"
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                  placeholder="Enter physical address"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactName">
                  <span className="flex items-center text-sm font-medium">
                    <Users className="mr-1 h-4 w-4 text-blue-600" />
                    Contact Name *
                  </span>
                </Label>
                <Input 
                  id="contactName"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Enter contact person name"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">
                    <span className="flex items-center text-sm font-medium">
                      <Mail className="mr-1 h-4 w-4 text-blue-600" />
                      Email *
                    </span>
                  </Label>
                  <Input 
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">
                    <span className="flex items-center text-sm font-medium">
                      <Phone className="mr-1 h-4 w-4 text-blue-600" />
                      Phone *
                    </span>
                  </Label>
                  <Input 
                    id="contactPhone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">
                  <span className="flex items-center text-sm font-medium">
                    <Info className="mr-1 h-4 w-4 text-blue-600" />
                    Additional Notes
                  </span>
                </Label>
                <Textarea 
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional information or specific requirements"
                  rows={3}
                />
              </div>
              
              <DialogFooter className="mt-6">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => setRegistrationOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </span>
                  ) : "Submit Request"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Mountain-inspired top border */}
        <div className="h-6 bg-gradient-to-r from-blue-700 to-indigo-800"></div>
        
        <div className="bg-gradient-to-b from-indigo-900 to-slate-900 text-white py-8 relative overflow-hidden">
          {/* Mountain silhouette in footer */}
          <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="absolute bottom-0">
              <path fill="#ffffff" fillOpacity="1" d="M0,96L120,128L240,96L360,192L480,128L600,160L720,32L840,96L960,256L1080,224L1200,96L1320,128L1440,32L1440,320L1320,320L1200,320L1080,320L960,320L840,320L720,320L600,320L480,320L360,320L240,320L120,320L0,320Z"></path>
            </svg>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center md:text-left">
                <div className="flex justify-center md:justify-start mb-4">
                  <JssLogo size="md" withText={true} textColor="text-white" />
                </div>
                <p className="text-base text-white/80">
                  A secure and efficient system for job selection and assignment management
                </p>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-3">System Access</h3>
                <p className="text-sm text-white/70 mb-4">
                  Need the Job Selection System for your company?
                </p>
                <Button 
                  onClick={() => setRegistrationOpen(true)}
                  className="bg-blue-600/40 hover:bg-blue-600/60 border border-blue-400/30 text-white"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Request Access
                </Button>
              </div>
              
              <div className="text-center md:text-right">
                <h3 className="text-lg font-semibold mb-3">Contact</h3>
                <p className="text-sm text-white/70 mb-1">Technical Support:</p>
                <p className="text-sm text-white/90 mb-4">boleary@ups.com</p>
              </div>
            </div>
            
            <div className="border-t border-white/20 mt-8 pt-6 text-center">
              <p className="text-sm font-medium text-white/70 mb-0">
                © {new Date().getFullYear()} Job Selection System | All Rights Reserved
              </p>
            </div>
          </div>
        </div>
      </footer>

      {kioskMode && (
        <div id="kiosk-mode-banner" className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white p-2 text-center text-sm font-medium z-50">
          <p>Kiosk Mode Active - This computer is restricted to the Job Selection System</p>
        </div>
      )}
    </div>
  );
}

export default HomePage;