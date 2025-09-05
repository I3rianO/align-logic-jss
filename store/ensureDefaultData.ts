import useDriverStore from './driverStore';

/**
 * This function ensures that critical default data (like UPS and JACFL) always exists
 * in the system, even if the localStorage data gets corrupted or deleted.
 * 
 * It runs at app initialization to maintain the integrity of the system.
 */
export function ensureDefaultData(): void {
  // Get the current state
  const state = useDriverStore.getState();
  
  // Check if UPS company exists
  const upsCompany = state.companies.find(company => company.id === 'UPS');
  if (!upsCompany) {
    // Add UPS company if it doesn't exist
    const newUPSCompany = {
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
    
    useDriverStore.setState({
      companies: [...state.companies, newUPSCompany]
    });
    
    console.log('UPS company restored - not found in localStorage');
  }
  
  // Check if JACFL site exists
  const jacflSite = state.sites.find(site => site.id === 'JACFL' && site.companyId === 'UPS');
  if (!jacflSite) {
    // Add JACFL site if it doesn't exist
    const newJACFLSite = {
      id: 'JACFL',
      name: 'Jacksonville, FL',
      companyId: 'UPS',
      address: '123 Main St, Jacksonville, FL 32256',
      isActive: true
    };
    
    useDriverStore.setState({
      sites: [...state.sites, newJACFLSite]
    });
    
    console.log('JACFL site restored - not found in localStorage');
  }
  
  // Check if JACFL admin exists
  const jacflAdmin = state.adminCredentials.find(
    admin => admin.username === 'admin' && admin.companyId === 'UPS' && admin.siteId === 'JACFL'
  );
  if (!jacflAdmin) {
    // Add UPS JACFL admin credentials with master password capabilities
    useDriverStore.setState({
      adminCredentials: [
        ...state.adminCredentials,
        {
          username: 'admin',
          // Simple hash function is used in this example - same as in driverStore.ts
          passwordHash: (() => {
            const password = 'ups123';
            let hash = 0;
            for (let i = 0; i < password.length; i++) {
              const char = password.charCodeAt(i);
              hash = ((hash << 5) - hash) + char;
              hash = hash & hash; // Convert to 32bit integer
            }
            return hash.toString(16);
          })(),
          companyId: 'UPS',
          siteId: 'JACFL',
          isSiteAdmin: true
        }
      ]
    });
    
    console.log('UPS JACFL admin credentials restored');
  }
}