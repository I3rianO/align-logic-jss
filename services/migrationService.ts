import { dataService } from './data-service';
import useDriverStore from '@/store/driverStore';
import { useAuthStore } from '@/store/auth-store';

export interface MigrationResult {
  success: boolean;
  message: string;
  migratedCounts: {
    companies: number;
    sites: number;
    drivers: number;
    jobs: number;
    preferences: number;
  };
  errors: string[];
  duration: number;
}

export interface MigrationOptions {
  dryRun?: boolean;
  skipExisting?: boolean;
  batchSize?: number;
  validateData?: boolean;
}

/**
 * Migration Service - Handles data migration from localStorage to backend database
 * Provides comprehensive migration utilities with verification and rollback capabilities
 */
class MigrationService {
  private isRunning = false;
  private startTime = 0;
  
  /**
   * Main migration method - runs complete data migration process
   */
  async runMigration(options: MigrationOptions = {}): Promise<MigrationResult> {
    if (this.isRunning) {
      throw new Error('Migration is already in progress');
    }
    
    this.isRunning = true;
    this.startTime = Date.now();
    
    const result: MigrationResult = {
      success: false,
      message: '',
      migratedCounts: {
        companies: 0,
        sites: 0,
        drivers: 0,
        jobs: 0,
        preferences: 0
      },
      errors: [],
      duration: 0
    };
    
    try {
      console.log('🚀 Starting JSS Data Migration...');
      console.log('Options:', options);
      
      // Check authentication
      const authState = useAuthStore.getState();
      if (!authState.user) {
        throw new Error('User must be authenticated to run migration');
      }
      
      // Get current localStorage data
      const store = useDriverStore.getState();
      console.log('📊 Current localStorage data:', {
        companies: store.companies.length,
        sites: store.sites.length,
        drivers: store.drivers.length,
        jobs: store.jobs.length,
        preferences: store.preferences.length
      });
      
      if (options.validateData) {
        console.log('🔍 Validating data integrity...');
        await this.validateLocalData();
      }
      
      if (options.dryRun) {
        console.log('🧪 DRY RUN MODE - No actual migration will occur');
        result.message = 'Dry run completed - no data was actually migrated';
        result.success = true;
        return result;
      }
      
      // Enable backend mode for migration
      dataService.enableBackendMode();
      
      // Run the actual migration
      console.log('📤 Migrating data to backend...');
      await dataService.migrateCurrentData();
      
      // Count migrated items
      result.migratedCounts = {
        companies: store.companies.length,
        sites: store.sites.length,
        drivers: store.drivers.length,
        jobs: store.jobs.length,
        preferences: store.preferences.length
      };
      
      // Verify migration success
      console.log('✅ Verifying migration...');
      const verificationResult = await this.verifyMigration();
      
      if (!verificationResult.success) {
        result.errors.push(...verificationResult.errors);
        throw new Error('Migration verification failed');
      }
      
      result.success = true;
      result.message = `Successfully migrated ${this.getTotalMigratedCount(result.migratedCounts)} items to backend database`;
      
      console.log('🎉 Migration completed successfully!');
      console.log('📈 Migration summary:', result.migratedCounts);
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      result.success = false;
      result.message = `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      
      // Attempt rollback
      try {
        console.log('🔄 Attempting rollback to localStorage...');
        dataService.enableLocalMode();
      } catch (rollbackError) {
        console.error('❌ Rollback failed:', rollbackError);
        result.errors.push(`Rollback failed: ${rollbackError instanceof Error ? rollbackError.message : 'Unknown error'}`);
      }
    } finally {
      this.isRunning = false;
      result.duration = Date.now() - this.startTime;
      console.log(`⏱️ Migration completed in ${result.duration}ms`);
    }
    
    return result;
  }
  
  /**
   * Validates localStorage data before migration
   */
  private async validateLocalData(): Promise<void> {
    const store = useDriverStore.getState();
    const errors: string[] = [];
    
    // Validate companies
    store.companies.forEach(company => {
      if (!company.id || !company.name) {
        errors.push(`Invalid company: ${JSON.stringify(company)}`);
      }
    });
    
    // Validate sites
    store.sites.forEach(site => {
      if (!site.id || !site.name || !site.companyId) {
        errors.push(`Invalid site: ${JSON.stringify(site)}`);
      }
    });
    
    // Validate drivers
    store.drivers.forEach(driver => {
      if (!driver.employeeId || !driver.name || !driver.companyId || !driver.siteId) {
        errors.push(`Invalid driver: ${JSON.stringify(driver)}`);
      }
    });
    
    // Validate jobs
    store.jobs.forEach(job => {
      if (!job.jobId || !job.startTime || !job.companyId || !job.siteId) {
        errors.push(`Invalid job: ${JSON.stringify(job)}`);
      }
    });
    
    // Validate preferences
    store.preferences.forEach(pref => {
      if (!pref.driverId || !Array.isArray(pref.preferences) || !pref.submissionTime) {
        errors.push(`Invalid preference: ${JSON.stringify(pref)}`);
      }
    });
    
    if (errors.length > 0) {
      throw new Error(`Data validation failed:\n${errors.join('\n')}`);
    }
  }
  
  /**
   * Verifies that migration was successful by comparing local and backend data
   */
  private async verifyMigration(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      const store = useDriverStore.getState();
      
      // Verify drivers
      const backendDrivers = await dataService.getDrivers();
      if (backendDrivers.length !== store.drivers.length) {
        errors.push(`Driver count mismatch: local=${store.drivers.length}, backend=${backendDrivers.length}`);
      }
      
      // Verify jobs
      const backendJobs = await dataService.getJobs();
      if (backendJobs.length !== store.jobs.length) {
        errors.push(`Job count mismatch: local=${store.jobs.length}, backend=${backendJobs.length}`);
      }
      
      // Verify preferences
      const backendPreferences = await dataService.getJobPreferences();
      if (backendPreferences.length !== store.preferences.length) {
        errors.push(`Preference count mismatch: local=${store.preferences.length}, backend=${backendPreferences.length}`);
      }
      
      return {
        success: errors.length === 0,
        errors
      };
      
    } catch (error) {
      errors.push(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        success: false,
        errors
      };
    }
  }
  
  /**
   * Gets total count of migrated items
   */
  private getTotalMigratedCount(counts: MigrationResult['migratedCounts']): number {
    return Object.values(counts).reduce((total, count) => total + count, 0);
  }
  
  /**
   * Clears localStorage data after successful migration (use with caution)
   */
  async clearLocalStorageData(): Promise<void> {
    if (!confirm('⚠️ This will permanently delete all localStorage data. Are you sure?')) {
      return;
    }
    
    const store = useDriverStore.getState();
    
    // Clear all data
    store.clearAllData();
    
    console.log('🗑️ localStorage data cleared');
  }
  
  /**
   * Emergency rollback - restores data from backend to localStorage
   */
  async emergencyRollback(): Promise<void> {
    console.log('🚨 Starting emergency rollback...');
    
    try {
      // Enable backend mode to fetch data
      dataService.enableBackendMode();
      
      // Fetch all data from backend
      const [drivers, jobs, preferences] = await Promise.all([
        dataService.getDrivers(),
        dataService.getJobs(),
        dataService.getJobPreferences()
      ]);
      
      // Switch to local mode and restore data
      dataService.enableLocalMode();
      const store = useDriverStore.getState();
      
      // Clear existing data
      store.clearAllData();
      
      // Restore data
      drivers.forEach(driver => store.addDriver(driver));
      jobs.forEach(job => store.addJob(job));
      preferences.forEach(pref => store.submitPreferences(pref));
      
      console.log('✅ Emergency rollback completed');
      
    } catch (error) {
      console.error('❌ Emergency rollback failed:', error);
      throw error;
    }
  }
  
  /**
   * Gets migration status and current data counts
   */
  async getMigrationStatus(): Promise<{
    isRunning: boolean;
    localCounts: MigrationResult['migratedCounts'];
    backendCounts: MigrationResult['migratedCounts'];
    backendEnabled: boolean;
  }> {
    const store = useDriverStore.getState();
    
    const localCounts = {
      companies: store.companies.length,
      sites: store.sites.length,
      drivers: store.drivers.length,
      jobs: store.jobs.length,
      preferences: store.preferences.length
    };
    
    let backendCounts = {
      companies: 0,
      sites: 0,
      drivers: 0,
      jobs: 0,
      preferences: 0
    };
    
    try {
      // Temporarily enable backend to get counts
      const wasBackendEnabled = dataService['useBackend'];
      dataService.enableBackendMode();
      
      const [drivers, jobs, preferences] = await Promise.all([
        dataService.getDrivers(),
        dataService.getJobs(),
        dataService.getJobPreferences()
      ]);
      
      backendCounts = {
        companies: 0, // Would need separate query
        sites: 0,    // Would need separate query
        drivers: drivers.length,
        jobs: jobs.length,
        preferences: preferences.length
      };
      
      // Restore original mode
      if (!wasBackendEnabled) {
        dataService.enableLocalMode();
      }
      
    } catch (error) {
      console.warn('Could not fetch backend counts:', error);
    }
    
    return {
      isRunning: this.isRunning,
      localCounts,
      backendCounts,
      backendEnabled: dataService['useBackend']
    };
  }
}

// Export singleton instance
export const migrationService = new MigrationService();

// Export the main migration function for easy access
export const runMigration = (options?: MigrationOptions) => migrationService.runMigration(options);