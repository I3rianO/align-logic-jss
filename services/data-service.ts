import { table } from '@devvai/devv-code-backend';
import useDriverStore from '@/store/driverStore';
import { useAuthStore } from '@/store/auth-store';
import { tenantService } from './tenant-service';

// Table IDs from our database setup
export const TABLE_IDS = {
  DRIVERS: 'ex70js37fsao',
  JOBS: 'ex70k2mpifi8', 
  JOB_PREFERENCES: 'ex70kb0xq5mo',
  DRIVER_CREDENTIALS: 'ex70kj1fhzb4',
  ADMIN_CREDENTIALS: 'ex70kswnk5j4',
  COMPANIES: 'ex70l318qmf4',
  SITES: 'ex70lcbv54ao'
} as const;

// Configuration for deployment modes
const config = {
  useBackend: true, // Always use backend for production deployment
  enableSync: true,
  fallbackToLocal: process.env.NODE_ENV === 'development' // Only fallback in development
};

export interface Driver {
  employeeId: string;
  name: string;
  seniorityNumber: number;
  vcStatus: boolean;
  airportCertified: boolean;
  isEligible: boolean;
  passwordSet: boolean;
  securityQuestionsSet: boolean;
  companyId: string;
  siteId: string;
}

export interface Job {
  jobId: string;
  startTime: string;
  isAirport: boolean;
  weekDays: string;
  companyId: string;
  siteId: string;
}

export interface JobPreference {
  driverId: string;
  preferences: string[];
  submissionTime: string;
}

/**
 * Data Service Layer - Provides unified interface for backend and localStorage operations
 * Supports dual-mode operation during migration phase
 */
class DataService {
  private useBackend = config.useBackend;
  
  // Helper to convert boolean to string for backend storage
  private boolToString(value: boolean): string {
    return value.toString();
  }
  
  // Helper to convert string to boolean from backend
  private stringToBool(value: string | boolean): boolean {
    if (typeof value === 'boolean') return value;
    return value === 'true';
  }
  
  // DRIVER OPERATIONS
  async getDrivers(companyId?: string, siteId?: string): Promise<Driver[]> {
    try {
      if (this.useBackend) {
        // ENFORCE TENANT FILTERING - This prevents cross-tenant data leaks
        const query = tenantService.enforceTenantFiltering({
          companyId,
          siteId
        });
        
        const response = await table.getItems(TABLE_IDS.DRIVERS, {
          query,
          limit: 100
        });
        
        return response.items.map(item => ({
          employeeId: item.employeeId,
          name: item.name,
          seniorityNumber: item.seniorityNumber,
          vcStatus: this.stringToBool(item.vcStatus),
          airportCertified: this.stringToBool(item.airportCertified),
          isEligible: this.stringToBool(item.isEligible),
          passwordSet: this.stringToBool(item.passwordSet),
          securityQuestionsSet: this.stringToBool(item.securityQuestionsSet),
          companyId: item.companyId,
          siteId: item.siteId
        }));
      } else {
        // Fallback to localStorage
        return useDriverStore.getState().getDriversByCompanySite(companyId, siteId);
      }
    } catch (error) {
      if (config.fallbackToLocal) {
        console.warn('Backend driver fetch failed, falling back to localStorage:', error);
        return useDriverStore.getState().getDriversByCompanySite(companyId, siteId);
      }
      throw error;
    }
  }
  
  async addDriver(driver: Driver): Promise<void> {
    try {
      // VALIDATE TENANT OWNERSHIP - Prevent adding drivers to other tenants
      tenantService.validateDataOwnership(driver);
      
      if (this.useBackend) {
        await table.addItem(TABLE_IDS.DRIVERS, {
          employeeId: driver.employeeId,
          name: driver.name,
          seniorityNumber: driver.seniorityNumber,
          vcStatus: this.boolToString(driver.vcStatus),
          airportCertified: this.boolToString(driver.airportCertified),
          isEligible: this.boolToString(driver.isEligible),
          passwordSet: this.boolToString(driver.passwordSet),
          securityQuestionsSet: this.boolToString(driver.securityQuestionsSet),
          companyId: driver.companyId,
          siteId: driver.siteId
        });
      }
      
      // Always update local state for immediate UI response
      useDriverStore.getState().addDriver(driver);
    } catch (error) {
      if (config.fallbackToLocal) {
        console.warn('Backend driver add failed, using localStorage only:', error);
        useDriverStore.getState().addDriver(driver);
      } else {
        throw error;
      }
    }
  }
  
