import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import useDriverStore from "@/store/driverStore";
import { ChevronLeft, Activity, Search, Calendar, Clock, Eye, CheckCircle2, RefreshCcw, Filter, Calendar as CalendarIcon, Download, Plus, Trash, ArrowRight, ArrowUp, ArrowDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Job } from "@/store/driverStore";

export default function ActivityLogPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  
  const { driverActivity, jobs } = useDriverStore();
  
  useEffect(() => {
    // Check if admin is logged in
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    
    if (!isLoggedIn) {
      // If not logged in, redirect to admin portal
      toast({
        title: "Authentication Required",
        description: "Please log in to access the admin dashboard",
        variant: "destructive",
      });
      navigate('/admin-portal');
      return;
    }
    
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [navigate, toast]);

  // Format date in a readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  // Function to get relative time (e.g., "2 hours ago")
  const getRelativeTime = (dateString: string) => {
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

  // Group activities by date for the timeline view
  const groupActivitiesByDate = () => {
    const grouped: Record<string, typeof driverActivity> = {};
    
    driverActivity.forEach(activity => {
      const date = new Date(activity.timestamp);
      const dateString = date.toDateString(); // Get date without time
      
      if (!grouped[dateString]) {
        grouped[dateString] = [];
      }
      
      grouped[dateString].push(activity);
    });
    
    // Sort activities within each day by timestamp (newest first)
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });
    
    return grouped;
  };

  // Get activity icon based on action type
  const getActivityIcon = (action: string) => {
    switch(action) {
      case 'create':
        return <CheckCircle2 size={16} className="text-green-500" />;
      case 'update':
        return <RefreshCcw size={16} className="text-amber-500" />;
      case 'view':
        return <Eye size={16} className="text-blue-500" />;
      case 'login':
        return <Clock size={16} className="text-purple-500" />;
      case 'logout':
        return <Clock size={16} className="text-gray-500" />;
      case 'delete':
        return <Trash size={16} className="text-red-500" />;
      default:
        return <Activity size={16} className="text-indigo-500" />;
    }
  };
  
  // Get job details by ID
  const getJobById = (jobId: string): Job | undefined => {
    return jobs.find(j => j.jobId === jobId);
  };

  // Format job details for display
  const formatJobDetails = (job: Job | undefined): string => {
    if (!job) return 'Unknown Job';
    return `${job.jobId} (${job.startTime}, ${job.weekDays}${job.isAirport ? ', Airport' : ''})`;
  };

  // Find the previous activity for a driver to compare job changes
  const findPreviousActivity = (currentActivity: typeof driverActivity[0]) => {
    return driverActivity
      .filter(a => 
        a.driverId === currentActivity.driverId && 
        (a.action === 'create' || a.action === 'update') &&
        new Date(a.timestamp) < new Date(currentActivity.timestamp) &&
        a.jobDetails && a.jobDetails.length > 0
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  };

  // Compare job arrays and determine added, removed, and reordered jobs
  const compareJobArrays = (current: string[] = [], previous: string[] = []) => {
    const added = current.filter(job => !previous.includes(job));
    const removed = previous.filter(job => !current.includes(job));
    
    // Check for reordering (same jobs but different order)
    const reordered = current.length === previous.length && 
                      added.length === 0 && 
                      removed.length === 0 && 
                      !current.every((job, idx) => job === previous[idx]);
    
    // Create a map of each job's position in both arrays to show position changes
    const positionChanges: Record<string, { from: number; to: number }> = {};
    
    if (reordered) {
      const commonJobs = current.filter(job => previous.includes(job));
      
      commonJobs.forEach(job => {
        const prevIndex = previous.indexOf(job);
        const currIndex = current.indexOf(job);
        
        if (prevIndex !== currIndex) {
          positionChanges[job] = {
            from: prevIndex + 1, // 1-based indexing for display
            to: currIndex + 1
          };
        }
      });
    }
    
    return { added, removed, reordered, positionChanges };
  };

  // Analyze and format job changes for activity details
  const getDetailedActivityDescription = (activity: typeof driverActivity[0]) => {
    const { action, details, jobDetails } = activity;
    
    if (!jobDetails || jobDetails.length === 0) {
      return details; // Return original details if no job details are available
    }
    
    switch (action) {
      case 'create': {
        const jobDetailsFormatted = jobDetails.map((jobId, index) => {
          const job = getJobById(jobId);
          return `${index + 1}. ${formatJobDetails(job)}`;
        });
        
        return (
          <div>
            <div className="font-medium mb-1">Submitted {jobDetails.length} job preferences:</div>
            <ul className="space-y-1 text-xs">
              {jobDetailsFormatted.map((detail, index) => (
                <li key={index} className="flex items-start">
                  <Badge variant="outline" className="min-w-[22px] h-5 flex items-center justify-center mr-1 bg-green-50">
                    {index + 1}
                  </Badge>
                  <span>{detail.substring(detail.indexOf('.') + 2)}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      }
      
      case 'update': {
        // Find a previous activity for this driver to compare
        const prevActivity = findPreviousActivity(activity);
        const prevJobDetails = prevActivity?.jobDetails || [];
        
        // Analyze what changed
        const { added, removed, reordered, positionChanges } = compareJobArrays(jobDetails, prevJobDetails);
        
        return (
          <div>
            <div className="font-medium mb-1">Updated job preferences:</div>
            <ul className="space-y-1.5 text-xs">
              {added.length > 0 && (
                <li className="flex items-start">
                  <Plus size={14} className="text-green-500 mr-1.5 mt-0.5" />
                  <div>
                    <span className="font-medium">Added: </span>
                    <ul className="mt-1 ml-1 space-y-1">
                      {added.map((jobId, idx) => {
                        const job = getJobById(jobId);
                        const position = jobDetails.indexOf(jobId) + 1; // 1-based position
                        return (
                          <li key={idx} className="flex items-center">
                            <Badge variant="outline" className="min-w-[22px] h-5 flex items-center justify-center mr-1 bg-green-50">
                              {position}
                            </Badge>
                            <span>{formatJobDetails(job)}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </li>
              )}
              
              {removed.length > 0 && (
                <li className="flex items-start">
                  <Trash size={14} className="text-red-500 mr-1.5 mt-0.5" />
                  <div>
                    <span className="font-medium">Removed: </span>
                    <ul className="mt-1 ml-1 space-y-1">
                      {removed.map((jobId, idx) => {
                        const job = getJobById(jobId);
                        const position = prevJobDetails.indexOf(jobId) + 1; // 1-based position in previous list
                        return (
                          <li key={idx} className="flex items-center">
                            <Badge variant="outline" className="min-w-[22px] h-5 flex items-center justify-center mr-1 bg-red-50">
                              {position}
                            </Badge>
                            <span>{formatJobDetails(job)}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </li>
              )}
              
              {reordered && (
                <li className="flex items-start">
                  <div className="flex flex-col mr-1.5 mt-0.5">
                    <ArrowUp size={7} className="text-blue-500" />
                    <ArrowDown size={7} className="text-blue-500" />
                  </div>
                  <div>
                    <span className="font-medium">Reordered job preferences: </span>
                    <ul className="mt-1 ml-1 space-y-1">
                      {Object.keys(positionChanges).map((jobId, idx) => {
                        const job = getJobById(jobId);
                        const { from, to } = positionChanges[jobId];
                        const changeDesc = from < to ? `moved down` : `moved up`;
                        return (
                          <li key={idx} className="flex items-center">
                            <Badge variant="outline" className="min-w-[22px] h-5 flex items-center justify-center mr-1 bg-blue-50">
                              {to}
                            </Badge>
                            <span>
                              {formatJobDetails(job)} - {changeDesc} from position {from} to {to}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </li>
              )}
              
              <li className="flex items-start text-xs mt-2 pt-2 border-t border-slate-100">
                <ArrowRight size={14} className="text-slate-500 mr-1.5 mt-0.5" />
                <div>
                  <span className="font-medium">Current priority order: </span>
                  <ul className="mt-1 space-y-1">
                    {jobDetails.map((jobId, index) => {
                      const job = getJobById(jobId);
                      return (
                        <li key={index} className="flex items-center">
                          <Badge variant="outline" className="min-w-[22px] h-5 flex items-center justify-center mr-1 bg-blue-50">
                            {index + 1}
                          </Badge>
                          <span>{formatJobDetails(job)}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </li>
            </ul>
          </div>
        );
      }
      
      case 'view':
        return `Viewed job selections`;
      
      default:
        return details;
    }
  };
  
  // Get activity text based on action type (simpler version for table view)
  const getActivityText = (action: string, details: string, jobDetails?: string[]) => {
    switch(action) {
      case 'create':
        return jobDetails?.length 
          ? `Submitted ${jobDetails.length} job preferences` 
          : "Submitted job preferences";
      case 'update': {
        // For table view, find the previous activity to compare
        const activity = driverActivity.find(a => 
          a.action === action && 
          a.details === details && 
          a.jobDetails === jobDetails
        );
        
        if (activity) {
          const prevActivity = findPreviousActivity(activity);
          const prevJobDetails = prevActivity?.jobDetails || [];
          const { added, removed, reordered } = compareJobArrays(jobDetails, prevJobDetails);
          
          let changeDescription = [];
          if (added.length > 0) changeDescription.push(`Added ${added.length} jobs`);
          if (removed.length > 0) changeDescription.push(`Removed ${removed.length} jobs`);
          if (reordered) changeDescription.push("Reordered preferences");
          
          if (changeDescription.length > 0) {
            return `Updated job preferences: ${changeDescription.join(', ')}`;
          }
        }
        
        return `Updated job preferences (${jobDetails?.length || 0} jobs)`;
      }
      case 'view':
        return "Viewed job selections";
      case 'login':
        return "Logged into the system";
      case 'logout':
        return "Logged out";
      case 'delete':
        return "Deleted job preferences";
      default:
        return details || "Performed an action";
    }
  };
  
  // Function to get initials for avatar
  const getInitials = (name: string = "Unknown") => {
    if (!name || name === "Unknown") return "UN";
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Apply filters and search to activity data
  const filteredActivities = driverActivity.filter(activity => {
    // Apply search term filter
    if (searchTerm && !activity.driverName.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !activity.driverId.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Apply action type filter
    if (actionFilter !== 'all' && activity.action !== actionFilter) {
      return false;
    }
    
    // Apply date filter
    if (dateFilter !== 'all') {
      const activityDate = new Date(activity.timestamp);
      const now = new Date();
      
      if (dateFilter === 'today') {
        const today = new Date();
        return activityDate.toDateString() === today.toDateString();
      }
      
      if (dateFilter === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return activityDate.toDateString() === yesterday.toDateString();
      }
      
      if (dateFilter === 'thisWeek') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return activityDate >= weekAgo;
      }
    }
    
    return true;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  // Get activity counts by type for statistics
  const activityCounts = {
    total: driverActivity.length,
    create: driverActivity.filter(a => a.action === 'create').length,
    update: driverActivity.filter(a => a.action === 'update').length,
    view: driverActivity.filter(a => a.action === 'view').length,
    login: driverActivity.filter(a => a.action === 'login').length,
    logout: driverActivity.filter(a => a.action === 'logout').length,
    delete: driverActivity.filter(a => a.action === 'delete').length,
  };
  
  // Group activities by date for the timeline view
  const groupedActivities = groupActivitiesByDate();
  const groupDates = Object.keys(groupedActivities).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Handle export of activity log
  const handleExportLog = () => {
    toast({
      title: "Export Initiated",
      description: "Activity log export started. Check your downloads folder.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Mountain-themed Header */}
      <div className="relative bg-gradient-to-b from-slate-800 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 z-0">
          {/* Mountain image background */}
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
        
        <div className="relative z-10 py-10 container">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/admin")}
            className="mb-4 bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Back to Dashboard
          </Button>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center">
              <div className="bg-white/10 p-2 rounded-lg mr-3">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Activity Log</h1>
                <p className="text-blue-200">Complete history of system activities</p>
              </div>
            </div>

            <Button 
              variant="outline"
              size="sm" 
              onClick={handleExportLog}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Log
            </Button>
          </div>

          {/* Activity Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 mt-8">
            <Card className="bg-white/10 border-none text-white backdrop-blur-sm shadow-lg overflow-hidden">
              <CardContent className="p-3">
                <h3 className="font-medium text-xs text-blue-100 mb-1">Total Activities</h3>
                <div className="text-2xl font-bold">{activityCounts.total}</div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-none text-white backdrop-blur-sm shadow-lg overflow-hidden">
              <CardContent className="p-3">
                <h3 className="font-medium text-xs text-blue-100 mb-1">Submissions</h3>
                <div className="text-2xl font-bold">{activityCounts.create}</div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-none text-white backdrop-blur-sm shadow-lg overflow-hidden">
              <CardContent className="p-3">
                <h3 className="font-medium text-xs text-blue-100 mb-1">Updates</h3>
                <div className="text-2xl font-bold">{activityCounts.update}</div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-none text-white backdrop-blur-sm shadow-lg overflow-hidden">
              <CardContent className="p-3">
                <h3 className="font-medium text-xs text-blue-100 mb-1">Views</h3>
                <div className="text-2xl font-bold">{activityCounts.view}</div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-none text-white backdrop-blur-sm shadow-lg overflow-hidden">
              <CardContent className="p-3">
                <h3 className="font-medium text-xs text-blue-100 mb-1">Logins</h3>
                <div className="text-2xl font-bold">{activityCounts.login}</div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-none text-white backdrop-blur-sm shadow-lg overflow-hidden">
              <CardContent className="p-3">
                <h3 className="font-medium text-xs text-blue-100 mb-1">Logouts</h3>
                <div className="text-2xl font-bold">{activityCounts.logout}</div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Smooth gradient transition */}
        <div className="h-16 bg-gradient-to-b from-indigo-900 to-white relative z-10"></div>
      </div>

      <div className="container py-6 flex-grow">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-12 w-12 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin mb-4"></div>
            <h3 className="text-lg font-medium">Loading Activity Log</h3>
            <p className="text-slate-500">Retrieving system activity history...</p>
          </div>
        ) : (
          <div>
            {/* Search and Filter Controls */}
            <Card className="mb-6 border-none shadow-xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-indigo-500 to-indigo-600"></div>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input 
                      placeholder="Search by driver name or ID..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Filter size={16} className="text-slate-500" />
                    <Select value={actionFilter} onValueChange={setActionFilter}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Filter by action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        <SelectItem value="create">Submissions</SelectItem>
                        <SelectItem value="update">Updates</SelectItem>
                        <SelectItem value="view">Views</SelectItem>
                        <SelectItem value="login">Logins</SelectItem>
                        <SelectItem value="logout">Logouts</SelectItem>
                        <SelectItem value="delete">Deletions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <CalendarIcon size={16} className="text-slate-500" />
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Filter by date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="yesterday">Yesterday</SelectItem>
                        <SelectItem value="thisWeek">This Week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Activity Log Display */}
            <Tabs defaultValue="table" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="table">Table View</TabsTrigger>
                <TabsTrigger value="timeline">Timeline View</TabsTrigger>
              </TabsList>
              
              <TabsContent value="table">
                <Card className="border-none shadow-xl overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                  <CardHeader className="bg-gradient-to-b from-blue-50 to-white border-b pb-4">
                    <CardTitle className="text-lg flex items-center">
                      <Activity className="mr-2 h-5 w-5 text-blue-600" />
                      Activity Table
                    </CardTitle>
                    <CardDescription>
                      Showing {filteredActivities.length} of {driverActivity.length} activities
                    </CardDescription>
                  </CardHeader>
                  <div className="overflow-x-auto">
                    {filteredActivities.length > 0 ? (
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-y border-slate-200">
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">Driver</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">Action</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">Time</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredActivities.map((activity, index) => (
                            <tr key={index} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center">
                                  <Avatar className="h-8 w-8 mr-3">
                                    <AvatarFallback className="bg-slate-100 text-slate-700">
                                      {getInitials(activity.driverName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium text-slate-900">{activity.driverName}</div>
                                    <div className="text-xs text-slate-500">ID: {activity.driverId}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Badge className={`
                                  ${activity.action === 'create' ? 'bg-green-100 text-green-800 border-green-300' : ''}
                                  ${activity.action === 'update' ? 'bg-amber-100 text-amber-800 border-amber-300' : ''}
                                  ${activity.action === 'view' ? 'bg-blue-100 text-blue-800 border-blue-300' : ''}
                                  ${activity.action === 'login' ? 'bg-purple-100 text-purple-800 border-purple-300' : ''}
                                  ${activity.action === 'logout' ? 'bg-slate-100 text-slate-800 border-slate-300' : ''}
                                  ${activity.action === 'delete' ? 'bg-red-100 text-red-800 border-red-300' : ''}
                                `}>
                                  <div className="flex items-center gap-1">
                                    {getActivityIcon(activity.action)}
                                    <span className="capitalize">{activity.action}</span>
                                  </div>
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-slate-900">{formatDate(activity.timestamp)}</div>
                                <div className="text-xs text-slate-500">{getRelativeTime(activity.timestamp)}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-slate-700">
                                  {getActivityText(activity.action, activity.details, activity.jobDetails)}
                                  
                                  {/* Show specific job IDs for job-related activities with detailed changes */}
                                  {(activity.action === 'create' || activity.action === 'update') && activity.jobDetails && activity.jobDetails.length > 0 && (
                                    <div className="mt-1 text-xs text-slate-500">
                                      {activity.action === 'create' ? (
                                        <>Job IDs (in preference order): {activity.jobDetails.join(', ')}</>
                                      ) : (
                                        <>
                                          {(() => {
                                            const prevActivity = findPreviousActivity(activity);
                                            const prevJobDetails = prevActivity?.jobDetails || [];
                                            const { added, removed } = compareJobArrays(activity.jobDetails, prevJobDetails);
                                            
                                            return (
                                              <div className="space-y-0.5">
                                                {added.length > 0 && (
                                                  <div>Added jobs: <span className="text-green-600">{added.join(', ')}</span></div>
                                                )}
                                                {removed.length > 0 && (
                                                  <div>Removed jobs: <span className="text-red-600">{removed.join(', ')}</span></div>
                                                )}
                                                <div>Current order: {activity.jobDetails.join(', ')}</div>
                                              </div>
                                            );
                                          })()}
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Activity className="h-12 w-12 text-slate-300 mb-3" />
                        <h3 className="text-lg font-medium text-slate-900 mb-1">No activities found</h3>
                        <p className="text-slate-500 max-w-sm text-center">
                          Try adjusting your search or filters to find activities.
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>
              
              <TabsContent value="timeline">
                <Card className="border-none shadow-xl overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-indigo-500 to-indigo-600"></div>
                  <CardHeader className="bg-gradient-to-b from-indigo-50 to-white border-b pb-4">
                    <CardTitle className="text-lg flex items-center">
                      <Clock className="mr-2 h-5 w-5 text-indigo-600" />
                      Activity Timeline
                    </CardTitle>
                    <CardDescription>
                      Chronological view of system activities
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {filteredActivities.length > 0 ? (
                      <div className="space-y-8">
                        {groupDates.map((dateString, dateIndex) => {
                          const activities = groupedActivities[dateString].filter(activity => {
                            // Apply search term filter
                            if (searchTerm && !activity.driverName.toLowerCase().includes(searchTerm.toLowerCase()) && 
                                !activity.driverId.toLowerCase().includes(searchTerm.toLowerCase())) {
                              return false;
                            }
                            
                            // Apply action type filter
                            if (actionFilter !== 'all' && activity.action !== actionFilter) {
                              return false;
                            }
                            
                            return true;
                          });
                          
                          // Skip date if no activities match filters
                          if (activities.length === 0) return null;
                          
                          return (
                            <div key={dateIndex} className="relative">
                              <div className="sticky top-0 z-10 bg-white py-2">
                                <h3 className="text-md font-medium text-slate-900 flex items-center">
                                  <Calendar className="h-4 w-4 mr-2 text-slate-500" />
                                  {new Date(dateString).toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                </h3>
                              </div>
                              
                              <div className="mt-2 space-y-4">
                                {activities.map((activity, activityIndex) => (
                                  <div key={activityIndex} className="ml-6 relative">
                                    {/* Timeline connector */}
                                    <div className="absolute top-0 -bottom-4 left-[-24px] w-px bg-slate-200"></div>
                                    
                                    {/* Timeline dot */}
                                    <div className={`absolute top-1 left-[-30px] h-6 w-6 rounded-full flex items-center justify-center 
                                      ${activity.action === 'create' ? 'bg-green-100' : ''}
                                      ${activity.action === 'update' ? 'bg-amber-100' : ''}
                                      ${activity.action === 'view' ? 'bg-blue-100' : ''}
                                      ${activity.action === 'login' ? 'bg-purple-100' : ''}
                                      ${activity.action === 'logout' ? 'bg-slate-100' : ''}
                                      ${activity.action === 'delete' ? 'bg-red-100' : ''}
                                    `}>
                                      {getActivityIcon(activity.action)}
                                    </div>
                                    
                                    {/* Activity content */}
                                    <div className="bg-white border border-slate-100 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                                      <div className="flex justify-between items-start">
                                        <div className="flex items-center">
                                          <Avatar className="h-8 w-8 mr-3">
                                            <AvatarFallback className="bg-slate-100 text-slate-700">
                                              {getInitials(activity.driverName)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div>
                                            <div className="font-medium text-slate-900">{activity.driverName}</div>
                                            <div className="text-xs text-slate-500">ID: {activity.driverId}</div>
                                          </div>
                                        </div>
                                        <div className="text-sm text-slate-500">
                                          {new Date(activity.timestamp).toLocaleTimeString('en-US', { 
                                            hour: 'numeric', 
                                            minute: '2-digit', 
                                            hour12: true 
                                          })}
                                        </div>
                                      </div>
                                      <div className="mt-2 text-slate-700">
                                        {getDetailedActivityDescription(activity)}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Clock className="h-12 w-12 text-slate-300 mb-3" />
                        <h3 className="text-lg font-medium text-slate-900 mb-1">No timeline activities</h3>
                        <p className="text-slate-500 max-w-sm text-center">
                          Try adjusting your search or filters to find activities.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
      
      {/* Mountain-themed Footer */}
      <footer className="mt-auto">
        {/* Mountain-inspired top border */}
        <div className="h-4 bg-gradient-to-r from-blue-700 to-indigo-800"></div>
        
        <div className="bg-gradient-to-b from-indigo-900 to-slate-900 text-white py-6 relative overflow-hidden">
          {/* Mountain silhouette in footer */}
          <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="absolute bottom-0">
              <path fill="#ffffff" fillOpacity="1" d="M0,96L120,128L240,96L360,192L480,128L600,160L720,32L840,96L960,256L1080,224L1200,96L1320,128L1440,32L1440,320L1320,320L1200,320L1080,320L960,320L840,320L720,320L600,320L480,320L360,320L240,320L120,320L0,320Z"></path>
            </svg>
          </div>
          
          <div className="container mx-auto px-4 text-center relative z-10">
            <p className="text-sm font-medium text-white/90 mb-0 max-w-none">
              © {new Date().getFullYear()} Job Selection System | All Rights Reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}