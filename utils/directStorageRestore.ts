/**
 * DIRECT STORAGE RESTORATION
 * 
 * This utility directly manipulates localStorage to ensure that UPS JACFL site
 * is always available, bypassing all normal mechanisms. This is a failsafe of last resort.
 */

import { hashPassword } from './passwordUtils';

export function directlyRestoreJACFL(): boolean {
  try {
    console.log('🔒 Running direct localStorage UPS JACFL restoration');
    
    // Check if the driver storage exists
    const localStorageKey = 'driver-storage';
    let storageData = localStorage.getItem(localStorageKey);
    
    if (!storageData) {
      console.warn('Driver storage not found, creating basic storage');
      // Create a basic storage structure with UPS and JACFL
      const basicStorage = {
        state: {
          drivers: [],
          jobs: [],
          preferences: [],
          manualAssignments: [],
          cutoffTime: new Date().toISOString(),
          companies: [{
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
          }],
          sites: [{
            id: 'JACFL',
            name: 'Jacksonville, FL',
            companyId: 'UPS',
            address: '123 Main St, Jacksonville, FL 32256',
            isActive: true
          }],
          adminCredentials: [{
            username: 'admin',
            passwordHash: hashPassword('ups123'),
            companyId: 'UPS',
            siteId: 'JACFL',
            isSiteAdmin: true
          }],
          masterPassword: hashPassword('PBJ0103')
        },
        version: 0
      };
      
      // Store the basic data
      localStorage.setItem(localStorageKey, JSON.stringify(basicStorage));
      console.log('Created new driver storage with UPS JACFL site');
      return true;
    }
    
    // Parse the existing data
    const parsedData = JSON.parse(storageData);
    let modified = false;
    
    // Ensure state object exists
    if (!parsedData.state) {
      parsedData.state = {};
      modified = true;
    }
    
    // Ensure companies array exists with UPS
    if (!Array.isArray(parsedData.state.companies)) {
      parsedData.state.companies = [];
      modified = true;
    }
    
    // Add UPS company if it doesn't exist
    if (!parsedData.state.companies.some((c: any) => c && c.id === 'UPS')) {
      parsedData.state.companies.push({
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
      });
      modified = true;
    }
    
    // Ensure sites array exists with JACFL
    if (!Array.isArray(parsedData.state.sites)) {
      parsedData.state.sites = [];
      modified = true;
    }
    
    // Add JACFL site if it doesn't exist
    if (!parsedData.state.sites.some((s: any) => s && s.id === 'JACFL' && s.companyId === 'UPS')) {
      parsedData.state.sites.push({
        id: 'JACFL',
        name: 'Jacksonville, FL',
        companyId: 'UPS',
        address: '123 Main St, Jacksonville, FL 32256',
        isActive: true
      });
      modified = true;
    }
    
    // Ensure adminCredentials array exists with UPS JACFL admin
    if (!Array.isArray(parsedData.state.adminCredentials)) {
      parsedData.state.adminCredentials = [];
      modified = true;
    }
    
    // Add UPS JACFL admin credentials if they don't exist
    if (!parsedData.state.adminCredentials.some((a: any) => 
        a && a.username === 'admin' && a.companyId === 'UPS' && a.siteId === 'JACFL')) {
      parsedData.state.adminCredentials.push({
        username: 'admin',
        passwordHash: hashPassword('ups123'),
        companyId: 'UPS',
        siteId: 'JACFL',
        isSiteAdmin: true
      });
      modified = true;
    }
    
    // Ensure master password is set
    if (!parsedData.state.masterPassword || parsedData.state.masterPassword !== hashPassword('PBJ0103')) {
      parsedData.state.masterPassword = hashPassword('PBJ0103');
      modified = true;
    }
    
    // If we made changes, write back to localStorage
    if (modified) {
      localStorage.setItem(localStorageKey, JSON.stringify(parsedData));
      console.log('🔐 Updated localStorage with required UPS JACFL data');
      return true;
    }
    
    console.log('✅ UPS JACFL data already exists in localStorage');
    return false;
  } catch (error) {
    console.error('Failed to directly update localStorage:', error);
    return false;
  }
}