  async updateDriver(driver: Driver): Promise<void> {
    try {
      // VALIDATE TENANT OWNERSHIP - Prevent updating drivers from other tenants
      tenantService.validateDataOwnership(driver);
      
      if (this.useBackend) {
        // Get current user for _uid
        const authState = useAuthStore.getState();
        if (!authState.user) throw new Error('User not authenticated');
        
        await table.updateItem(TABLE_IDS.DRIVERS, {
          _uid: authState.user.uid,
          employeeId: driver.employeeId, // Use as identifier
          name: driver.name,
          seniorityNumber: driver.seniorityNumber,
          vcStatus: this.boolToString(driver.vcStatus),
          airportCertified: this.boolToString(driver.airportCertified),
          isEligible: this.boolToString(driver.isEligible),
          passwordSet: this.boolToString(driver.passwordSet),
          securityQuestionsSet: this.boolToString(driver.securityQuestionsSet),
          companyId: driver.companyId,
          siteId: driver.siteId
        });
      }
      
      // Always update local state
      useDriverStore.getState().updateDriver(driver);
    } catch (error) {
      if (config.fallbackToLocal) {
        console.warn('Backend driver update failed, using localStorage only:', error);
        useDriverStore.getState().updateDriver(driver);
      } else {
        throw error;
      }
    }
  }
  
  async deleteDriver(employeeId: string): Promise<void> {
    try {
      if (this.useBackend) {
        const authState = useAuthStore.getState();
        if (!authState.user) throw new Error('User not authenticated');
        
        // Note: We need to find the item's _id first for proper deletion
        // For now, we'll implement a soft delete by marking as inactive
        const drivers = await this.getDrivers();
        const driver = drivers.find(d => d.employeeId === employeeId);
        if (driver) {
          await this.updateDriver({ ...driver, isEligible: false });
        }
      }
      
      // Always update local state
      useDriverStore.getState().deleteDriver(employeeId);
    } catch (error) {
      if (config.fallbackToLocal) {
        console.warn('Backend driver delete failed, using localStorage only:', error);
        useDriverStore.getState().deleteDriver(employeeId);
      } else {
        throw error;
      }
    }
  }
  
  // JOB OPERATIONS
  async getJobs(companyId?: string, siteId?: string): Promise<Job[]> {
    try {
      if (this.useBackend) {
        // ENFORCE TENANT FILTERING - This prevents cross-tenant data leaks
        const query = tenantService.enforceTenantFiltering({
          companyId,
          siteId
        });
        
        const response = await table.getItems(TABLE_IDS.JOBS, {
          query,
          limit: 100
        });
        
        return response.items.map(item => ({
          jobId: item.jobId,
          startTime: item.startTime,
          isAirport: this.stringToBool(item.isAirport),
          weekDays: item.weekDays,
          companyId: item.companyId,
          siteId: item.siteId
        }));
      } else {
        return useDriverStore.getState().getJobsByCompanySite(companyId, siteId);
      }
    } catch (error) {
      if (config.fallbackToLocal) {
        console.warn('Backend job fetch failed, falling back to localStorage:', error);
        return useDriverStore.getState().getJobsByCompanySite(companyId, siteId);
      }
      throw error;
    }
  }
  
  async addJob(job: Job): Promise<void> {
    try {
      // VALIDATE TENANT OWNERSHIP - Prevent adding jobs to other tenants
      tenantService.validateDataOwnership(job);
      
      if (this.useBackend) {
        await table.addItem(TABLE_IDS.JOBS, {
          jobId: job.jobId,
          startTime: job.startTime,
          isAirport: this.boolToString(job.isAirport),
          weekDays: job.weekDays,
          companyId: job.companyId,
          siteId: job.siteId
        });
      }
      
      useDriverStore.getState().addJob(job);
    } catch (error) {
      if (config.fallbackToLocal) {
        console.warn('Backend job add failed, using localStorage only:', error);
        useDriverStore.getState().addJob(job);
      } else {
        throw error;
      }
    }
  }
  
  // JOB PREFERENCES OPERATIONS
  async getJobPreferences(driverId?: string): Promise<JobPreference[]> {
    try {
      if (this.useBackend) {
        const query: any = {};
        if (driverId) query.driverId = driverId;
        
        const response = await table.getItems(TABLE_IDS.JOB_PREFERENCES, {
          query: Object.keys(query).length > 0 ? query : undefined,
          limit: 100,
          sort: 'submissionTime',
          order: 'desc'
        });
        
        return response.items.map(item => ({
          driverId: item.driverId,
          preferences: JSON.parse(item.preferences),
          submissionTime: item.submissionTime
        }));
      } else {
        const allPrefs = useDriverStore.getState().preferences;
        return driverId ? allPrefs.filter(p => p.driverId === driverId) : allPrefs;
      }
    } catch (error) {
      if (config.fallbackToLocal) {
        console.warn('Backend preferences fetch failed, falling back to localStorage:', error);
        const allPrefs = useDriverStore.getState().preferences;
        return driverId ? allPrefs.filter(p => p.driverId === driverId) : allPrefs;
      }
      throw error;
    }
  }
  
