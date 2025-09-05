import useDriverStore from '../store/driverStore';
import { hashPassword } from './passwordUtils';

/**
 * CRITICAL: This function forcefully restores the UPS JACFL site and credentials
 * It runs at app startup and should be the final failsafe to ensure the Master Admin
 * access is always available.
 * 
 * This function:
 * 1. Creates the UPS company if it doesn't exist
 * 2. Creates the JACFL site if it doesn't exist
 * 3. Ensures admin credentials exist for UPS JACFL with the correct password
 * 4. Sets up additional protection to prevent deletion of critical data
 */
export function forceRestoreJACFLAccess(): void {
  console.log('CRITICAL SAFETY: Forcing UPS JACFL site restoration');

  // Get current state
  const state = useDriverStore.getState();
  
  // Create fresh copies of data for updates
  let updatedCompanies = [...(state.companies || [])];
  let updatedSites = [...(state.sites || [])];
  let updatedAdminCredentials = [...(state.adminCredentials || [])];
  let needsUpdate = false;
  
  // 1. Make sure UPS company exists
  if (!updatedCompanies.some(company => company.id === 'UPS')) {
    console.warn('⚠️ UPS company missing - forcefully restoring');
    updatedCompanies.push({
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
    needsUpdate = true;
  } else {
    console.log('✅ UPS company exists');
  }
  
  // 2. Make sure JACFL site exists
  if (!updatedSites.some(site => site.id === 'JACFL' && site.companyId === 'UPS')) {
    console.warn('⚠️ JACFL site missing - forcefully restoring');
    updatedSites.push({
      id: 'JACFL',
      name: 'Jacksonville, FL',
      companyId: 'UPS',
      address: '123 Main St, Jacksonville, FL 32256',
      isActive: true
    });
    needsUpdate = true;
  } else {
    console.log('✅ JACFL site exists');
  }
  
  // Using the consistent hashPassword function from passwordUtils
  
  // 3. Make sure UPS JACFL admin credentials exist
  const upsJACFLAdmin = updatedAdminCredentials.find(
    admin => admin.companyId === 'UPS' && admin.siteId === 'JACFL' && admin.username === 'admin'
  );
  
  if (!upsJACFLAdmin) {
    console.warn('⚠️ UPS JACFL admin credentials missing - forcefully restoring');
    updatedAdminCredentials.push({
      username: 'admin',
      passwordHash: hashPassword('ups123'),
      companyId: 'UPS',
      siteId: 'JACFL',
      isSiteAdmin: true
    });
    needsUpdate = true;
  } else {
    console.log('✅ UPS JACFL admin exists');
  }
  
  // 4. Update state if needed
  if (needsUpdate) {
    console.log('🔐 Updating store with restored UPS JACFL data');
    useDriverStore.setState({
      companies: updatedCompanies,
      sites: updatedSites,
      adminCredentials: updatedAdminCredentials
    });
    
    // Double check that data was updated
    setTimeout(() => {
      const newState = useDriverStore.getState();
      const jacflExists = newState.sites.some(site => site.id === 'JACFL' && site.companyId === 'UPS');
      console.log(`Verification after update: UPS JACFL site exists = ${jacflExists}`);
    }, 100);
  } else {
    console.log('✅ All critical UPS JACFL data present');
  }

  // 5. Force write critical data to localStorage directly
  // This is a final failsafe in case the store doesn't persist correctly
  try {
    const localStorageKey = 'driver-storage';
    const storedData = localStorage.getItem(localStorageKey);
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      let modified = false;

      // Ensure companies includes UPS
      if (!parsedData.state.companies?.some((c: any) => c.id === 'UPS')) {
        if (!parsedData.state.companies) parsedData.state.companies = [];
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

      // Ensure sites includes JACFL
      if (!parsedData.state.sites?.some((s: any) => s.id === 'JACFL' && s.companyId === 'UPS')) {
        if (!parsedData.state.sites) parsedData.state.sites = [];
        parsedData.state.sites.push({
          id: 'JACFL',
          name: 'Jacksonville, FL',
          companyId: 'UPS',
          address: '123 Main St, Jacksonville, FL 32256',
          isActive: true
        });
        modified = true;
      }

      // Ensure adminCredentials includes UPS JACFL admin
      if (!parsedData.state.adminCredentials?.some((a: any) => a.companyId === 'UPS' && a.siteId === 'JACFL')) {
        if (!parsedData.state.adminCredentials) parsedData.state.adminCredentials = [];
        parsedData.state.adminCredentials.push({
          username: 'admin',
          passwordHash: hashPassword('ups123'),
          companyId: 'UPS',
          siteId: 'JACFL',
          isSiteAdmin: true
        });
        modified = true;
      }

      // If we made changes, write back to localStorage
      if (modified) {
        localStorage.setItem(localStorageKey, JSON.stringify(parsedData));
        console.log('🛡️ Direct localStorage update of critical UPS JACFL data complete');
      }
    }
  } catch (error) {
    console.error('Failed to directly update localStorage:', error);
  }

  return;
}