import useDriverStore from '@/store/driverStore';

/**
 * Result of looking up a driver by employee ID
 */
export interface DriverLookupResult {
  driver?: {
    employeeId: string;
    name: string;
    companyId: string;
    siteId: string;
  };
  site?: {
    id: string;
    name: string;
    companyId: string;
  };
  error?: string;
}

/**
 * Find the site and driver information associated with a given employee ID
 * @param employeeId The 7-digit employee ID to look up
 * @returns Object containing driver, site info and/or error message
 */
export const findSiteByEmployeeId = (employeeId: string): DriverLookupResult => {
  // Get the drivers from the driver store
  const { drivers } = useDriverStore.getState();
  
  // Find the driver with the given employee ID
  const driver = drivers.find(d => d.employeeId === employeeId);
  
  if (!driver) {
    return {
      error: "Your Employee ID was not recognized or is not yet active for scheduling."
    };
  }
  
  // Get site information
  const { sites } = useDriverStore.getState();
  const site = sites.find(s => s.id === driver.siteId && s.companyId === driver.companyId);
  
  if (!site) {
    return {
      driver: {
        employeeId: driver.employeeId,
        name: driver.name,
        companyId: driver.companyId,
        siteId: driver.siteId
      },
      error: "Your assigned facility could not be found. Please contact your supervisor."
    };
  }
  
  return {
    driver: {
      employeeId: driver.employeeId,
      name: driver.name,
      companyId: driver.companyId,
      siteId: driver.siteId
    },
    site: {
      id: site.id,
      name: site.name,
      companyId: site.companyId
    }
  };
};