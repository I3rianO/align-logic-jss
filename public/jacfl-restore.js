/**
 * CRITICAL EMERGENCY RESTORE SCRIPT
 * This script runs immediately in the browser, before any React code loads
 * to ensure UPS JACFL site is available in localStorage
 */
(function() {
  console.log('🚨 EMERGENCY INLINE SCRIPT: Running pre-load UPS JACFL restoration');
  
  try {
    // Simple hash function for passwords
    function hashPassword(password) {
      let hash = 0;
      for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return hash.toString(16);
    }
    
    // Hard-coded critical data
    const UPS_COMPANY = {
      id: 'UPS',
      name: 'UPS',
      isActive: true,
      isFree: true,
      registrationDate: new Date().toISOString(),
      settings: {
        usesSeniorityForAssignment: true,
        usesVCStatus: true,
        airportCertificationRequired: true,
        maxDrivers: 1000,
        maxJobs: 500,
        maxSites: 10
      }
    };
    
    const JACFL_SITE = {
      id: 'JACFL',
      name: 'Jacksonville, FL',
      companyId: 'UPS',
      address: '123 Main St, Jacksonville, FL 32256',
      isActive: true
    };
    
    const ADMIN_CREDENTIALS = {
      username: 'admin',
      passwordHash: hashPassword('ups123'),
      companyId: 'UPS',
      siteId: 'JACFL',
      isSiteAdmin: true
    };
    
    const MASTER_PASSWORD = hashPassword('PBJ0103');
    
    // Get localStorage data
    const localStorageKey = 'driver-storage';
    const storageData = localStorage.getItem(localStorageKey);
    let modified = false;
    
    if (storageData) {
      // Parse existing data
      const parsedData = JSON.parse(storageData);
      
      // Ensure state object exists
      if (!parsedData.state) {
        parsedData.state = {};
        modified = true;
      }
      
      // Ensure companies array exists with UPS
      if (!Array.isArray(parsedData.state.companies)) {
        parsedData.state.companies = [UPS_COMPANY];
        modified = true;
      } else if (!parsedData.state.companies.some((c) => c && c.id === 'UPS')) {
        parsedData.state.companies.push(UPS_COMPANY);
        modified = true;
      } else {
        // Make sure UPS is active
        const upsIndex = parsedData.state.companies.findIndex((c) => c && c.id === 'UPS');
        if (upsIndex >= 0 && !parsedData.state.companies[upsIndex].isActive) {
          parsedData.state.companies[upsIndex].isActive = true;
          modified = true;
        }
      }
      
      // Ensure sites array exists with JACFL
      if (!Array.isArray(parsedData.state.sites)) {
        parsedData.state.sites = [JACFL_SITE];
        modified = true;
      } else if (!parsedData.state.sites.some((s) => s && s.id === 'JACFL' && s.companyId === 'UPS')) {
        parsedData.state.sites.push(JACFL_SITE);
        modified = true;
      } else {
        // Make sure JACFL is active
        const jacflIndex = parsedData.state.sites.findIndex((s) => 
          s && s.id === 'JACFL' && s.companyId === 'UPS');
        if (jacflIndex >= 0 && !parsedData.state.sites[jacflIndex].isActive) {
          parsedData.state.sites[jacflIndex].isActive = true;
          modified = true;
        }
      }
      
      // Ensure admin credentials exist
      if (!Array.isArray(parsedData.state.adminCredentials)) {
        parsedData.state.adminCredentials = [ADMIN_CREDENTIALS];
        modified = true;
      } else if (!parsedData.state.adminCredentials.some((a) => 
        a && a.username === 'admin' && a.companyId === 'UPS' && a.siteId === 'JACFL')) {
        parsedData.state.adminCredentials.push(ADMIN_CREDENTIALS);
        modified = true;
      }
      
      // Ensure master password exists
      if (parsedData.state.masterPassword !== MASTER_PASSWORD) {
        parsedData.state.masterPassword = MASTER_PASSWORD;
        modified = true;
      }
      
      // Write back to localStorage if modified
      if (modified) {
        localStorage.setItem(localStorageKey, JSON.stringify(parsedData));
        console.log('✅ EMERGENCY INLINE SCRIPT: UPS JACFL data has been restored');
      }
    } else {
      // No existing storage - create new one
      const newStorage = {
        state: {
          companies: [UPS_COMPANY],
          sites: [JACFL_SITE],
          adminCredentials: [ADMIN_CREDENTIALS],
          masterPassword: MASTER_PASSWORD,
          drivers: [],
          jobs: [],
          preferences: [],
          manualAssignments: [],
          cutoffTime: new Date().toISOString(),
          isCutoffActive: false,
          isAutoCutoffScheduled: false,
          disableAutoAssignments: false,
          useSeniorityAssignment: false,
          systemSettings: {
            allowDriverPrinting: true,
            darkMode: false,
            isPortalOpen: true,
            companyId: 'UPS',
            siteId: 'JACFL',
          },
          driverCredentials: [],
          driverActivity: [],
          registrationRequests: []
        },
        version: 0
      };
      
      localStorage.setItem(localStorageKey, JSON.stringify(newStorage));
      console.log('🆕 EMERGENCY INLINE SCRIPT: Created new storage with UPS JACFL data');
    }
    
    console.log('🏁 EMERGENCY INLINE SCRIPT: Completed successfully');
  } catch (error) {
    console.error('❌ EMERGENCY INLINE SCRIPT ERROR:', error);
  }
})();