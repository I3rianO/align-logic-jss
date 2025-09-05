import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Lock, Key, Shield, Mountain, Users, Home } from 'lucide-react';
import useDriverStore from '@/store/driverStore';
import { hashPassword } from '@/utils/passwordUtils';
import JssLogo from '@/components/logo/JssLogo';
import { useIsMobile } from '@/hooks/use-mobile';
import { guaranteeCriticalSiteIntegrity } from '@/utils/criticalSiteRestore';

function AdminPortalPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [companyId, setCompanyId] = useState('');
  const [siteId, setSiteId] = useState('');
  const { 
    validateAdminCredentials, 
    validateMasterPassword, 
    companies, 
    sites,
    getSitesByCompany,
    adminCredentials,
    masterPassword
  } = useDriverStore();
  
  // Critical: Run UPS JACFL guarantee on component mount
  useEffect(() => {
    // Ensure UPS JACFL site exists when admin portal loads
    const restored = guaranteeCriticalSiteIntegrity();
    if (restored) {
      // Force re-render if data was restored
      console.log('🔄 Critical data restored, refreshing component');
      // Small delay to allow state to update
      setTimeout(() => {
        forceUpdate();
      }, 100);
    }
  }, []);
  
  // Force re-render helper
  const [, updateState] = useState({});
  const forceUpdate = useCallback(() => updateState({}), []);
  
  // Load companies for the dropdown - ensure uniqueness of company names
  // Create a unique set of company objects to prevent duplicates
  const uniqueCompanies = new Map();
  companies.filter(company => company.isActive).forEach(company => {
    // Use company name as key to ensure we only have one entry per company name in dropdown
    if (!uniqueCompanies.has(company.name)) {
      uniqueCompanies.set(company.name, company);
    }
  });
  const activeCompanies = Array.from(uniqueCompanies.values());
  
  // Load sites for the selected company
  // DIRECT ACCESS to ensure JACFL appears regardless of filtering
  const availableSites = companyId === 'UPS' ?
    sites.filter(site => site.companyId === 'UPS' && site.isActive) :
    getSitesByCompany(companyId).filter(site => site.isActive);
    
  // Debug check - verify JACFL site is available when UPS is selected
  useEffect(() => {
    if (companyId === 'UPS') {
      const hasJACFL = availableSites.some(site => site.id === 'JACFL');
      if (!hasJACFL) {
        console.warn('🚨 CRITICAL: JACFL site not found in available sites, forcing restoration');
        const restored = guaranteeCriticalSiteIntegrity();
        if (restored) {
          forceUpdate();
        }
      }
    }
  }, [companyId, availableSites]);
  
  // When company changes, reset site if not valid for that company
  useEffect(() => {
    if (companyId && siteId) {
      const siteExists = availableSites.some(site => site.id === siteId);
      if (!siteExists) {
        setSiteId('');
      }
    }
    
    // CRITICAL: Special handling for UPS company to ensure JACFL is always available
    if (companyId === 'UPS') {
      const hasJACFL = availableSites.some(site => site.id === 'JACFL');
      if (!hasJACFL) {
        console.warn('🚨 CRITICAL: UPS selected but JACFL site is missing! Forcing restoration...');
        // Directly force JACFL site into the sites array if it's not there
        const restored = guaranteeCriticalSiteIntegrity(true);
        // Schedule a page reload after a delay
        setTimeout(() => window.location.reload(), 500);
      }
    }
  }, [companyId, availableSites]);
  
  // Pre-select company if only one is available
  useEffect(() => {
    if (activeCompanies.length === 1 && !companyId) {
      setCompanyId(activeCompanies[0].id);
    }
  }, [activeCompanies, companyId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // CRITICAL: Ensure UPS JACFL exists before login attempt
    guaranteeCriticalSiteIntegrity();
    
    if (!companyId || !siteId) {
      toast({
        title: "Selection Required",
        description: "Please select a company and site",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    // Check if the selected site is active for the selected company
    const selectedSite = sites.find(site => site.id === siteId && site.companyId === companyId);
    const selectedCompany = companies.find(company => company.id === companyId);
    
    if (!selectedSite?.isActive || !selectedCompany?.isActive) {
      toast({
        title: "Access Denied",
        description: "This site is currently inactive or unavailable",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    // Add a slight delay to simulate authentication
    setTimeout(() => {
      // Check if this is the master admin (UPS JACFL + exact master password PBJ0103)
      // Note: We use strict password check with === to ensure only the exact master password works
      // Absolute tenant isolation requirement - only UPS JACFL can access master admin with the exact password
      const isMasterAdmin = (
        companyId === 'UPS' && 
        siteId === 'JACFL' && 
        password === 'PBJ0103'
      );
      
      // If master password was tried but on wrong company/site, just show generic failure
      // This prevents users from discovering that the password is special
      // Important security feature: never reveal that PBJ0103 is special in any way
      const attemptedMasterPassword = password === 'PBJ0103';
      if (attemptedMasterPassword && (companyId !== 'UPS' || siteId !== 'JACFL')) {
        toast({
          title: "Authentication Failed",
          description: "Invalid username or password",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // For regular admin login, we need to check the specific credentials for this site
      // Find the admin credentials for this specific site
      const adminCred = adminCredentials.find(admin => 
        admin.username === username && 
        admin.companyId === companyId && 
        admin.siteId === siteId
      );
      
      // Check if password is valid for this specific site
      const isValidAdmin = adminCred && 
        (adminCred.passwordHash === hashPassword(password) || validateMasterPassword(password));
      
      if (isMasterAdmin || isValidAdmin) {
        // Check if this is a Master Admin access attempt
        if (isMasterAdmin) {
          // Store special master admin status
          localStorage.setItem('adminLoggedIn', 'true');
          localStorage.setItem('isMasterAdmin', 'true');
          localStorage.setItem('adminCompanyId', companyId);
          localStorage.setItem('adminSiteId', siteId);
          
          toast({
            title: "Master Admin Access Granted",
            description: "Welcome to the system administration portal",
          });
          
          // Redirect to master admin dashboard
          navigate('/admin-dashboard');
          return;
        }
        
        // For regular admin, check if company and site match credentials
        if (adminCred && adminCred.companyId === companyId && adminCred.siteId === siteId) {
          // Store authentication and company/site info
          localStorage.setItem('adminLoggedIn', 'true');
          localStorage.setItem('isMasterAdmin', 'false');
          localStorage.setItem('adminCompanyId', companyId);
          localStorage.setItem('adminSiteId', siteId);
          
          toast({
            title: "Admin Access Granted",
            description: "Welcome to the admin dashboard",
          });
          
          // Redirect to admin dashboard
          navigate('/admin-dashboard');
        } else {
          // The admin credentials don't match the selected company/site
          toast({
            title: "Site Access Denied",
            description: "You don't have access to the selected site",
            variant: "destructive",
          });
          setIsLoading(false);
        }
      } else {
        // Show error toast
        toast({
          title: "Authentication Failed",
          description: "Invalid username or password",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Mountain-inspired background with enhanced visuals */}
      <div className="relative flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-slate-800 via-blue-900 to-indigo-900 px-4 py-10">
        {/* Mountain imagery with better visual integration */}
        <div className="absolute inset-0 z-0">
          {/* Mountain background image */}
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
        
        {/* Login card with improved integration with mountain theme */}
        <div className="w-full max-w-md z-10 relative">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-2 bg-white/10 backdrop-blur-sm rounded-lg mb-4">
              <Mountain className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Admin Portal
            </h1>
            <p className="text-blue-200 text-lg">
              Job Selection System Administration
            </p>
          </div>
          
          <Card className="shadow-2xl border-none">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            <CardHeader className="bg-gradient-to-b from-blue-50 to-white">
              <CardTitle className="flex items-center justify-center">
                <Shield className="mr-2 h-5 w-5 text-blue-600" />
                Secure Login Required
              </CardTitle>
              <CardDescription className="text-center">
                Please enter your admin credentials to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit}>
                <div className="grid gap-6">
                  {/* Company selection */}
                  <div className="grid gap-3">
                    <Label htmlFor="company">Company</Label>
                    <div className="relative">
                      <select
                        id="company"
                        className="w-full h-10 pl-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={companyId}
                        onChange={(e) => setCompanyId(e.target.value)}
                        required
                      >
                        <option value="">Select Company</option>
                        {activeCompanies.map(company => (
                          <option key={company.id} value={company.id}>{company.name}</option>
                        ))}
                      </select>
                      <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  
                  {/* Site selection */}
                  <div className="grid gap-3">
                    <Label htmlFor="site">Site</Label>
                    <div className="relative">
                      <select
                        id="site"
                        className="w-full h-10 pl-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={siteId}
                        onChange={(e) => setSiteId(e.target.value)}
                        disabled={!companyId}
                        required
                      >
                        <option value="">Select Site</option>
                        {/* Direct JACFL injection - always ensure it's present for UPS */}
                        {companyId === 'UPS' && !availableSites.some(site => site.id === 'JACFL') && (
                          <option key="JACFL" value="JACFL">Jacksonville, FL</option>
                        )}
                        {availableSites.map(site => (
                          <option key={site.id} value={site.id}>{site.name}</option>
                        ))}
                      </select>
                      <Home className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                
                  {/* Username field */}
                  <div className="grid gap-3">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <Input
                        id="username"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="pl-10"
                        required
                        autoFocus
                      />
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  
                  {/* Password field */}
                  <div className="grid gap-3">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                      <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
                <div className="mt-8">
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                        Authenticating...
                      </span>
                    ) : (
                      "Access Admin Dashboard"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col text-xs text-center text-muted-foreground pt-0">
              <p>Secure access for administrators only.</p>
              <p className="mt-1">Unauthorized access attempts will be logged.</p>
            </CardFooter>
          </Card>
          
          <Button
            variant="ghost"
            className="mt-6 mx-auto block text-blue-200 hover:text-white"
            onClick={() => navigate('/')}
          >
            Return to Driver Portal
          </Button>
        </div>

        {/* Wave Divider at bottom of page */}
        <div className="absolute bottom-0 left-0 right-0 h-16">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-full">
            <path fill="#ffffff" fillOpacity="0.1" d="M0,128L48,117.3C96,107,192,85,288,80C384,75,480,85,576,112C672,139,768,181,864,181.3C960,181,1056,139,1152,128C1248,117,1344,139,1392,149.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </div>

      {/* Mountain-themed footer */}
      <footer className="bg-gradient-to-b from-slate-900 to-slate-950 text-white py-4 relative overflow-hidden">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-medium text-white/70">
            © {new Date().getFullYear()} Job Selection System | All Rights Reserved
          </p>
        </div>
      </footer>
    </div>
  );
}

export default AdminPortalPage;