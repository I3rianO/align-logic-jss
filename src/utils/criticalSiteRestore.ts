/**
 * CRITICAL SITE RESTORATION MECHANISM
 * 
 * This is the definitive implementation to ensure UPS JACFL site always exists
 * and can never be deleted, removed, or lost during app updates or resets.
 * 
 * This file contains the absolute highest priority protection for the
 * Master Admin access, which is critical for system administration.
 */

import useDriverStore from '../store/driverStore';

// Import the consistent hash function from utils
import { hashPassword } from './passwordUtils';

/**
 * Hard-coded UPS JACFL site data - this is the authoritative source
 * These values must never be changed as they are tied to the Master Admin
 * functionality of the system
 */
export const CRITICAL_UPS_COMPANY = {
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

export const CRITICAL_JACFL_SITE = {
  id: 'JACFL',
  name: 'Jacksonville, FL',
  companyId: 'UPS',
  address: '123 Main St, Jacksonville, FL 32256',
  isActive: true
};

export const CRITICAL_ADMIN_CREDENTIALS = {
  username: 'admin',
  passwordHash: hashPassword('ups123'),
  companyId: 'UPS',
  siteId: 'JACFL',
  isSiteAdmin: true
};

export const CRITICAL_MASTER_PASSWORD = hashPassword('PBJ0103');

/**
 * Absolutely guarantees UPS JACFL site exists in both Zustand state and localStorage
 * This is the definitive implementation that should be called at multiple points:
 * - At application startup
 * - Before any admin login attempt
 * - Periodically during application runtime
 * - Before any data modification operation that could affect site data
 */
export function guaranteeCriticalSiteIntegrity(forceRefresh = false): boolean {
  console.log('🛡️ CRITICAL: Executing definitive UPS JACFL site integrity check');
  let modified = false;

  try {
    // 1. UPDATE ZUSTAND STATE FIRST
    const state = useDriverStore.getState();
    const updates: Record<string, any> = {};
    
    // Check companies
    let companies = [...(state.companies || [])];
    if (!companies.some(c => c.id === 'UPS')) {
      console.warn('🚨 CRITICAL RESTORATION: UPS company missing from state');
      companies.push(CRITICAL_UPS_COMPANY);
      updates.companies = companies;
      modified = true;
    }
    
    // Check sites
    let sites = [...(state.sites || [])];
    if (!sites.some(s => s.id === 'JACFL' && s.companyId === 'UPS')) {
      console.warn('🚨 CRITICAL RESTORATION: JACFL site missing from state');
      sites.push(CRITICAL_JACFL_SITE);
      updates.sites = sites;
      modified = true;
    } else {
      // Make sure the site is active
      const jacflSiteIndex = sites.findIndex(s => s.id === 'JACFL' && s.companyId === 'UPS');
      if (jacflSiteIndex >= 0 && !sites[jacflSiteIndex].isActive) {
        console.warn('🚨 CRITICAL RESTORATION: JACFL site inactive, forcing active state');
        sites[jacflSiteIndex].isActive = true;
        updates.sites = sites;
        modified = true;
      }
    }
    
    // Check admin credentials
    let adminCredentials = [...(state.adminCredentials || [])];
    if (!adminCredentials.some(a => a.username === 'admin' && a.companyId === 'UPS' && a.siteId === 'JACFL')) {
      console.warn('🚨 CRITICAL RESTORATION: UPS JACFL admin credentials missing from state');
      adminCredentials.push(CRITICAL_ADMIN_CREDENTIALS);
      updates.adminCredentials = adminCredentials;
      modified = true;
    }
    
    // Check master password
    if (state.masterPassword !== CRITICAL_MASTER_PASSWORD) {
      console.warn('🚨 CRITICAL RESTORATION: Master password inconsistent, restoring');
      updates.masterPassword = CRITICAL_MASTER_PASSWORD;
      modified = true;
    }
    
    // Apply all updates to state if needed
    if (Object.keys(updates).length > 0) {
      console.log('🔐 Updating Zustand store with critical UPS JACFL data');
      useDriverStore.setState(updates);
    }
    
    // 2. NOW ENSURE LOCALSTORAGE IS CONSISTENT
    const localStorageKey = 'driver-storage';
    let storageData = localStorage.getItem(localStorageKey);
    
    if (storageData) {
      let storageModified = false;
      const parsedData = JSON.parse(storageData);
      
      // Ensure state object exists
      if (!parsedData.state) {
        parsedData.state = {};
        storageModified = true;
      }
      
      // Check companies
      if (!Array.isArray(parsedData.state.companies)) {
        parsedData.state.companies = [];
        storageModified = true;
      }
      
      if (!parsedData.state.companies.some((c: any) => c && c.id === 'UPS')) {
        parsedData.state.companies.push(CRITICAL_UPS_COMPANY);
        storageModified = true;
      }
      
      // Check sites
      if (!Array.isArray(parsedData.state.sites)) {
        parsedData.state.sites = [];
        storageModified = true;
      }
      
      if (!parsedData.state.sites.some((s: any) => s && s.id === 'JACFL' && s.companyId === 'UPS')) {
        parsedData.state.sites.push(CRITICAL_JACFL_SITE);
        storageModified = true;
      } else {
        // Ensure site is active
        const jacflIndex = parsedData.state.sites.findIndex((s: any) => 
          s && s.id === 'JACFL' && s.companyId === 'UPS');
        if (jacflIndex >= 0 && !parsedData.state.sites[jacflIndex].isActive) {
          parsedData.state.sites[jacflIndex].isActive = true;
          storageModified = true;
        }
      }
      
      // Check admin credentials
      if (!Array.isArray(parsedData.state.adminCredentials)) {
        parsedData.state.adminCredentials = [];
        storageModified = true;
      }
      
      if (!parsedData.state.adminCredentials.some((a: any) => 
        a && a.username === 'admin' && a.companyId === 'UPS' && a.siteId === 'JACFL')) {
        parsedData.state.adminCredentials.push(CRITICAL_ADMIN_CREDENTIALS);
        storageModified = true;
      }
      
      // Check master password
      if (parsedData.state.masterPassword !== CRITICAL_MASTER_PASSWORD) {
        parsedData.state.masterPassword = CRITICAL_MASTER_PASSWORD;
        storageModified = true;
      }
      
      if (storageModified) {
        console.log('🔒 Updating localStorage with critical UPS JACFL data');
        localStorage.setItem(localStorageKey, JSON.stringify(parsedData));
        modified = true;
      }
    } else {
      // Create a new storage if none exists
      console.warn('🚨 CRITICAL RESTORATION: No localStorage data found, creating new storage');
      const basicStorage = {
        state: {
          drivers: [],
          jobs: [],
          preferences: [],
          manualAssignments: [],
          cutoffTime: new Date().toISOString(),
          companies: [CRITICAL_UPS_COMPANY],
          sites: [CRITICAL_JACFL_SITE],
          adminCredentials: [CRITICAL_ADMIN_CREDENTIALS],
          masterPassword: CRITICAL_MASTER_PASSWORD,
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
      modified = true;
    }
    
    // 3. FINALLY, SCHEDULE AN IMMEDIATE VERIFICATION
    setTimeout(() => {
      verifyJACFLSiteExists();
    }, 100);
    
    // If modifications made, force an application reload when instructed
    if (modified && forceRefresh) {
      console.log('🔄 Critical data restored, forcing page reload');
      setTimeout(() => window.location.reload(), 500);
    }
    
    return modified;
  } catch (error) {
    console.error('❌ Critical error during UPS JACFL site restoration:', error);
    
    // Last resort emergency recovery
    try {
      emergencyJACFLRecovery();
    } catch (e) {
      console.error('💥 EMERGENCY RECOVERY FAILED:', e);
    }
    
    return false;
  }
}

/**
 * Verify that JACFL site exists in both Zustand state and localStorage
 * This function should be called periodically to ensure data integrity
 */
export function verifyJACFLSiteExists(): boolean {
  // Check Zustand state
  const state = useDriverStore.getState();
  const upsExists = state.companies.some(c => c.id === 'UPS');
  const jacflExists = state.sites.some(s => s.id === 'JACFL' && s.companyId === 'UPS');
  const adminExists = state.adminCredentials.some(a => 
    a.username === 'admin' && a.companyId === 'UPS' && a.siteId === 'JACFL');
  
  // Check localStorage
  try {
    const localStorageKey = 'driver-storage';
    const storageData = localStorage.getItem(localStorageKey);
    
    if (storageData) {
      const parsedData = JSON.parse(storageData);
      
      const lsUpsExists = parsedData.state?.companies?.some((c: any) => 
        c && c.id === 'UPS');
      const lsJacflExists = parsedData.state?.sites?.some((s: any) => 
        s && s.id === 'JACFL' && s.companyId === 'UPS');
      const lsAdminExists = parsedData.state?.adminCredentials?.some((a: any) => 
        a && a.username === 'admin' && a.companyId === 'UPS' && a.siteId === 'JACFL');
      
      // If any critical data is missing, restore it
      if (!upsExists || !jacflExists || !adminExists || !lsUpsExists || !lsJacflExists || !lsAdminExists) {
        console.warn('🔄 Verification failed - critical data missing, restoring');
        return guaranteeCriticalSiteIntegrity();
      }
      
      console.log('✅ UPS JACFL verification passed');
      return true;
    } else {
      console.warn('🔄 No localStorage data found during verification, restoring');
      return guaranteeCriticalSiteIntegrity();
    }
  } catch (error) {
    console.error('❌ Error during UPS JACFL verification:', error);
    return guaranteeCriticalSiteIntegrity();
  }
}

/**
 * Absolute last resort emergency recovery that bypasses all normal mechanisms
 * This function completely overwrites localStorage with a minimal working state
 * that includes only the critical UPS JACFL site data
 */
export function emergencyJACFLRecovery(): void {
  console.warn('💥 EMERGENCY: Executing last resort recovery for UPS JACFL');
  
  try {
    // Create a minimal working state with only UPS JACFL
    const emergencyStorage = {
      state: {
        drivers: [],
        jobs: [],
        preferences: [],
        manualAssignments: [],
        cutoffTime: new Date().toISOString(),
        companies: [CRITICAL_UPS_COMPANY],
        sites: [CRITICAL_JACFL_SITE],
        adminCredentials: [CRITICAL_ADMIN_CREDENTIALS],
        masterPassword: CRITICAL_MASTER_PASSWORD,
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
    
    // Force write to localStorage
    localStorage.setItem('driver-storage', JSON.stringify(emergencyStorage));
    console.log('🚑 Emergency recovery complete - localStorage reset with UPS JACFL data');
    
    // Force update Zustand state
    useDriverStore.setState({
      companies: [CRITICAL_UPS_COMPANY],
      sites: [CRITICAL_JACFL_SITE],
      adminCredentials: [CRITICAL_ADMIN_CREDENTIALS],
      masterPassword: CRITICAL_MASTER_PASSWORD
    });
    console.log('🚑 Emergency recovery complete - Zustand state reset with UPS JACFL data');
    
    // Force reload the application to ensure all systems use new data
    window.location.reload();
  } catch (error) {
    console.error('💣 CRITICAL FAILURE: Emergency recovery failed:', error);
    alert('Critical system error: Please contact support immediately.');
  }
}