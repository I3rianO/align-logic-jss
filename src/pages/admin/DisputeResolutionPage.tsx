import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import useDriverStore from "@/store/driverStore";
import { ChevronLeft, AlertTriangle, CheckCircle2, MessageSquare, Users, Clock, Search, HelpCircle, InfoIcon, Mountain, ClipboardList } from "lucide-react";

export default function DisputeResolutionPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>("");
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  const {
    drivers,
    jobs,
    getUniqueDriverPreferences,
    calculateJobAssignments,
    cleanPreferences,
  } = useDriverStore();

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
    
    // Load data
    cleanPreferences();
    
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [cleanPreferences, navigate, toast]);

  // Get job assignments and preferences
  const jobAssignments = calculateJobAssignments();
  const uniquePreferences = getUniqueDriverPreferences();
  
  // Find disputes (jobs with multiple drivers selecting them as first choice)
  const disputes = (() => {
    const firstChoiceMap: Record<string, string[]> = {};
    
    // Group preferences by first choice
    uniquePreferences.forEach(pref => {
      if (pref.preferences.length > 0) {
        const firstChoice = pref.preferences[0];
        if (!firstChoiceMap[firstChoice]) {
          firstChoiceMap[firstChoice] = [];
        }
        firstChoiceMap[firstChoice].push(pref.driverId);
      }
    });
    
    // Convert to array of dispute objects
    return Object.entries(firstChoiceMap)
      .filter(([_, driverIds]) => driverIds.length > 1)
      .map(([jobId, driverIds]) => {
        // Find the job details
        const job = jobs.find(j => j.jobId === jobId);
        
        // Find the assigned driver if any
        const assignment = jobAssignments.find(a => a.jobId === jobId);
        
        // Get driver details with seniority info
        const disputingDrivers = driverIds.map(driverId => {
          const driver = drivers.find(d => d.employeeId === driverId);
          return {
            driverId,
            name: driver?.name || "Unknown",
            seniorityNumber: driver?.seniorityNumber || 9999,
            isAssigned: assignment?.driverId === driverId
          };
        }).sort((a, b) => a.seniorityNumber - b.seniorityNumber); // Sort by seniority
        
        return {
          jobId,
          jobDetails: job,
          disputingDrivers,
          isResolved: !!assignment,
          assignedDriverId: assignment?.driverId || null,
          resolutionNote: ""
        };
      });
  })();
  
  // Filter disputes by search term
  const filteredDisputes = disputes.filter(dispute => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Search by job ID
    if (dispute.jobId.toLowerCase().includes(searchLower)) return true;
    
    // Search by driver name
    if (dispute.disputingDrivers.some(driver => 
      driver.name.toLowerCase().includes(searchLower)
    )) return true;
    
    // Search by job details
    if (dispute.jobDetails && (
      (dispute.jobDetails.startTime || "").toLowerCase().includes(searchLower) ||
      (dispute.jobDetails.weekDays || "").toLowerCase().includes(searchLower) ||
      (dispute.jobDetails.isAirport && "airport".includes(searchLower))
    )) return true;
    
    return false;
  });
  
  // Get the selected dispute details
  const activeDispute = selectedDispute ? 
    disputes.find(d => d.jobId === selectedDispute) : null;
  
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
  
  // Handle resolution submission
  const handleResolveDispute = () => {
    if (!activeDispute) return;
    
    // In a real implementation, this would update the assignments in the database
    toast({
      title: "Dispute Resolution Recorded",
      description: `Job ${activeDispute.jobId} dispute has been resolved and notes saved.`,
    });
    
    // Reset form
    setResolutionNotes("");
    setSelectedDispute(null);
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
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Dispute Resolution</h1>
                <p className="text-blue-200">Manage and resolve job selection conflicts</p>
              </div>
            </div>

            <Button 
              variant="outline"
              size="sm" 
              onClick={() => setShowExplanation(!showExplanation)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              How It Works
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <Card className="bg-white/10 border-none text-white backdrop-blur-sm shadow-lg overflow-hidden">
              <CardContent className="p-4">
                <h3 className="font-medium text-sm text-blue-100 mb-1">Total Disputes</h3>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold">{disputes.length}</div>
                  <div className="text-sm font-medium text-blue-100">Job Conflicts</div>
                </div>
                <Progress 
                  value={disputes.length > 0 ? 100 : 0} 
                  className="h-2 mt-2 bg-white/20" 
                  indicatorClassName="bg-amber-400" 
                />
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-none text-white backdrop-blur-sm shadow-lg overflow-hidden">
              <CardContent className="p-4">
                <h3 className="font-medium text-sm text-blue-100 mb-1">Resolved Disputes</h3>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold">
                    {disputes.filter(d => d.isResolved).length}
                  </div>
                  <div className="text-sm font-medium text-blue-100">
                    {Math.round((disputes.filter(d => d.isResolved).length / Math.max(disputes.length, 1)) * 100)}% Complete
                  </div>
                </div>
                <Progress 
                  value={disputes.length > 0 ? (disputes.filter(d => d.isResolved).length / disputes.length) * 100 : 0} 
                  className="h-2 mt-2 bg-white/20" 
                  indicatorClassName="bg-emerald-400" 
                />
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-none text-white backdrop-blur-sm shadow-lg overflow-hidden">
              <CardContent className="p-4">
                <h3 className="font-medium text-sm text-blue-100 mb-1">Pending Disputes</h3>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold">
                    {disputes.filter(d => !d.isResolved).length}
                  </div>
                  <div className="text-sm font-medium text-blue-100">
                    Requiring Attention
                  </div>
                </div>
                <Progress 
                  value={disputes.length > 0 ? (disputes.filter(d => !d.isResolved).length / disputes.length) * 100 : 0} 
                  className="h-2 mt-2 bg-white/20" 
                  indicatorClassName="bg-red-400" 
                />
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Smooth gradient transition */}
        <div className="h-16 bg-gradient-to-b from-indigo-900 to-white relative z-10"></div>
      </div>

      <div className="container py-6 flex-grow">
        {showExplanation && (
          <Card className="mb-6 border-none shadow-xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-indigo-600"></div>
            <CardHeader className="bg-gradient-to-b from-indigo-50 to-white border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center text-indigo-900">
                  <InfoIcon className="h-5 w-5 mr-2 text-indigo-600" />
                  Understanding Job Selection Disputes
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowExplanation(false)}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 text-slate-700">
                <p>
                  <strong>What is a job selection dispute?</strong> A dispute occurs when multiple drivers select the same job as their first choice. According to seniority rules, the driver with the higher seniority (lower seniority number) is automatically assigned the job.
                </p>
                <p>
                  <strong>How disputes are resolved:</strong> The system automatically resolves disputes based on seniority. The driver with the highest seniority (lowest number) is given priority for their first choice job.
                </p>
                <p>
                  <strong>Your role as admin:</strong> You can review these automatic assignments and provide explanatory notes for the drivers who didn't receive their first choice. These notes can be helpful when drivers ask why they didn't receive their preferred job.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-12 w-12 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin mb-4"></div>
            <h3 className="text-lg font-medium">Loading Disputes</h3>
            <p className="text-muted-foreground">Finding job selection conflicts...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Side - Dispute List */}
            <div className="md:col-span-1">
              <Card className="shadow-xl border-none overflow-hidden h-full">
                <div className="h-1 bg-gradient-to-r from-indigo-500 to-indigo-600"></div>
                <CardHeader className="bg-gradient-to-b from-indigo-50 to-white border-b pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <MessageSquare className="h-5 w-5 mr-2 text-indigo-600" />
                    Selection Disputes
                  </CardTitle>
                  <CardDescription>
                    Jobs with multiple drivers selecting them as first choice
                  </CardDescription>
                  
                  <div className="mt-2 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input 
                      placeholder="Search disputes..."
                      className="pl-9 bg-white"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </CardHeader>
                
                <CardContent className="p-0 overflow-auto" style={{ maxHeight: '500px' }}>
                  {filteredDisputes.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {filteredDisputes.map((dispute) => (
                        <div
                          key={dispute.jobId}
                          className={`w-full text-left p-4 hover:bg-slate-50 transition-colors focus:outline-none cursor-pointer ${selectedDispute === dispute.jobId ? 'bg-indigo-50' : ''}`}
                          onClick={() => setSelectedDispute(dispute.jobId)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-slate-900">
                                Job {dispute.jobId}
                              </h3>
                              <p className="text-sm text-slate-500">
                                {dispute.disputingDrivers.length} drivers competing
                              </p>
                            </div>
                            {dispute.isResolved ? (
                              <Badge className="bg-green-100 text-green-800 border-green-300">
                                Resolved
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                                Pending
                              </Badge>
                            )}
                          </div>
                          
                          <div className="mt-2 text-sm">
                            <p className="text-indigo-700">
                              {dispute.jobDetails?.startTime} • {dispute.jobDetails?.weekDays}
                              {dispute.jobDetails?.isAirport && " • Airport"}
                            </p>
                          </div>
                          
                          <div className="mt-2 flex -space-x-2">
                            {dispute.disputingDrivers.slice(0, 3).map((driver, index) => (
                              <Avatar key={index} className="h-6 w-6 border-2 border-white">
                                <AvatarFallback className={`text-[10px] ${driver.isAssigned ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                                  {getInitials(driver.name)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {dispute.disputingDrivers.length > 3 && (
                              <div className="h-6 w-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] text-slate-700">
                                +{dispute.disputingDrivers.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                      {searchTerm ? (
                        <>
                          <Search className="h-10 w-10 text-slate-300 mb-2" />
                          <h3 className="text-lg font-medium text-slate-900">No matching disputes</h3>
                          <p className="text-sm text-slate-500 mt-1">
                            Try a different search term
                          </p>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-10 w-10 text-emerald-300 mb-2" />
                          <h3 className="text-lg font-medium text-slate-900">No disputes found</h3>
                          <p className="text-sm text-slate-500 mt-1">
                            All jobs have been assigned without conflicts
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Right Side - Dispute Details */}
            <div className="md:col-span-2">
              <Card className="shadow-xl border-none overflow-hidden h-full">
                <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                <CardHeader className="bg-gradient-to-b from-blue-50 to-white border-b pb-4">
                  <CardTitle className="flex items-center text-lg">
                    {activeDispute ? (
                      <>
                        <ClipboardList className="h-5 w-5 mr-2 text-blue-600" />
                        Job {activeDispute.jobId} Dispute
                      </>
                    ) : (
                      <>
                        <InfoIcon className="h-5 w-5 mr-2 text-blue-600" />
                        Dispute Details
                      </>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {activeDispute ? (
                      <>
                        {activeDispute.jobDetails?.startTime} • {activeDispute.jobDetails?.weekDays}
                        {activeDispute.jobDetails?.isAirport && " • Airport Job"}
                      </>
                    ) : (
                      "Select a dispute from the list to view details"
                    )}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="p-6">
                  {!activeDispute ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <MessageSquare className="h-16 w-16 text-slate-200 mb-4" />
                      <h3 className="text-xl font-medium text-slate-800">No Dispute Selected</h3>
                      <p className="text-slate-500 max-w-sm mt-2">
                        Select a dispute from the list on the left to view details and manage resolution.
                      </p>
                    </div>
                  ) : (
                    <div>
                      {/* Dispute Status */}
                      {activeDispute.isResolved ? (
                        <Alert className="mb-6 bg-green-50 border border-green-200 text-green-800">
                          <CheckCircle2 className="h-4 w-4" />
                          <AlertTitle>Dispute Resolved</AlertTitle>
                          <AlertDescription>
                            This job has been assigned based on seniority rules.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Alert className="mb-6 bg-amber-50 border border-amber-200 text-amber-800">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Pending Resolution</AlertTitle>
                          <AlertDescription>
                            This job has multiple drivers competing for it as their first choice.
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {/* Competing Drivers Table */}
                      <div className="mb-6">
                        <h3 className="text-lg font-medium text-slate-900 mb-3">Competing Drivers</h3>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-y border-slate-200">
                                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">Driver</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">Seniority #</th>
                                <th className="text-left px-4 py-3 text-sm font-medium text-slate-500">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {activeDispute.disputingDrivers.map((driver, index) => (
                                <tr 
                                  key={index} 
                                  className={`${driver.isAssigned ? 'bg-indigo-50/50' : ''}`}
                                >
                                  <td className="px-4 py-3">
                                    <div className="flex items-center">
                                      <Avatar className="h-8 w-8 mr-3">
                                        <AvatarFallback className={driver.isAssigned ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}>
                                          {getInitials(driver.name)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="font-medium text-slate-900">{driver.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-slate-700">{driver.seniorityNumber}</td>
                                  <td className="px-4 py-3">
                                    {driver.isAssigned ? (
                                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                                        Assigned
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-slate-100 text-slate-800 border-slate-300">
                                        Not Assigned
                                      </Badge>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      {/* Explanation Notes */}
                      <div className="mb-6">
                        <Label htmlFor="resolution-notes" className="text-lg font-medium text-slate-900 mb-3 block">
                          Resolution Notes
                        </Label>
                        <p className="text-sm text-slate-500 mb-2">
                          Add notes to explain the resolution. These will be available to both drivers and administrators.
                        </p>
                        <textarea
                          id="resolution-notes"
                          className="w-full min-h-[120px] p-3 border border-slate-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          placeholder="Explain the resolution process (e.g., 'Assigned to John Smith due to seniority rule 5.2. Driver has 15 years of service with the company.')..."
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                        />
                      </div>
                      
                      {/* Resolution History */}
                      {activeDispute.isResolved && (
                        <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                          <h3 className="text-base font-medium text-slate-900 mb-2 flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-slate-500" />
                            Resolution History
                          </h3>
                          <p className="text-sm text-slate-600">
                            This job was automatically assigned to{" "}
                            <span className="font-medium">
                              {activeDispute.disputingDrivers.find(d => d.isAssigned)?.name}
                            </span>{" "}
                            based on seniority rules. They have the highest seniority among all drivers who selected this job as their first choice.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                
                {activeDispute && (
                  <CardFooter className="bg-slate-50 border-t p-4 flex justify-end gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedDispute(null)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleResolveDispute}
                      disabled={!resolutionNotes.trim()}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      {activeDispute.isResolved ? "Update Notes" : "Resolve Dispute"}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </div>
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