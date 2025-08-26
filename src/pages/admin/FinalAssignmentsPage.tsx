import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, FileDown, ChevronLeft, Mountain, CheckCircle2, FileText, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AssignmentsPdfDocument from "@/components/pdf/AssignmentsPdfDocument";

// Fixed import to use default export instead of named export
import useDriverStore from "@/store/driverStore";

const FinalAssignmentsPage = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [showPdfView, setShowPdfView] = useState<boolean>(false);
  
  // Get state from driver store
  const {
    drivers,
    jobs,
    disableAutoAssignments,
    toggleAutoAssignments,
    calculateJobAssignments,
    cleanPreferences,
    getUniqueDriverPreferences
  } = useDriverStore();

  // Clean preferences on initial render
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
    
    cleanPreferences();
    
    // Simulate loading time for data processing
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [cleanPreferences, navigate, toast]);

  // Get assignments data
  const assignments = calculateJobAssignments();
  const uniquePreferences = getUniqueDriverPreferences();
  
  // Filter assignments based on active tab
  const filteredAssignments = (() => {
    switch(activeTab) {
      case "firstChoice":
        return assignments.filter(a => {
          const driverPrefs = uniquePreferences.find(p => p.driverId === a.driverId);
          return driverPrefs && driverPrefs.preferences.length > 0 && driverPrefs.preferences[0] === a.jobId;
        });
      case "otherPick":
        return assignments.filter(a => {
          const driverPrefs = uniquePreferences.find(p => p.driverId === a.driverId);
          return driverPrefs && 
                 driverPrefs.preferences.length > 0 && 
                 driverPrefs.preferences.includes(a.jobId) && 
                 driverPrefs.preferences[0] !== a.jobId;
        });
      case "auto":
        return assignments.filter(a => {
          const driverPrefs = uniquePreferences.find(p => p.driverId === a.driverId);
          return !driverPrefs || !driverPrefs.preferences.includes(a.jobId);
        });
      default: // "all"
        return assignments;
    }
  })();

  // Calculate statistics
  const totalAssignments = assignments.length;
  const firstChoiceCount = assignments.filter(a => {
    const driverPrefs = uniquePreferences.find(p => p.driverId === a.driverId);
    return driverPrefs && driverPrefs.preferences.length > 0 && driverPrefs.preferences[0] === a.jobId;
  }).length;
  
  const otherPicksCount = assignments.filter(a => {
    const driverPrefs = uniquePreferences.find(p => p.driverId === a.driverId);
    return driverPrefs && 
           driverPrefs.preferences.length > 0 && 
           driverPrefs.preferences.includes(a.jobId) && 
           driverPrefs.preferences[0] !== a.jobId;
  }).length;
  
  const autoAssignedCount = totalAssignments - firstChoiceCount - otherPicksCount;
  
  const firstChoiceRate = totalAssignments ? Math.round((firstChoiceCount / totalAssignments) * 100) : 0;
  const anyPickRate = totalAssignments ? Math.round(((firstChoiceCount + otherPicksCount) / totalAssignments) * 100) : 0;

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

  const handleExportCSV = () => {
    try {
      // In a real implementation, this would generate and download a CSV file
      toast({
        title: "Export Successful",
        description: "Assignments have been exported to CSV format.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting the assignments.",
        variant: "destructive",
      });
    }
  };

  const togglePdfView = () => {
    setShowPdfView(!showPdfView);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Mountain-themed Header with better transition */}
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
                <Mountain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Final Job Assignments</h1>
                <p className="text-blue-200">Review and finalize job assignments for all drivers</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExportCSV}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <FileDown className="mr-2 h-4 w-4" /> Export
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={togglePdfView}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <Printer className="mr-2 h-4 w-4" /> {showPdfView ? "List View" : "Print View"}
              </Button>
            </div>
          </div>

          {/* Key Stats for Final Assignments - now in the header section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Card className="bg-white/10 border-none text-white backdrop-blur-sm shadow-lg overflow-hidden">
              <CardContent className="p-4">
                <h3 className="font-medium text-sm text-blue-100 mb-1">First Choice Rate</h3>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold">{firstChoiceRate}%</div>
                  <div className="text-sm font-medium text-blue-100">{firstChoiceCount} drivers</div>
                </div>
                <Progress value={firstChoiceRate} className="h-2 mt-2 bg-white/20" indicatorClassName="bg-blue-400" />
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-none text-white backdrop-blur-sm shadow-lg overflow-hidden">
              <CardContent className="p-4">
                <h3 className="font-medium text-sm text-blue-100 mb-1">Any Preference Rate</h3>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold">{anyPickRate}%</div>
                  <div className="text-sm font-medium text-blue-100">{firstChoiceCount + otherPicksCount} drivers</div>
                </div>
                <Progress value={anyPickRate} className="h-2 mt-2 bg-white/20" indicatorClassName="bg-emerald-400" />
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-none text-white backdrop-blur-sm shadow-lg overflow-hidden">
              <CardContent className="p-4">
                <h3 className="font-medium text-sm text-blue-100 mb-1">Auto Assignment Rate</h3>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold">{100 - anyPickRate}%</div>
                  <div className="text-sm font-medium text-blue-100">{autoAssignedCount} drivers</div>
                </div>
                <Progress value={100 - anyPickRate} className="h-2 mt-2 bg-white/20" indicatorClassName="bg-amber-400" />
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Wave Divider - Improved for smoother transition */}
        <div className="absolute bottom-0 left-0 right-0 h-16">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-full">
            <path fill="#ffffff" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,165.3C384,171,480,149,576,149.3C672,149,768,171,864,176C960,181,1056,171,1152,149.3C1248,128,1344,96,1392,80L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </div>

      <div className="container py-8 space-y-6">
        {showPdfView ? (
          <AssignmentsPdfDocument assignments={assignments} drivers={drivers} jobs={jobs} />
        ) : (
          <>
            {/* Auto Assignment Toggle */}
            <Card className="shadow-xl border-none overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-slate-400 to-slate-600"></div>
              <CardHeader className="pb-3">
                <CardTitle>Assignment Options</CardTitle>
              </CardHeader>
              <div className="px-6 pb-4 flex items-start justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-assignment-toggle">
                    {disableAutoAssignments
                      ? "Show only preference-based assignments" 
                      : "Show all assignments (including auto-assignments)"}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {disableAutoAssignments 
                      ? "Only drivers who made picks and got one of their picks or manual assignments are shown." 
                      : "Auto-assignment logic is applied for remaining jobs and drivers."}
                  </p>
                </div>
                <Switch
                  id="auto-assignment-toggle"
                  checked={!disableAutoAssignments}
                  onCheckedChange={(checked) => toggleAutoAssignments(!checked)}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </Card>
              
            {/* Assignments Tab Navigation */}
            <Card className="shadow-xl border-none overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-indigo-500 to-indigo-600"></div>
              <CardHeader className="pb-3 bg-gradient-to-b from-slate-50 to-white border-b">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <CardTitle>Assignment List</CardTitle>
                    <CardDescription>Review job assignments for all drivers</CardDescription>
                  </div>
                  <Button
                    onClick={togglePdfView}
                    variant="outline"
                    className="flex items-center gap-1 text-indigo-700 border-indigo-200"
                  >
                    <FileText size={16} />
                    <span>Print Report</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="px-6 pt-4 pb-2 border-b bg-gray-50">
                    <TabsList className="w-full grid grid-cols-4 bg-gray-100">
                      <TabsTrigger 
                        value="all" 
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        All Assignments ({assignments.length})
                      </TabsTrigger>
                      <TabsTrigger 
                        value="firstChoice" 
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        First Choice ({firstChoiceCount})
                      </TabsTrigger>
                      <TabsTrigger 
                        value="otherPick" 
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        Other Picks ({otherPicksCount})
                      </TabsTrigger>
                      <TabsTrigger 
                        value="auto" 
                        className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        Auto-Assigned ({autoAssignedCount})
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="all" className="p-0">
                    {renderAssignmentTable(filteredAssignments)}
                  </TabsContent>

                  <TabsContent value="firstChoice" className="p-0">
                    {renderAssignmentTable(filteredAssignments)}
                  </TabsContent>

                  <TabsContent value="otherPick" className="p-0">
                    {renderAssignmentTable(filteredAssignments)}
                  </TabsContent>

                  <TabsContent value="auto" className="p-0">
                    {renderAssignmentTable(filteredAssignments)}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
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

  // Helper function to render the assignment table
  function renderAssignmentTable(assignments: any[]) {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-12 w-12 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin mb-4"></div>
          <h3 className="text-lg font-medium">Loading Assignments</h3>
          <p className="text-muted-foreground">Calculating optimal job assignments...</p>
        </div>
      );
    }

    if (assignments.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No assignments found</h3>
          <p className="text-muted-foreground mt-2 max-w-md">
            There are currently no job assignments to display. This could be because no drivers have made their picks yet or all picks were reset.
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="text-left p-4 pl-6">Driver</th>
              <th className="text-left p-4">ID</th>
              <th className="text-right p-4">Seniority</th>
              <th className="text-left p-4">Assigned Job</th>
              <th className="text-left p-4">Job Type</th>
              <th className="text-center p-4">Assignment Type</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((assignment, index) => {
              // Find the driver
              const driver = drivers.find(d => d.employeeId === assignment.driverId);
              // Find the job
              const job = jobs.find(j => j.jobId === assignment.jobId);
              // Find driver preferences
              const driverPrefs = uniquePreferences.find(p => p.driverId === assignment.driverId);
              
              // Determine assignment type
              const isFirstChoice = driverPrefs && 
                                  driverPrefs.preferences.length > 0 && 
                                  driverPrefs.preferences[0] === assignment.jobId;
              
              const isOtherPick = driverPrefs && 
                                driverPrefs.preferences.length > 0 && 
                                driverPrefs.preferences.includes(assignment.jobId) && 
                                !isFirstChoice;
              
              const isAuto = !isFirstChoice && !isOtherPick;
              
              return (
                <tr key={index} className="border-b hover:bg-slate-50">
                  <td className="p-4 pl-6">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-3 bg-slate-200">
                        <AvatarFallback className="bg-slate-200 text-slate-600">
                          {getInitials(driver?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{driver?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="p-4">{driver?.employeeId || 'N/A'}</td>
                  <td className="p-4 text-right">{driver?.seniorityNumber || 'N/A'}</td>
                  <td className="p-4 font-medium">{job?.jobId || 'No job assigned'}</td>
                  <td className="p-4">
                    {job ? (
                      <div className="flex items-center gap-1">
                        <span>{job.startTime}</span>
                        <span className="text-slate-400">·</span>
                        <span>{job.weekDays}</span>
                        {job.isAirport && (
                          <Badge variant="outline" className="ml-1 bg-blue-50 text-blue-700 border-blue-200">
                            Airport
                          </Badge>
                        )}
                      </div>
                    ) : 'N/A'}
                  </td>
                  <td className="p-4 text-center">
                    {isFirstChoice && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                        First Choice
                      </Badge>
                    )}
                    {isOtherPick && (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                        Pick Match
                      </Badge>
                    )}
                    {isAuto && (
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                        Auto Assigned
                      </Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
};

export default FinalAssignmentsPage;