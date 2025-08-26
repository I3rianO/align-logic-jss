// This file initializes data persistence for the application
// It's imported in main.tsx before the app renders to ensure data is loaded from localStorage

import usePersistentDriverStore from './persistentDriverStore';
import useDriverStore from './driverStore';
import { ensureDefaultData } from './ensureDefaultData';
import { directlyRestoreJACFL } from '../utils/directStorageRestore';
import { forceRestoreJACFLAccess } from '../utils/forceInitJACFL';
import { guaranteeCriticalSiteIntegrity } from '../utils/criticalSiteRestore';

// Initialize store by accessing it once
// This triggers the loading of data from localStorage
const initStore = () => {
  try {
    // HIGHEST PRIORITY: Use the definitive implementation
    // This is the most robust method to ensure UPS JACFL site exists
    guaranteeCriticalSiteIntegrity();
    
    // Legacy methods for backward compatibility
    directlyRestoreJACFL();
    
    // Access the store to initialize it
    const drivers = usePersistentDriverStore.getState().drivers;
    console.log(`Persistence layer initialized with ${drivers.length} drivers`);
    
    // Initialize main driver store
    const mainStoreDrivers = useDriverStore.getState().drivers;
    console.log(`Main store initialized with ${mainStoreDrivers.length} drivers`);
    
    // Ensure critical data always exists (UPS and JACFL)
    ensureDefaultData();
    console.log('Data integrity check complete - UPS and JACFL sites verified');
    
    // Final failsafe - force restoration of JACFL
    forceRestoreJACFLAccess();
    
    // Set up an interval to periodically check for the existence of UPS JACFL
    const intervalId = setInterval(() => {
      const sites = useDriverStore.getState().sites;
      const jacflExists = sites.some(site => site.id === 'JACFL' && site.companyId === 'UPS');
      if (!jacflExists) {
        console.warn('UPS JACFL site missing - forcing restoration');
        forceRestoreJACFLAccess();
      }
    }, 10000); // Check every 10 seconds
    
    // Clean up interval after 5 minutes
    setTimeout(() => clearInterval(intervalId), 5 * 60 * 1000);
  } catch (error) {
    console.error('Error during store initialization:', error);
    // Even if there's an error, try to ensure default data
    guaranteeCriticalSiteIntegrity(); // Most robust method
    directlyRestoreJACFL(); // Direct localStorage manipulation
    ensureDefaultData(); // Zustand state update
    forceRestoreJACFLAccess(); // Forced restoration
  }
};

// Call initialization function
initStore();