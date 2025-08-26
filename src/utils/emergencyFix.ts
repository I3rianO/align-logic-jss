/**
 * EMERGENCY FIX SCRIPT
 * This script directly manipulates localStorage to ensure UPS > JACFL site exists
 * It runs before any other code in the application
 */

import { hashPassword } from './passwordUtils';

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

export function runEmergencyFix() {
  try {
    console.log('🚨 EMERGENCY FIX: Running UPS JACFL emergency fix');
    
    // Get localStorage data
    const localStorageKey = 'driver-storage';
    const storageData = localStorage.getItem(localStorageKey);
    
    if (storageData) {
      // Parse existing data
      const parsedData = JSON.parse(storageData);
      let modified = false;
      
      // Ensure state object exists
      if (!parsedData.state) {
        parsedData.state = {};
        modified = true;
      }
      
      // Ensure companies array exists with UPS
      if (!Array.isArray(parsedData.state.companies) || !parsedData.state.companies.some((c: any) => c?.id === 'UPS')) {
        parsedData.state.companies = [UPS_COMPANY];
        modified = true;
      }
      
      // Ensure sites array exists with JACFL
      if (!Array.isArray(parsedData.state.sites) || !parsedData.state.sites.some((s: any) => s?.id === 'JACFL' && s?.companyId === 'UPS')) {
        if (!Array.isArray(parsedData.state.sites)) {
          parsedData.state.sites = [];
        }
        parsedData.state.sites.push(JACFL_SITE);
        modified = true;
      }
      
      // Ensure admin credentials exist
      if (!Array.isArray(parsedData.state.adminCredentials) || !parsedData.state.adminCredentials.some((a: any) => a?.username === 'admin' && a?.companyId === 'UPS' && a?.siteId === 'JACFL')) {
        if (!Array.isArray(parsedData.state.adminCredentials)) {
          parsedData.state.adminCredentials = [];
        }
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
        console.log('✅ EMERGENCY FIX: UPS JACFL data has been restored');
        return true;
      }
      
      console.log('✓ EMERGENCY FIX: No changes needed');
      return false;
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
          registrationRequests: [],
          currentCompanyId: 'UPS',
          currentSiteId: 'JACFL',
        },
        version: 0
      };
      
      localStorage.setItem(localStorageKey, JSON.stringify(newStorage));
      console.log('🆕 EMERGENCY FIX: Created new storage with UPS JACFL data');
      return true;
    }
  } catch (error) {
    console.error('❌ EMERGENCY FIX ERROR:', error);
    return false;
  }
}

// Run the emergency fix immediately when this file is loaded
runEmergencyFix();