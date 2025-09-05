/**
 * DIRECT UPS JACFL RESTORATION
 * 
 * This is a direct, brute force restoration of UPS JACFL site data
 * that bypasses all normal application flow, security checks, and filters.
 * 
 * This is the last line of defense to ensure the critical UPS JACFL site
 * is always available in the application, regardless of any other code.
 */

// Import the consistent hash function from utils
import { hashPassword } from './passwordUtils';

/**
 * Hard-coded UPS JACFL site data - absolute source of truth
 */
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

/**
 * Direct force modification of localStorage to ensure UPS JACFL exists
 * This bypasses all application logic and directly manipulates storage
 */
export function forceRestoreUPSJACFL(): boolean {
  console.log('⚡ DIRECT UPS JACFL RESTORATION: Beginning direct localStorage manipulation');
  
  try {
    // Get current storage
    const localStorageKey = 'driver-storage';
    const storageData = localStorage.getItem(localStorageKey);
    let modified = false;
    
    if (storageData) {
      const parsedData = JSON.parse(storageData);
      
      // Ensure state exists
      if (!parsedData.state) {
        parsedData.state = {};
        modified = true;
      }
      
      // Ensure companies array exists and UPS is in it
      if (!Array.isArray(parsedData.state.companies)) {
        parsedData.state.companies = [UPS_COMPANY];
        modified = true;
      } else if (!parsedData.state.companies.some((c: any) => c && c.id === 'UPS')) {
        parsedData.state.companies.push(UPS_COMPANY);
        modified = true;
      } else {
        // Make sure UPS is active
        const upsIndex = parsedData.state.companies.findIndex((c: any) => c && c.id === 'UPS');
        if (upsIndex >= 0 && !parsedData.state.companies[upsIndex].isActive) {
          parsedData.state.companies[upsIndex].isActive = true;
          modified = true;
        }
      }
      
      // Ensure sites array exists and JACFL is in it
      if (!Array.isArray(parsedData.state.sites)) {
        parsedData.state.sites = [JACFL_SITE];
        modified = true;
      } else if (!parsedData.state.sites.some((s: any) => s && s.id === 'JACFL' && s.companyId === 'UPS')) {
        parsedData.state.sites.push(JACFL_SITE);
        modified = true;
      } else {
        // Make sure JACFL is active
        const jacflIndex = parsedData.state.sites.findIndex((s: any) => 
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
      } else if (!parsedData.state.adminCredentials.some((a: any) => 
        a && a.username === 'admin' && a.companyId === 'UPS' && a.siteId === 'JACFL')) {
        parsedData.state.adminCredentials.push(ADMIN_CREDENTIALS);
        modified = true;
      }
      
      // Ensure master password exists
      if (parsedData.state.masterPassword !== MASTER_PASSWORD) {
        parsedData.state.masterPassword = MASTER_PASSWORD;
        modified = true;
      }
      
      if (modified) {
        console.log('💾 Direct storage manipulation: Updating localStorage with UPS JACFL data');
        localStorage.setItem(localStorageKey, JSON.stringify(parsedData));
        
        // Return true if modifications were made
        return true;
      }
    } else {
      // No existing storage - create minimal storage with UPS JACFL
      console.log('🆕 No localStorage found, creating new with UPS JACFL data');
      const basicStorage = {
        state: {
          drivers: [],
          jobs: [],
          preferences: [],
          manualAssignments: [],
          cutoffTime: new Date().toISOString(),
          companies: [UPS_COMPANY],
          sites: [JACFL_SITE],
          adminCredentials: [ADMIN_CREDENTIALS],
          masterPassword: MASTER_PASSWORD,
          isCutoffActive: false,
          isAutoCutoffScheduled: false,
          disableAutoAssignments: false,
          useSeniorityAssignment: false,
          systemSettings: {
            allowDriverPrinting: true,
            darkMode: false,
            isPortalOpen: true,
            scheduledClosureEnabled: false,
            scheduledClosureDate: '',
            scheduledClosureTime: '',
            companyId: 'UPS',
            siteId: 'JACFL',
          },
          driverCredentials: [],
          driverActivity: [],
          registrationRequests: [],
          currentCompanyId: 'UPS',
          currentSiteId: 'JACFL',
        },
        version: 0
      };
      
      localStorage.setItem(localStorageKey, JSON.stringify(basicStorage));
      return true;
    }
    
    // No changes needed
    return false;
  } catch (error) {
    console.error('💥 Error during direct UPS JACFL restoration:', error);
    
    // Create completely new storage as last resort
    try {
      const emergencyStorage = {
        state: {
          companies: [UPS_COMPANY],
          sites: [JACFL_SITE],
          adminCredentials: [ADMIN_CREDENTIALS],
          masterPassword: MASTER_PASSWORD,
          drivers: [],
          jobs: []
        },
        version: 0
      };
      
      localStorage.setItem('driver-storage', JSON.stringify(emergencyStorage));
      console.log('🚨 Emergency direct storage restoration complete');
      return true;
    } catch (e) {
      console.error('💔 Critical failure during emergency restoration:', e);
      return false;
    }
  }
}

/**
 * Ensure the UPS and JACFL site are immediately available on application load
 * Call this function at the earliest possible moment in the application lifecycle
 */
export function immediateUPSJACFLVerification(): void {
  console.log('🔍 Immediate UPS JACFL verification running');
  
  // 1. Check if UPS JACFL already exists in localStorage
  try {
    const storageData = localStorage.getItem('driver-storage');
    if (storageData) {
      const parsed = JSON.parse(storageData);
      
      // Quick verification of critical data
      const hasUPS = parsed.state?.companies?.some((c: any) => c && c.id === 'UPS' && c.isActive);
      const hasJACFL = parsed.state?.sites?.some((s: any) => s && s.id === 'JACFL' && s.companyId === 'UPS' && s.isActive);
      const hasAdmin = parsed.state?.adminCredentials?.some((a: any) => a && a.username === 'admin' && a.companyId === 'UPS' && a.siteId === 'JACFL');
      
      if (hasUPS && hasJACFL && hasAdmin) {
        console.log('✅ Immediate verification passed - UPS JACFL exists');
        return;
      }
    }
    
    // If we got here, something is missing - force restore
    console.warn('⚠️ Immediate verification failed - forcing UPS JACFL restoration');
    const restored = forceRestoreUPSJACFL();
    
    if (restored) {
      console.log('🔄 UPS JACFL directly restored, reloading application');
      window.location.reload();
    }
  } catch (error) {
    console.error('💥 Error during immediate verification:', error);
    forceRestoreUPSJACFL();
    window.location.reload();
  }
}