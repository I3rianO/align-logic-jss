import useDriverStore from '../store/driverStore';
import { hashPassword } from './passwordUtils';

/**
 * Verify and restore critical system data (UPS company and JACFL site)
 * This function runs when the app starts to ensure the critical data is available
 */
export function verifyCriticalData() {
  const { companies, sites, adminCredentials } = useDriverStore.getState();
  let needsUpdate = false;
  let updatedCompanies = [...(companies || [])];
  let updatedSites = [...(sites || [])];
  let updatedAdminCredentials = [...(adminCredentials || [])];
  
  // Check if UPS company exists
  if (!companies.some(c => c.id === 'UPS')) {
    console.warn('UPS company missing - restoring required data');
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
  }
  
  // Check if JACFL site exists
  if (!sites.some(s => s.id === 'JACFL' && s.companyId === 'UPS')) {
    console.warn('JACFL site missing - restoring required data');
    updatedSites.push({
      id: 'JACFL',
      name: 'Jacksonville, FL',
      companyId: 'UPS',
      address: '123 Main St, Jacksonville, FL 32256',
      isActive: true
    });
    needsUpdate = true;
  }
  
  // Check if UPS JACFL admin exists
  if (!adminCredentials.some(a => a.companyId === 'UPS' && a.siteId === 'JACFL')) {
    console.warn('UPS JACFL admin missing - restoring required data');
    
    // Using the consistent hashPassword function from passwordUtils
    
    updatedAdminCredentials.push({
      username: 'admin',
      passwordHash: hashPassword('ups123'),
      companyId: 'UPS',
      siteId: 'JACFL',
      isSiteAdmin: true
    });
    needsUpdate = true;
  }
  
  // Update the store if needed
  if (needsUpdate) {
    console.log('Updating store with restored critical data');
    useDriverStore.setState({
      companies: updatedCompanies,
      sites: updatedSites,
      adminCredentials: updatedAdminCredentials
    });
    return true;
  }
  
  console.log('Critical data integrity check passed - UPS and JACFL available');
  return false;
}