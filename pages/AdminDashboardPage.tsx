import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { 
  Activity, 
  Users, 
  Truck, 
  CheckCircle2, 
  AlertTriangle, 
  BarChart3, 
  ArrowUpDown,
  Briefcase,
  MessageSquare,
  RefreshCcw,
  Eye,
  ChevronRight,
  Clock,
  Calendar,
  Bell,
  LucideStar,
  Award,
  Home,
  LogOut,
  Mountain,
  Info,
  FileText,
  Settings,
  Clipboard,
  HelpCircle,
  ShieldAlert
} from "lucide-react";
import JssLogo from "@/components/logo/JssLogo";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/MainLayout";
import useDriverStore from "@/store/driverStore";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/auth-store";
import { dataService } from "@/services/data-service";
import { activityService } from "@/services/activity-service";
import { tenantService } from "@/services/tenant-service";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [activeConflicts, setActiveConflicts] = useState<number>(0);
  const [resolvedConflicts, setResolvedConflicts] = useState<number>(0);
  const [statistics, setStatistics] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Use proper auth store instead of localStorage
  const { 
    isAuthenticated, 
    userRole, 
    companyId, 
    siteId, 
    isMasterAdmin,
    user,
    logout
  } = useAuthStore();
  
  const { 
    drivers, 
    jobs, 
    getUniqueDriverPreferences, 
    calculateJobAssignments, 
    driverActivity,
    cleanPreferences,
    getDriversByCompanySite,
    getJobsByCompanySite
  } = useDriverStore();
  
  useEffect(() => {
    // SECURE AUTHENTICATION CHECK - Use auth store instead of localStorage
    if (!isAuthenticated || (userRole !== 'admin' && userRole !== 'master')) {
      toast({
        title: "Access Denied",
        description: "Admin authentication required to access this page",
        variant: "destructive",
      });
      navigate('/admin-portal');
      return;
    }
    
    // Load tenant-scoped data
    loadDashboardData();
  }, [isAuthenticated, userRole, navigate, toast]);
  
  // Load dashboard data scoped to current tenant
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load tenant statistics and activity (automatically scoped)
      const [stats, activity] = await Promise.all([
        activityService.getTenantStatistics(),
        activityService.getTenantActivities(10)
      ]);
      
      setStatistics(stats);
      setActivities(activity);
      
      // Log admin dashboard access
      activityService.logActivity({
        type: 'admin_login',
        description: `Admin accessed dashboard for ${tenantService.getTenantDisplayName()}`
      });
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: "Data Load Failed",
        description: "Unable to load dashboard data. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Use tenant-scoped statistics (secure and isolated per company/site)
  const stats = statistics || {
    totalDrivers: 0,
    totalJobs: 0,
    submittedPreferences: 0,
    pendingDrivers: 0,
    recentActivity: 0,
    conflictsResolved: 0
  };
  
  // Calculate metrics for the dashboard (from secure backend data)
  const totalJobs = stats.totalJobs;
  const eligibleDrivers = stats.totalDrivers;
  const driversWithPreferences = stats.submittedPreferences;
  const driversWithoutPreferences = stats.pendingDrivers;
  const submissionRate = eligibleDrivers > 0 ? Math.round((driversWithPreferences / eligibleDrivers) * 100) : 0;

  // Calculate disputed jobs (jobs where multiple drivers selected the same job as their 1st choice)
  useEffect(() => {
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
    
    // Count disputed jobs (more than one driver selected it as first choice)
    let disputes = 0;
    let resolved = 0;
    
    Object.entries(firstChoiceMap).forEach(([jobId, driverIds]) => {
      if (driverIds.length > 1) {
        // This job has multiple drivers wanting it as first choice
        disputes++;
        
        // Check if the job has been assigned
        const assignment = jobAssignments.find(a => a.jobId === jobId);
        if (assignment) {
          // Job was assigned - this dispute was resolved
          resolved++;
        }
      }
    });
    
    setActiveConflicts(disputes - resolved);
    setResolvedConflicts(resolved);
  }, [uniquePreferences, jobAssignments]);
  
  // Recent activities from the store
  const recentActivities = driverActivity
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);
    
  // Format time for recent activities
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };
  
  // Function for the activity log - FIXED: Now navigates to activity log page
  const viewAllActivity = () => {
    navigate("/admin/activity-log");
  };
  
  // Function to refresh dashboard data
  const refreshDashboard = () => {
    cleanPreferences();
    toast({
      title: "Dashboard Refreshed",
      description: "Latest data has been loaded",
    });
  };

  // Function to get driver initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Function to navigate back to driver portal
  const goToDriverPortal = () => {
    navigate("/");
  };

  // Function to handle logout
  const handleLogout = () => {
    // Remove all admin related data from localStorage
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('isMasterAdmin');
    localStorage.removeItem('adminCompanyId');
    localStorage.removeItem('adminSiteId');
    
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
    navigate("/admin-portal");
  };

  // Handle navigation to final assignments page
  const goToFinalAssignments = () => {
    navigate("/admin/final-assignments");
  };
  
  // Handle navigation to dispute resolution - FIXED: Now directly navigates instead of using toast
  const goToDisputeResolution = () => {
    navigate("/admin/dispute-resolution");
  };
  
  // Function to navigate to system settings page
  const goToSystemSettings = () => {
    navigate("/admin/system-settings");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero section with mountain background - Improved visual design */}
      <div className="relative bg-gradient-to-b from-slate-800 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 z-0">
          {/* Mountain image background with improved opacity and blend */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed" 
            style={{ 
              backgroundImage: "url('https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&h=600&fit=crop')",
              opacity: 0.4,
              backgroundPosition: "center 25%"
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 to-blue-900/70"></div>
        </div>
        
        <div className="relative z-10 pt-8 md:pt-16 pb-32 container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div className="flex items-center">
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm mr-4">
                <Mountain className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-1 tracking-tight leading-tight">
                  Admin Dashboard
                </h1>
                <p className="text-blue-100 text-lg">Job Selection System Management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isMasterAdmin && currentCompanyId === 'UPS' && currentSiteId === 'JACFL' && (
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin/master-admin')}
                  className="flex items-center gap-2 bg-red-800/30 hover:bg-red-800/50 text-white border-red-400/30 backdrop-blur-sm"
                >
                  <ShieldAlert size={16} />
                  <span className="ml-1">Master Admin</span>
                </Button>
              )}
              <Button 
                variant="outline"
                onClick={goToDriverPortal}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
              >
                <Home size={16} />
                <span className="ml-1">Driver Portal</span>
              </Button>
              <Button 
                variant="outline"
                onClick={refreshDashboard}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
              >
                <RefreshCcw size={16} />
                <span className="ml-1">Refresh Data</span>
              </Button>
              <Button 
                variant="outline"
                onClick={handleLogout}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
              >
                <LogOut size={16} />
                <span className="ml-1">Logout</span>
              </Button>
            </div>
          </div>

          {/* Stats Overview Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <Card className="bg-white/10 border-none text-white backdrop-blur-sm shadow-xl overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Truck className="h-6 w-6" />
                  </div>
                  <span>Job Assignments</span>
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Assignment progress and analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-blue-100 text-sm">Completion Rate</span>
                      <div className="text-4xl font-bold">{assignmentRate}%</div>
                    </div>
                    <div className="text-right">
                      <span className="text-blue-100 text-sm">Total Jobs</span>
                      <div className="text-2xl font-bold">{totalJobs}</div>
                    </div>
                  </div>
                  
                  <Progress value={assignmentRate} className="h-2.5 bg-white/20" indicatorClassName="bg-gradient-to-r from-blue-400 to-indigo-400" />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-400/20 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Assigned</div>
                        <CheckCircle2 size={18} className="text-emerald-300" />
                      </div>
                      <div className="text-2xl font-bold mt-1">{assignedJobs}</div>
                    </div>
                    <div className="bg-amber-400/20 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Pending</div>
                        <Clock size={18} className="text-amber-300" />
                      </div>
                      <div className="text-2xl font-bold mt-1">{unassignedJobs}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 border-none text-white backdrop-blur-sm shadow-xl overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Users className="h-6 w-6" />
                  </div>
                  <span>Driver Submissions</span>
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Driver participation tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-blue-100 text-sm">Submission Rate</span>
                      <div className="text-4xl font-bold">{submissionRate}%</div>
                    </div>
                    <div className="text-right">
                      <span className="text-blue-100 text-sm">Eligible Drivers</span>
                      <div className="text-2xl font-bold">{eligibleDrivers}</div>
                    </div>
                  </div>
                  
                  <Progress value={submissionRate} className="h-2.5 bg-white/20" indicatorClassName="bg-gradient-to-r from-emerald-400 to-teal-400" />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-400/20 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Submitted</div>
                        <CheckCircle2 size={18} className="text-emerald-300" />
                      </div>
                      <div className="text-2xl font-bold mt-1">{driversWithPreferences}</div>
                    </div>
                    <div className="bg-amber-400/20 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Missing</div>
                        <AlertTriangle size={18} className="text-amber-300" />
                      </div>
                      <div className="text-2xl font-bold mt-1">{driversWithoutPreferences}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/10 border-none text-white backdrop-blur-sm shadow-xl overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <span>Job Conflicts</span>
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Resolution of competing job selections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-blue-100 text-sm">Resolution Rate</span>
                      <div className="text-4xl font-bold">
                        {activeConflicts + resolvedConflicts > 0 
                          ? Math.round((resolvedConflicts / (activeConflicts + resolvedConflicts)) * 100)
                          : 100}%
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-blue-100 text-sm">Total Conflicts</span>
                      <div className="text-2xl font-bold">{activeConflicts + resolvedConflicts}</div>
                    </div>
                  </div>
                  
                  <Progress 
                    value={activeConflicts + resolvedConflicts > 0 
                      ? Math.round((resolvedConflicts / (activeConflicts + resolvedConflicts)) * 100)
                      : 100} 
                    className="h-2.5 bg-white/20" 
                    indicatorClassName="bg-gradient-to-r from-purple-400 to-pink-400"
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-400/20 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Resolved</div>
                        <CheckCircle2 size={18} className="text-emerald-300" />
                      </div>
                      <div className="text-2xl font-bold mt-1">{resolvedConflicts}</div>
                    </div>
                    <div className="bg-amber-400/20 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Active</div>
                        <AlertTriangle size={18} className="text-amber-300" />
                      </div>
                      <div className="text-2xl font-bold mt-1">{activeConflicts}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Action Cards with smooth transition from header */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              onClick={() => navigate("/admin/edit-drivers")}
              variant="secondary"
              className="h-28 md:h-32 flex flex-col items-center justify-center gap-3 bg-white/10 hover:bg-white/20 text-white border-none shadow-xl backdrop-blur-sm"
            >
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 h-12 w-12 rounded-xl flex items-center justify-center shadow-lg">
                <Users size={24} />
              </div>
              <span className="text-lg font-medium">Manage Drivers</span>
            </Button>
            <Button 
              onClick={() => navigate("/admin/edit-jobs")}
              variant="secondary"
              className="h-28 md:h-32 flex flex-col items-center justify-center gap-3 bg-white/10 hover:bg-white/20 text-white border-none shadow-xl backdrop-blur-sm"
            >
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 h-12 w-12 rounded-xl flex items-center justify-center shadow-lg">
                <Briefcase size={24} />
              </div>
              <span className="text-lg font-medium">Manage Jobs</span>
            </Button>
            <Button 
              onClick={() => navigate("/admin/live-picks-snapshot")}
              variant="secondary"
              className="h-28 md:h-32 flex flex-col items-center justify-center gap-3 bg-white/10 hover:bg-white/20 text-white border-none shadow-xl backdrop-blur-sm"
            >
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 h-12 w-12 rounded-xl flex items-center justify-center shadow-lg">
                <Activity size={24} />
              </div>
              <span className="text-lg font-medium">Live Picks</span>
            </Button>
            <Button 
              onClick={goToFinalAssignments}
              variant="secondary"
              className="h-28 md:h-32 flex flex-col items-center justify-center gap-3 bg-white/10 hover:bg-white/20 text-white border-none shadow-xl backdrop-blur-sm"
            >
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 h-12 w-12 rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircle2 size={24} />
              </div>
              <span className="text-lg font-medium">Final Assignments</span>
            </Button>
          </div>
        </div>
        
        {/* Improved transition - Smooth gradient instead of wavy shape */}
        <div className="h-16 bg-gradient-to-b from-indigo-900 to-white relative z-10"></div>
      </div>

      <div className="bg-white">
        <div className="container pt-8 pb-12">
          {/* Activity Feed and Tools Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Live Activity Feed */}
            <div className="md:col-span-2">
              <Card className="border-none shadow-2xl overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                <CardHeader className="bg-gradient-to-b from-indigo-50 to-white border-b pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center text-lg text-indigo-900">
                      <Activity className="mr-2 h-5 w-5 text-indigo-600" />
                      Real-Time Activity Feed
                    </CardTitle>
                    <Badge 
                      variant="outline" 
                      className="bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200"
                    >
                      Live
                    </Badge>
                  </div>
                  <CardDescription className="text-indigo-700">
                    Monitor driver actions in real-time
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 max-h-[400px] overflow-auto">
                  <div className="divide-y divide-gray-100">
                    {recentActivities.length > 0 ? (
                      recentActivities.map((activity, index) => (
                        <div key={index} className="flex items-center p-4 hover:bg-gray-50 transition-colors">
                          <Avatar className="h-10 w-10 mr-4 border border-gray-200 shadow-sm">
                            <AvatarFallback className="bg-indigo-100 text-indigo-700">
                              {getInitials(activity.driverName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-grow">
                            <div className="flex justify-between">
                              <h4 className="font-medium text-gray-900">{activity.driverName}</h4>
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {formatTimeAgo(activity.timestamp)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 flex items-center">
                              {activity.action === 'create' && (
                                <>
                                  <CheckCircle2 size={14} className="text-emerald-500 mr-1" />
                                  <span>Submitted job preferences</span>
                                </>
                              )}
                              {activity.action === 'update' && (
                                <>
                                  <RefreshCcw size={14} className="text-amber-500 mr-1" />
                                  <span>Updated job preferences</span>
                                </>
                              )}
                              {activity.action === 'view' && (
                                <>
                                  <Eye size={14} className="text-blue-500 mr-1" />
                                  <span>Viewed job selections</span>
                                </>
                              )}
                              {activity.action === 'login' && (
                                <>
                                  <Clock size={14} className="text-purple-500 mr-1" />
                                  <span>Logged into the system</span>
                                </>
                              )}
                              {activity.action === 'logout' && (
                                <>
                                  <Clock size={14} className="text-gray-500 mr-1" />
                                  <span>Logged out</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-gray-500">
                        <Calendar className="h-12 w-12 text-gray-300 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No Recent Activity</h3>
                        <p className="max-w-sm">
                          Driver activity will appear here when drivers log in and submit their job preferences.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 border-t p-4">
                  <Button 
                    variant="secondary" 
                    className="w-full bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200 shadow-sm"
                    onClick={viewAllActivity}
                  >
                    View Complete Activity Log <ChevronRight size={16} className="ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Key Management Tools - Enhanced with additional tools */}
            <div>
              <Card className="shadow-2xl border-none overflow-hidden h-full">
                <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                <CardHeader className="bg-gradient-to-b from-blue-50 to-white border-b pb-4">
                  <CardTitle className="flex items-center text-lg text-blue-900">
                    <Award className="mr-2 h-5 w-5 text-blue-600" />
                    Key Management Tools
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    Quick access to essential functions
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start flex items-center px-4 py-4 rounded-none hover:bg-blue-50 transition-colors"
                      onClick={() => navigate("/admin/live-picks-snapshot")}
                    >
                      <div className="mr-4 h-10 w-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md">
                        <BarChart3 size={20} />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-blue-900">Live Picks Dashboard</div>
                        <div className="text-xs text-blue-600">View real-time selection data</div>
                      </div>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start flex items-center px-4 py-4 rounded-none hover:bg-indigo-50 transition-colors"
                      onClick={() => navigate("/admin/final-assignments")}
                    >
                      <div className="mr-4 h-10 w-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-md">
                        <FileText size={20} />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-indigo-900">Final Assignments</div>
                        <div className="text-xs text-indigo-600">View and print assignment reports</div>
                      </div>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start flex items-center px-4 py-4 rounded-none hover:bg-emerald-50 transition-colors"
                      onClick={() => navigate("/admin/edit-jobs")}
                    >
                      <div className="mr-4 h-10 w-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-md">
                        <Briefcase size={20} />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-emerald-900">Edit Jobs</div>
                        <div className="text-xs text-emerald-600">Manage available job positions</div>
                      </div>
                    </Button>

                    {/* Added new management tool for dispute resolution */}
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start flex items-center px-4 py-4 rounded-none hover:bg-purple-50 transition-colors"
                      onClick={goToDisputeResolution}
                    >
                      <div className="mr-4 h-10 w-10 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-md">
                        <MessageSquare size={20} />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-purple-900">Dispute Resolution</div>
                        <div className="text-xs text-purple-600">Resolve job selection conflicts</div>
                      </div>
                    </Button>
                    
                    {/* Updated system settings button to navigate to the page */}
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start flex items-center px-4 py-4 rounded-none hover:bg-slate-50 transition-colors"
                      onClick={goToSystemSettings}
                    >
                      <div className="mr-4 h-10 w-10 rounded-lg bg-slate-600 text-white flex items-center justify-center shadow-md">
                        <Settings size={20} />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-slate-900">System Settings</div>
                        <div className="text-xs text-slate-600">Configure system parameters</div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Feature Cards Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="shadow-xl border-none overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
              <div className="bg-blue-50 p-4 flex items-center gap-4 border-b">
                <div className="bg-blue-600 text-white p-3 rounded-xl">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-blue-900 text-lg">Driver Management</h3>
                  <p className="text-blue-700 text-sm">Manage driver information and eligibility</p>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Button 
                    onClick={() => navigate("/admin/edit-drivers")} 
                    variant="outline" 
                    className="w-full justify-start text-blue-700 border-blue-200"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    <span>Manage Driver Database</span>
                  </Button>
                  <Button 
                    onClick={() => navigate("/admin/live-picks-snapshot")} 
                    variant="outline" 
                    className="w-full justify-start text-blue-700 border-blue-200"
                  >
                    <Activity className="mr-2 h-4 w-4" />
                    <span>View Driver Job Selections</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-none overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-indigo-500 to-indigo-600"></div>
              <div className="bg-indigo-50 p-4 flex items-center gap-4 border-b">
                <div className="bg-indigo-600 text-white p-3 rounded-xl">
                  <Award size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-indigo-900 text-lg">Assignment Management</h3>
                  <p className="text-indigo-700 text-sm">Process job selections and assignments</p>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Button 
                    onClick={() => navigate("/admin/edit-jobs")} 
                    variant="outline" 
                    className="w-full justify-start text-indigo-700 border-indigo-200"
                  >
                    <Briefcase className="mr-2 h-4 w-4" />
                    <span>Manage Job Database</span>
                  </Button>
                  <Button 
                    onClick={goToFinalAssignments}
                    variant="outline" 
                    className="w-full justify-start text-indigo-700 border-indigo-200"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    <span>View Final Assignments</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Admin Guide Card */}
          <Card className="shadow-xl border-none overflow-hidden mb-8">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            <CardHeader className="bg-gradient-to-b from-blue-50 to-white border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-blue-900 flex items-center">
                  <Info className="mr-3 h-5 w-5 text-blue-600" />
                  Admin Quick Reference
                </CardTitle>
              </div>
              <CardDescription className="text-blue-700">
                Essential information for system administrators
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100 space-y-6">
                <div>
                  <h4 className="font-semibold text-blue-900 mb-3">Assignment Process Overview</h4>
                  <p className="text-blue-800 mb-3">
                    The Job Selection System automatically assigns jobs based on driver preferences and seniority when there are no conflicts.
                  </p>
                  <p className="text-blue-800 mb-0">
                    Use the Final Assignments page to review assignments, print reports, and make any necessary manual adjustments.
                  </p>
                </div>
                
                <div className="border-t border-blue-200 pt-4">
                  <h4 className="font-semibold text-blue-900 mb-3">Driver Management Tips</h4>
                  <p className="text-blue-800 mb-3">
                    Set seniority numbers for each driver to determine job assignment priority during conflicts.
                  </p>
                  <p className="text-blue-800 mb-0">
                    Toggle the eligibility status to control which drivers can participate in the job selection process.
                  </p>
                </div>
                
                <div className="border-t border-blue-200 pt-4">
                  <h4 className="font-semibold text-blue-900 mb-3">Printing Assignment Reports</h4>
                  <p className="text-blue-800 mb-3">
                    The Final Assignments page includes a print function to generate professional reports for lobby display.
                  </p>
                  <p className="text-blue-800 mb-0">
                    Reports are automatically sorted by seniority and include all relevant job information.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end mt-4">
                <Button 
                  variant="outline" 
                  onClick={goToFinalAssignments}
                  className="bg-white text-blue-700 border-blue-300"
                >
                  View Final Assignments
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Mountain-themed Footer */}
      <footer className="mt-auto">
        {/* Mountain-inspired top border */}
        <div className="h-4 bg-gradient-to-r from-blue-700 to-indigo-800"></div>
        
        <div className="bg-gradient-to-b from-indigo-900 to-slate-900 text-white py-8 relative overflow-hidden">
          {/* Mountain silhouette in footer */}
          <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="absolute bottom-0">
              <path fill="#ffffff" fillOpacity="1" d="M0,96L120,128L240,96L360,192L480,128L600,160L720,32L840,96L960,256L1080,224L1200,96L1320,128L1440,32L1440,320L1320,320L1200,320L1080,320L960,320L840,320L720,320L600,320L480,320L360,320L240,320L120,320L0,320Z"></path>
            </svg>
          </div>
          
          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="flex justify-center mb-4">
              <JssLogo size="md" withText={true} textColor="text-white" />
            </div>
            <p className="text-lg font-medium text-white/90 mb-0 max-w-none">
              © {new Date().getFullYear()} Brian P. O'Leary | All Rights Reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}