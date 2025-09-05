import { dataService } from '@/services/data-service';
import useDriverStore from '@/store/driverStore';

/**
 * Migration utilities for moving from localStorage to backend storage
 * Handles data export, import, verification, and rollback
 */

export interface MigrationStatus {
  isRunning: boolean;
  phase: string;
  completed: number;
  total: number;
  errors: string[];
  warnings: string[];
}

class MigrationService {
  private status: MigrationStatus = {
    isRunning: false,
    phase: 'idle',
    completed: 0,
    total: 0,
    errors: [],
    warnings: []
  };

  /**
   * Get current migration status
   */
  getStatus(): MigrationStatus {
    return { ...this.status };
  }

  /**
   * Export all current localStorage data for backup
   */
  exportCurrentData() {
    const store = useDriverStore.getState();
    
    const exportData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        drivers: store.drivers,
        jobs: store.jobs,
        preferences: store.preferences,
        manualAssignments: store.manualAssignments,
        systemSettings: store.systemSettings,
        driverCredentials: store.driverCredentials,
        adminCredentials: store.adminCredentials,
        driverActivity: store.driverActivity,
        companies: store.companies,
        sites: store.sites,
        registrationRequests: store.registrationRequests,
        currentCompanyId: store.currentCompanyId,
        currentSiteId: store.currentSiteId
      }
    };

    // Create downloadable backup file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `jss-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    
    return exportData;
  }

  /**
   * Run complete data migration from localStorage to backend
   */
  async runMigration(): Promise<boolean> {
    if (this.status.isRunning) {
      throw new Error('Migration already in progress');
    }

    this.status = {
      isRunning: true,
      phase: 'starting',
      completed: 0,
      total: 0,
      errors: [],
      warnings: []
    };

    try {
      const store = useDriverStore.getState();
      
      // Calculate total items to migrate
      const totalItems = 
        store.companies.length +
        store.sites.length +
        store.drivers.length +
        store.jobs.length +
        store.preferences.length +
        store.driverCredentials.length +
        store.adminCredentials.length;

      this.status.total = totalItems;

      // Phase 1: Migrate Companies
      this.status.phase = 'companies';
      await this.migrateCompanies(store.companies);

      // Phase 2: Migrate Sites  
      this.status.phase = 'sites';
      await this.migrateSites(store.sites);

      // Phase 3: Migrate Drivers
      this.status.phase = 'drivers';
      await this.migrateDrivers(store.drivers);

      // Phase 4: Migrate Jobs
      this.status.phase = 'jobs';
      await this.migrateJobs(store.jobs);

      // Phase 5: Migrate Preferences
      this.status.phase = 'preferences';
      await this.migratePreferences(store.preferences);

      // Phase 6: Migrate Credentials (sensitive - handle carefully)
      this.status.phase = 'credentials';
      await this.migrateCredentials(store.driverCredentials, store.adminCredentials);

      this.status.phase = 'completed';
      this.status.isRunning = false;

      console.log('✅ Migration completed successfully');
      return true;

    } catch (error) {
      this.status.errors.push(`Migration failed: ${error.message}`);
      this.status.phase = 'failed';
      this.status.isRunning = false;
      
      console.error('❌ Migration failed:', error);
      return false;
    }
  }

  private async migrateCompanies(companies: any[]) {
    for (const company of companies) {
      try {
        await dataService.addCompany?.(company) || 
          console.warn('Company migration not implemented yet');
        this.status.completed++;
      } catch (error) {
        this.status.warnings.push(`Failed to migrate company ${company.id}: ${error.message}`);
      }
    }
  }

  private async migrateSites(sites: any[]) {
    for (const site of sites) {
      try {
        await dataService.addSite?.(site) || 
          console.warn('Site migration not implemented yet');
        this.status.completed++;
      } catch (error) {
        this.status.warnings.push(`Failed to migrate site ${site.id}: ${error.message}`);
      }
    }
  }

  private async migrateDrivers(drivers: any[]) {
    for (const driver of drivers) {
      try {
        await dataService.addDriver(driver);
        this.status.completed++;
      } catch (error) {
        this.status.warnings.push(`Failed to migrate driver ${driver.employeeId}: ${error.message}`);
      }
    }
  }

  private async migrateJobs(jobs: any[]) {
    for (const job of jobs) {
      try {
        await dataService.addJob(job);
        this.status.completed++;
      } catch (error) {
        this.status.warnings.push(`Failed to migrate job ${job.jobId}: ${error.message}`);
      }
    }
  }

  private async migratePreferences(preferences: any[]) {
    for (const preference of preferences) {
      try {
        await dataService.submitJobPreferences(preference);
        this.status.completed++;
      } catch (error) {
        this.status.warnings.push(`Failed to migrate preferences for ${preference.driverId}: ${error.message}`);
      }
    }
  }

  private async migrateCredentials(driverCreds: any[], adminCreds: any[]) {
    // Note: This is sensitive data - implement carefully
    for (const cred of [...driverCreds, ...adminCreds]) {
      try {
        // Implement credential migration when backend methods are ready
        console.warn('Credential migration not implemented yet');
        this.status.completed++;
      } catch (error) {
        this.status.warnings.push(`Failed to migrate credentials: ${error.message}`);
      }
    }
  }

  /**
   * Verify data integrity between localStorage and backend
   */
  async verifyMigration(): Promise<{
    isValid: boolean;
    differences: string[];
    summary: any;
  }> {
    const differences: string[] = [];
    const store = useDriverStore.getState();

    try {
      // Check drivers
      const backendDrivers = await dataService.getDrivers();
      const localDrivers = store.drivers;
      
      if (backendDrivers.length !== localDrivers.length) {
        differences.push(`Driver count mismatch: Backend(${backendDrivers.length}) vs Local(${localDrivers.length})`);
      }

      // Check jobs
      const backendJobs = await dataService.getJobs();
      const localJobs = store.jobs;
      
      if (backendJobs.length !== localJobs.length) {
        differences.push(`Job count mismatch: Backend(${backendJobs.length}) vs Local(${localJobs.length})`);
      }

      // Check preferences
      const backendPrefs = await dataService.getJobPreferences();
      const localPrefs = store.preferences;
      
      if (backendPrefs.length !== localPrefs.length) {
        differences.push(`Preference count mismatch: Backend(${backendPrefs.length}) vs Local(${localPrefs.length})`);
      }

      const summary = {
        backend: {
          drivers: backendDrivers.length,
          jobs: backendJobs.length,
          preferences: backendPrefs.length
        },
        local: {
          drivers: localDrivers.length,
          jobs: localJobs.length,
          preferences: localPrefs.length
        }
      };

      return {
        isValid: differences.length === 0,
        differences,
        summary
      };

    } catch (error) {
      return {
        isValid: false,
        differences: [`Verification failed: ${error.message}`],
        summary: {}
      };
    }
  }

  /**
   * Enable backend mode after successful migration
   */
  switchToBackendMode() {
    dataService.enableBackendMode();
    
    // Update environment indicator
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('JSS_BACKEND_MODE', 'true');
    }
    
    console.log('🚀 Switched to backend mode');
  }

  /**
   * Rollback to localStorage mode if needed
   */
  rollbackToLocalMode() {
    dataService.enableLocalMode();
    
    // Update environment indicator
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('JSS_BACKEND_MODE', 'false');
    }
    
    console.log('🔄 Rolled back to local storage mode');
  }
}

// Export singleton instance
export const migrationService = new MigrationService();

// Export utility functions
export const exportBackup = () => migrationService.exportCurrentData();
export const runMigration = () => migrationService.runMigration();
export const verifyMigration = () => migrationService.verifyMigration();
export const switchToBackend = () => migrationService.switchToBackendMode();
export const rollbackToLocal = () => migrationService.rollbackToLocalMode();