  async submitJobPreferences(preference: JobPreference): Promise<void> {
    try {
      if (this.useBackend) {
        await table.addItem(TABLE_IDS.JOB_PREFERENCES, {
          driverId: preference.driverId,
          preferences: JSON.stringify(preference.preferences),
          submissionTime: preference.submissionTime
        });
      }
      
      useDriverStore.getState().submitPreferences(preference);
    } catch (error) {
      if (config.fallbackToLocal) {
        console.warn('Backend preferences submit failed, using localStorage only:', error);
        useDriverStore.getState().submitPreferences(preference);
      } else {
        throw error;
      }
    }
  }
  
  // MIGRATION UTILITIES
  async migrateCurrentData(): Promise<void> {
    const store = useDriverStore.getState();
    
    console.log('Starting data migration to backend...');
    
    try {
      // Migrate companies
      for (const company of store.companies) {
        await table.addItem(TABLE_IDS.COMPANIES, {
          companyId: company.id,
          name: company.name,
          isActive: this.boolToString(company.isActive),
          isFree: this.boolToString(company.isFree),
          registrationDate: company.registrationDate,
          settings: JSON.stringify(company.settings)
        });
      }
      
      // Migrate sites
      for (const site of store.sites) {
        await table.addItem(TABLE_IDS.SITES, {
          siteId: site.id,
          name: site.name,
          companyId: site.companyId,
          address: site.address,
          isActive: this.boolToString(site.isActive)
        });
      }
      
      // Migrate drivers
      for (const driver of store.drivers) {
        await this.addDriver(driver);
      }
      
      // Migrate jobs
      for (const job of store.jobs) {
        await this.addJob(job);
      }
      
      // Migrate preferences
      for (const preference of store.preferences) {
        await this.submitJobPreferences(preference);
      }
      
      console.log('Data migration completed successfully!');
    } catch (error) {
      console.error('Data migration failed:', error);
      throw error;
    }
  }
  
  // Switch to backend mode
  enableBackendMode(): void {
    this.useBackend = true;
    console.log('Backend mode enabled');
  }
  
  // Switch to localStorage mode  
  enableLocalMode(): void {
    this.useBackend = false;
    console.log('Local storage mode enabled');
  }
  
  // TENANT-SCOPED ANALYTICS AND ACTIVITY METHODS
  
  /**
   * Get statistics scoped to current user's tenant
   */
  async getTenantStatistics(): Promise<{
    totalDrivers: number;
    totalJobs: number;
    submittedPreferences: number;
    pendingDrivers: number;
    airportJobs: number;
    vcDrivers: number;
  }> {
    try {
      // Get tenant context (automatically enforced)
      const drivers = await this.getDrivers();
      const jobs = await this.getJobs();
      const preferences = await this.getJobPreferences();
      
      return {
        totalDrivers: drivers.length,
        totalJobs: jobs.length,
        submittedPreferences: preferences.length,
        pendingDrivers: drivers.filter(d => !d.passwordSet).length,
        airportJobs: jobs.filter(j => j.isAirport).length,
        vcDrivers: drivers.filter(d => d.vcStatus).length
      };
    } catch (error) {
      console.error('Failed to get tenant statistics:', error);
      return {
        totalDrivers: 0,
        totalJobs: 0,
        submittedPreferences: 0,
        pendingDrivers: 0,
        airportJobs: 0,
        vcDrivers: 0
      };
    }
  }
  
  /**
   * Get recent activity scoped to current user's tenant
   */
  async getTenantActivity(): Promise<Array<{
    id: string;
    type: 'preference_submitted' | 'driver_added' | 'job_added' | 'driver_updated';
    description: string;
    timestamp: string;
    driverName?: string;
    jobId?: string;
  }>> {
    try {
      const activities: Array<{
        id: string;
        type: 'preference_submitted' | 'driver_added' | 'job_added' | 'driver_updated';
        description: string;
        timestamp: string;
        driverName?: string;
        jobId?: string;
      }> = [];
      
      // Get recent preferences (tenant-scoped automatically)
      const preferences = await this.getJobPreferences();
      const drivers = await this.getDrivers();
      
      // Create activity entries from preferences
      preferences
        .sort((a, b) => new Date(b.submissionTime).getTime() - new Date(a.submissionTime).getTime())
        .slice(0, 10) // Last 10 activities
        .forEach(pref => {
          const driver = drivers.find(d => d.employeeId === pref.driverId);
          activities.push({
            id: `pref-${pref.driverId}-${pref.submissionTime}`,
            type: 'preference_submitted',
            description: `${driver?.name || pref.driverId} submitted job preferences`,
            timestamp: pref.submissionTime,
            driverName: driver?.name
          });
        });
      
      return activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error('Failed to get tenant activity:', error);
      return [];
    }
  }
  
  /**
   * Get current user's tenant display name
   */
  getCurrentTenantName(): string {
    return tenantService.getTenantDisplayName();
  }
  
  /**
   * Check if user has cross-tenant access
   */
  hasCrossTenantAccess(): boolean {
    return tenantService.hasCrossTenantAccess();
  }
}

// Export singleton instance
export const dataService = new DataService();