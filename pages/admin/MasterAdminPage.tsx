import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart, 
  Building2, 
  CheckCircle2, 
  ClipboardCheck, 
  Globe, 
  Info, 
  Home, 
  Settings, 
  Shield, 
  ShieldAlert, 
  User, 
  Users, 
  XCircle
} from 'lucide-react';
import useDriverStore from '@/store/driverStore';
import { useToast } from '@/hooks/use-toast';

export default function MasterAdminPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  
  const {
    companies,
    sites,
    registrationRequests,
    getSystemMetrics,
    updateRegistrationRequest,
    addCompany,
    addSite,
    updateCompany,
    updateSite
  } = useDriverStore();
  
  // System metrics
  const metrics = getSystemMetrics();
  
  // Check if user is authorized as master admin
  useEffect(() => {
    const isMasterAdmin = localStorage.getItem('isMasterAdmin') === 'true';
    const adminCompanyId = localStorage.getItem('adminCompanyId');
    const adminSiteId = localStorage.getItem('adminSiteId');
    
    // Only allow access if user is master admin (UPS JACFL)
    // This implements a double security check to ensure only JACFL users with the master password can access
    if (!isMasterAdmin || adminCompanyId !== 'UPS' || adminSiteId !== 'JACFL') {
      // Prevent unauthorized access by immediately redirecting
      navigate('/admin-dashboard');
      toast({
        title: "Access Denied",
        description: "This secure area requires master administrative privileges.",
        variant: "destructive"
      });
      return;
    }
    
    // If both checks pass, allow access to the master admin page
    setIsMasterAdmin(true);
  }, [navigate, toast]);
  
  // Approve registration request
  const handleApproveRequest = (requestId: string) => {
    const request = registrationRequests.find(req => req.id === requestId);
    if (!request) return;
    
    // Update request status
    updateRegistrationRequest(requestId, { status: 'approved' });
    
    // Create new company - use clean company ID based on name
    const newCompanyId = addCompany({
      name: request.companyName,
      isFree: false,
      settings: {
        usesSeniorityForAssignment: true,
        usesVCStatus: true,
        airportCertificationRequired: true,
        maxDrivers: 100,
        maxJobs: 50,
        maxSites: 3
      }
    });
    
    // Create initial site using information from the request
    addSite({
      id: request.siteCode,
      name: request.siteName,
      companyId: newCompanyId,
      address: request.siteAddress
    });
    
    // Create default admin account for the new company
    // For UPS sites: username 'admin', password 'ups123'
    // For non-UPS companies: username 'admin', password 'admin'
    const defaultAdminUsername = 'admin';
    const defaultAdminPassword = newCompanyId === 'UPS' ? 'ups123' : 'admin';
    
    // Add admin credentials to the store
    useDriverStore.setState(state => ({
      adminCredentials: [
        ...state.adminCredentials,
        { 
          username: defaultAdminUsername, 
          passwordHash: hashPassword(defaultAdminPassword), 
          companyId: newCompanyId, 
          siteId: request.siteCode,
          isSiteAdmin: true 
        }
      ]
    }));
    
    toast({
      title: "Request Approved",
      description: `${request.companyName} has been approved and set up successfully.`,
    });
  };
  
  // State for denial reason
  const [denialReason, setDenialReason] = useState('');
  const [isDenying, setIsDenying] = useState(false);
  const [requestToReject, setRequestToReject] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'companyName' | 'requestDate'>('requestDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Handle starting the deny process
  const startDenyRequest = (requestId: string) => {
    setRequestToReject(requestId);
    setIsDenying(true);
    setDenialReason('');
  };
  
  // Handle deny registration request
  const handleDenyRequest = () => {
    if (!requestToReject) return;
    
    const request = registrationRequests.find(req => req.id === requestToReject);
    if (!request) return;
    
    // Update request status with denial reason
    updateRegistrationRequest(requestToReject, { 
      status: 'denied',
      denialReason: denialReason || 'Request denied by administrator' 
    });
    
    toast({
      title: "Request Denied",
      description: `${request.companyName}'s registration request has been denied.`,
    });
    
    // Reset states
    setIsDenying(false);
    setRequestToReject(null);
    setDenialReason('');
  };
  
  // Handle cancel deny
  const handleCancelDeny = () => {
    setIsDenying(false);
    setRequestToReject(null);
    setDenialReason('');
  };
  
  // Sort registration requests
  const sortedRequests = useMemo(() => {
    return [...registrationRequests]
      .filter(req => req.status === 'pending')
      .sort((a, b) => {
        if (sortField === 'companyName') {
          return sortOrder === 'asc' 
            ? a.companyName.localeCompare(b.companyName)
            : b.companyName.localeCompare(a.companyName);
        } else {
          const dateA = new Date(a.requestDate).getTime();
          const dateB = new Date(b.requestDate).getTime();
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        }
      });
  }, [registrationRequests, sortField, sortOrder]);
  
  // Toggle sort order
  const toggleSort = (field: 'companyName' | 'requestDate') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };
  
  // Toggle company active status
  const handleToggleCompanyStatus = (companyId: string, isActive: boolean) => {
    updateCompany(companyId, { isActive });
    
    // Also update all sites for this company
    const companySites = sites.filter(site => site.companyId === companyId);
    companySites.forEach(site => {
      updateSite(site.id, { isActive });
    });
    
    toast({
      title: isActive ? "Company Activated" : "Company Deactivated",
      description: `Company status has been updated successfully.`,
    });
  };
  
  // Toggle site active status
  const handleToggleSiteStatus = (siteId: string, isActive: boolean) => {
    updateSite(siteId, { isActive });
    
    toast({
      title: isActive ? "Site Activated" : "Site Deactivated",
      description: `Site status has been updated successfully.`,
    });
  };
  
  if (!isMasterAdmin) {
    return <div className="p-8 text-center">Checking authorization...</div>;
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-900 via-blue-900 to-indigo-900 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Master Admin Panel</h1>
          <p className="text-blue-200">System-wide management and configuration</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-red-900/30 text-red-100 border-red-500/30 px-3 py-1">
            <ShieldAlert className="h-4 w-4 mr-1" />
            Master Administrator
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin-dashboard')}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 bg-white/10 border border-white/20">
          <TabsTrigger value="overview" className="flex items-center gap-1 text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">
            <BarChart className="h-4 w-4" />
            System Overview
          </TabsTrigger>
          <TabsTrigger value="registrations" className="flex items-center gap-1 text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">
            <ClipboardCheck className="h-4 w-4" />
            Registration Requests
          </TabsTrigger>
          <TabsTrigger value="companies" className="flex items-center gap-1 text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">
            <Building2 className="h-4 w-4" />
            Companies & Sites
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1 text-white data-[state=active]:bg-white/20 data-[state=active]:text-white">
            <Settings className="h-4 w-4" />
            System Settings
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard 
              title="Companies" 
              value={metrics.activeCompanies} 
              total={metrics.totalCompanies}
              icon={<Building2 className="h-5 w-5 text-blue-400" />} 
              className="bg-blue-600/30 text-blue-100 border-blue-400/30"
            />
            <MetricCard 
              title="Sites" 
              value={metrics.activeSites} 
              total={metrics.totalSites}
              icon={<Home className="h-5 w-5 text-emerald-400" />} 
              className="bg-emerald-600/30 text-emerald-100 border-emerald-400/30"
            />
            <MetricCard 
              title="Drivers" 
              value={metrics.totalDrivers} 
              icon={<Users className="h-5 w-5 text-purple-400" />} 
              className="bg-purple-600/30 text-purple-100 border-purple-400/30"
            />
            <MetricCard 
              title="Jobs" 
              value={metrics.totalJobs} 
              icon={<ClipboardCheck className="h-5 w-5 text-amber-400" />} 
              className="bg-amber-600/30 text-amber-100 border-amber-400/30"
            />
          </div>
          
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="h-5 w-5 text-blue-300 mr-2" />
                System Metrics
              </CardTitle>
              <CardDescription className="text-blue-200">Current system usage and activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-900/40 rounded-lg p-3 border border-blue-500/30">
                  <p className="text-sm font-medium text-blue-300 mb-1">Total Requests</p>
                  <p className="text-xl font-bold text-blue-100">{registrationRequests.length}</p>
                </div>
                <div className="bg-amber-900/40 rounded-lg p-3 border border-amber-500/30">
                  <p className="text-sm font-medium text-amber-300 mb-1">Pending Requests</p>
                  <p className="text-xl font-bold text-amber-100">{registrationRequests.filter(r => r.status === 'pending').length}</p>
                </div>
                <div className="bg-green-900/40 rounded-lg p-3 border border-green-500/30">
                  <p className="text-sm font-medium text-green-300 mb-1">Approved Sites</p>
                  <p className="text-xl font-bold text-green-100">{registrationRequests.filter(r => r.status === 'approved').length}</p>
                </div>
                <div className="bg-red-900/40 rounded-lg p-3 border border-red-500/30">
                  <p className="text-sm font-medium text-red-300 mb-1">Rejected Requests</p>
                  <p className="text-xl font-bold text-red-100">{registrationRequests.filter(r => r.status === 'denied').length}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-md font-medium text-white">System Activity</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 rounded-md bg-white/10">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-400 mr-2"></div>
                      <span className="text-blue-100">Activity (last 24 hours):</span>
                    </div>
                    <span className="font-semibold text-blue-100">{metrics.activityLast24Hours} actions</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-md bg-white/10">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-indigo-400 mr-2"></div>
                      <span className="text-indigo-100">Activity (last 7 days):</span>
                    </div>
                    <span className="font-semibold text-indigo-100">{metrics.activityLast7Days} actions</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-md bg-white/10">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
                      <span className="text-green-100">Active companies:</span>
                    </div>
                    <span className="font-semibold text-green-100">{metrics.activeCompanies} of {metrics.totalCompanies}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-md bg-white/10">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-amber-400 mr-2"></div>
                      <span className="text-amber-100">Active sites:</span>
                    </div>
                    <span className="font-semibold text-amber-100">{metrics.activeSites} of {metrics.totalSites}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white shadow-lg">
            <CardHeader>
              <CardTitle>Company Usage</CardTitle>
              <CardDescription className="text-blue-200">Active companies and their resource usage</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left font-medium p-2 text-blue-200">Company</th>
                      <th className="text-center font-medium p-2 text-blue-200">Status</th>
                      <th className="text-center font-medium p-2 text-blue-200">Sites</th>
                      <th className="text-center font-medium p-2 text-blue-200">Drivers</th>
                      <th className="text-center font-medium p-2 text-blue-200">Jobs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.companyMetrics.map(company => (
                      <tr key={company.companyId} className="border-b border-white/10">
                        <td className="p-2 text-white">{company.companyName}</td>
                        <td className="text-center p-2">
                          {company.isActive ? (
                            <Badge variant="outline" className="bg-green-900/40 text-green-100 border-green-500/30">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-900/40 text-amber-100 border-amber-500/30">
                              Inactive
                            </Badge>
                          )}
                        </td>
                        <td className="text-center p-2 text-white">{company.sites}</td>
                        <td className="text-center p-2 text-white">{company.drivers}</td>
                        <td className="text-center p-2 text-white">{company.jobs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Registration Requests Tab */}
        <TabsContent value="registrations" className="space-y-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-white/20">
          {/* Denial Reason Dialog */}
          <Dialog open={isDenying} onOpenChange={(open) => {
            setIsDenying(open);
            if (!open) {
              setRequestToReject(null);
              setDenialReason('');
            }
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center text-red-700">
                  <XCircle className="mr-2 h-5 w-5" />
                  Deny Registration Request
                </DialogTitle>
                <DialogDescription>
                  Please provide a reason for denying this registration request. This information will be stored for record-keeping purposes.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="denialReason" className="block mb-2 text-sm font-medium">
                  Reason for Denial
                </Label>
                <Textarea
                  id="denialReason"
                  value={denialReason}
                  onChange={(e) => setDenialReason(e.target.value)}
                  placeholder="Enter reason for denying this request"
                  rows={3}
                  className="w-full"
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={handleCancelDeny}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDenyRequest}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Confirm Denial
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Pending Registration Requests</span>
                <div className="flex items-center space-x-2 text-sm">
                  <button 
                    onClick={() => toggleSort('companyName')}
                    className={`flex items-center px-2 py-1 rounded hover:bg-muted ${sortField === 'companyName' ? 'font-bold' : ''}`}
                  >
                    Company
                    {sortField === 'companyName' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </button>
                  <button 
                    onClick={() => toggleSort('requestDate')}
                    className={`flex items-center px-2 py-1 rounded hover:bg-muted ${sortField === 'requestDate' ? 'font-bold' : ''}`}
                  >
                    Date
                    {sortField === 'requestDate' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </button>
                </div>
              </CardTitle>
              <CardDescription>Companies requesting access to the system</CardDescription>
            </CardHeader>
            <CardContent>
              {registrationRequests.filter(req => req.status === 'pending').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending registration requests
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedRequests.map(request => (
                      <Card key={request.id} className={
                        selectedRequestId === request.id
                          ? "border-2 border-primary"
                          : "border border-border"
                      }>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <CardTitle>{request.companyName}</CardTitle>
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>
                          </div>
                          <CardDescription>
                            Request ID: {request.id} • Submitted: {new Date(request.requestDate).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium">Contact Information</h4>
                              <p className="text-sm text-muted-foreground"><span className="font-medium">Name:</span> {request.contactName}</p>
                              <p className="text-sm text-muted-foreground"><span className="font-medium">Email:</span> {request.contactEmail}</p>
                              <p className="text-sm text-muted-foreground"><span className="font-medium">Phone:</span> {request.contactPhone}</p>
                              <div className="mt-2 p-2 bg-blue-50 rounded-md">
                                <h4 className="text-sm font-medium text-blue-700">Submission Date</h4>
                                <p className="text-sm text-blue-600">
                                  {new Date(request.requestDate).toLocaleDateString()} at {new Date(request.requestDate).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium">Site Information</h4>
                              <p className="text-sm text-muted-foreground"><span className="font-medium">Site Code:</span> {request.siteCode}</p>
                              <p className="text-sm text-muted-foreground"><span className="font-medium">Site Name:</span> {request.siteName}</p>
                              <p className="text-sm text-muted-foreground"><span className="font-medium">Address:</span> {request.siteAddress}</p>
                              <div className="mt-2">
                                <h4 className="text-sm font-medium">Notes</h4>
                                <p className="text-sm text-muted-foreground italic">{request.notes || "No notes provided"}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => startDenyRequest(request.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Deny
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleApproveRequest(request.id)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Processed Requests</CardTitle>
              <CardDescription>Previously approved or denied requests</CardDescription>
            </CardHeader>
            <CardContent>
              {registrationRequests.filter(req => req.status !== 'pending').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No processed registration requests
                </div>
              ) : (
                <div className="overflow-auto max-h-[400px]">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr>
                        <th className="text-left font-medium p-2">Company</th>
                        <th className="text-left font-medium p-2">Site</th>
                        <th className="text-left font-medium p-2">Contact</th>
                        <th className="text-center font-medium p-2">Status</th>
                        <th className="text-left font-medium p-2">Details</th>
                        <th className="text-right font-medium p-2">Date Processed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrationRequests
                        .filter(req => req.status !== 'pending')
                        .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())
                        .map(request => (
                          <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="p-2">
                              <div className="font-medium">{request.companyName}</div>
                              <div className="text-xs text-muted-foreground">{request.id}</div>
                            </td>
                            <td className="p-2">
                              <div>{request.siteName}</div>
                              <div className="text-xs text-muted-foreground">{request.siteCode}</div>
                            </td>
                            <td className="p-2">
                              <div>{request.contactName}</div>
                              <div className="text-xs text-muted-foreground">{request.contactEmail}</div>
                            </td>
                            <td className="text-center p-2">
                              {request.status === 'approved' ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Approved
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Denied
                                </Badge>
                              )}
                            </td>
                            <td className="p-2">
                              {request.status === 'denied' && request.denialReason ? (
                                <div className="text-sm text-red-600 italic">
                                  "{request.denialReason}"
                                </div>
                              ) : (
                                <div className="text-xs text-muted-foreground">
                                  {request.notes ? (request.notes.substring(0, 50) + (request.notes.length > 50 ? '...' : '')) : 'No details'}
                                </div>
                              )}
                            </td>
                            <td className="text-right p-2">
                              <div>{new Date(request.requestDate).toLocaleDateString()}</div>
                              <div className="text-xs text-muted-foreground">{new Date(request.requestDate).toLocaleTimeString()}</div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Companies Tab */}
        <TabsContent value="companies" className="space-y-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-white/20">
          <Card>
            <CardHeader>
              <CardTitle>Companies</CardTitle>
              <CardDescription>Manage registered companies and their sites</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {companies.map(company => (
                  <Card 
                    key={company.id}
                    className={`
                      ${selectedCompanyId === company.id ? 'border-2 border-primary' : 'border border-border'}
                      ${!company.isActive ? 'bg-muted/30' : ''}
                    `}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CardTitle>{company.name}</CardTitle>
                          {company.isFree && (
                            <Badge className="ml-2 bg-primary/10 text-primary border-primary/20">
                              Free Tier
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={company.isActive} 
                              onCheckedChange={(checked) => handleToggleCompanyStatus(company.id, checked)}
                            />
                            <span className={company.isActive ? "text-green-600" : "text-muted-foreground"}>
                              {company.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <CardDescription>
                        ID: {company.id} • Registered: {new Date(company.registrationDate).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <h4 className="text-sm font-medium mb-2">Sites</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {sites
                          .filter(site => site.companyId === company.id)
                          .map(site => (
                            <Card key={site.id} className={!site.isActive ? 'bg-muted/30' : ''}>
                              <CardContent className="p-3">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h5 className="font-medium">{site.name}</h5>
                                    <p className="text-xs text-muted-foreground">{site.id}</p>
                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{site.address}</p>
                                  </div>
                                  <div className="flex flex-col items-end">
                                    <Switch 
                                      checked={site.isActive} 
                                      onCheckedChange={(checked) => handleToggleSiteStatus(site.id, checked)}
                                      size="sm"
                                    />
                                    <span className={`text-xs ${site.isActive ? "text-green-600" : "text-muted-foreground"}`}>
                                      {site.isActive ? "Active" : "Inactive"}
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <div className="flex items-center space-x-4 text-sm">
                        <div>
                          <span className="font-medium">Max Drivers:</span> {company.settings.maxDrivers}
                        </div>
                        <div>
                          <span className="font-medium">Max Jobs:</span> {company.settings.maxJobs}
                        </div>
                        <div>
                          <span className="font-medium">Max Sites:</span> {company.settings.maxSites}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Manage Settings
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-white/20">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure global system parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Default Rules Template</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-md">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="useSeniority">Use Seniority for Assignment</Label>
                      <Switch id="useSeniority" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="useVCStatus">Use VC Status</Label>
                      <Switch id="useVCStatus" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="airportCert">Require Airport Certification</Label>
                      <Switch id="airportCert" defaultChecked />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="autoAssign">Enable Auto Assignment</Label>
                      <Switch id="autoAssign" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="autoClose">Enable Auto Portal Closure</Label>
                      <Switch id="autoClose" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="allowPrint">Allow Printing</Label>
                      <Switch id="allowPrint" defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">System Limits</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="defaultMaxDrivers">Default Max Drivers</Label>
                      <Input id="defaultMaxDrivers" type="number" defaultValue="100" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="defaultMaxJobs">Default Max Jobs</Label>
                      <Input id="defaultMaxJobs" type="number" defaultValue="50" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="defaultMaxSites">Default Max Sites</Label>
                      <Input id="defaultMaxSites" type="number" defaultValue="5" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button>
                  Save System Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Metric Card Component
function MetricCard({ title, value, total, icon, className }: { title: string, value: number, total?: number, icon: React.ReactNode, className?: string }) {
  return (
    <Card className={`border-none shadow-lg ${className}`}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium mb-1">{title}</p>
            <div className="flex items-baseline">
              <h3 className="text-2xl font-bold">{value}</h3>
              {total !== undefined && (
                <span className="text-sm opacity-80 ml-1">/ {total}</span>
              )}
            </div>
          </div>
          <div className="p-2 bg-white/10 rounded-md">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}