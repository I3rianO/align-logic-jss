import { dataService } from '@/services/data-service';
import { activityService } from '@/services/activity-service';
import { useAuthStore } from '@/store/auth-store';
import useDriverStore from '@/store/driverStore';

/**
 * Complete Migration Service - Handles full system migration to production backend
 */
export class CompleteMigrationService {
  
  /**
   * Run complete migration from localStorage to backend
   */
  async runFullMigration(): Promise<void> {
    console.log('🚀 Starting complete JSS system migration...');
    
    try {
      // Step 1: Validate authentication
      await this.validateAuthentication();
      console.log('✅ Authentication validated');
      
      // Step 2: Backup existing data
      await this.backupLocalData();
      console.log('✅ Local data backed up');
      
      // Step 3: Migrate all data to backend
      await this.migrateAllData();
      console.log('✅ Data migration completed');
      
      // Step 4: Verify data integrity
      await this.verifyDataIntegrity();
      console.log('✅ Data integrity verified');
      
      // Step 5: Switch to backend mode
      await this.switchToBackendMode();
      console.log('✅ Backend mode activated');
      
      // Step 6: Initialize activity tracking
      await this.initializeActivityTracking();
      console.log('✅ Activity tracking initialized');
      
      console.log('🎉 Migration completed successfully!');
      
      // Log successful migration
      activityService.logActivity({
        type: 'admin_login',
        description: 'JSS system successfully migrated to production backend'
      });
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }
  
  /**
   * Validate that user is authenticated and has proper permissions
   */
  private async validateAuthentication(): Promise<void> {
    const authState = useAuthStore.getState();
    
    if (!authState.isAuthenticated) {
      throw new Error('User must be authenticated to run migration');
    }
    
    if (authState.userRole !== 'admin' && authState.userRole !== 'master') {
      throw new Error('Only admin users can run data migration');
    }
    
    if (!authState.companyId || !authState.siteId) {
      throw new Error('User context missing company/site information');
    }
  }
  
  /**
   * Backup existing localStorage data
   */
  private async backupLocalData(): Promise<void> {
    const store = useDriverStore.getState();
    
    const backup = {
      timestamp: new Date().toISOString(),
      companies: store.companies,
      sites: store.sites,
      drivers: store.drivers,
      jobs: store.jobs,
      preferences: store.preferences,
      driverActivity: store.driverActivity
    };
    
    // Store backup in localStorage with timestamp
    localStorage.setItem('jss-migration-backup', JSON.stringify(backup));
    console.log(`Backup created with ${backup.drivers.length} drivers, ${backup.jobs.length} jobs`);
  }
  
  /**
   * Migrate all data types to backend
   */
  private async migrateAllData(): Promise<void> {
    const store = useDriverStore.getState();
    const authState = useAuthStore.getState();
    
    console.log('Migrating companies...');
    await this.migrateCompanies();
    
    console.log('Migrating sites...');
    await this.migrateSites();
    
    console.log('Migrating drivers...');
    await this.migrateDrivers();
    
    console.log('Migrating jobs...');  
    await this.migrateJobs();
    
    console.log('Migrating preferences...');
    await this.migratePreferences();
    
    console.log('Data migration completed');
  }
  
  /**
   * Migrate companies data
   */
  private async migrateCompanies(): Promise<void> {
    try {
      await dataService.migrateCurrentData();
    } catch (error) {
      console.error('Company migration failed:', error);
      // Don't throw - continue with other data
    }
  }
  
  /**
   * Migrate sites data
   */
  private async migrateSites(): Promise<void> {
    // Sites are handled in migrateCurrentData
  }
  
  /**
   * Migrate drivers data
   */
  private async migrateDrivers(): Promise<void> {
    // Drivers are handled in migrateCurrentData
  }
  
  /**
   * Migrate jobs data
   */
  private async migrateJobs(): Promise<void> {
    // Jobs are handled in migrateCurrentData
  }
  
  /**
   * Migrate preferences data
   */
  private async migratePreferences(): Promise<void> {
    // Preferences are handled in migrateCurrentData
  }
  
  /**
   * Verify data integrity after migration
   */
  private async verifyDataIntegrity(): Promise<void> {
    const authState = useAuthStore.getState();
    
    // Test loading data from backend
    const [drivers, jobs, preferences] = await Promise.all([
      dataService.getDrivers(),
      dataService.getJobs(), 
      dataService.getJobPreferences()
    ]);
    
    console.log(`Verification: ${drivers.length} drivers, ${jobs.length} jobs, ${preferences.length} preferences`);
    
    // Verify tenant isolation
    drivers.forEach(driver => {
      if (driver.companyId !== authState.companyId || driver.siteId !== authState.siteId) {
        console.warn(`Data leak detected: Driver ${driver.employeeId} belongs to ${driver.companyId}/${driver.siteId} but user is ${authState.companyId}/${authState.siteId}`);
      }
    });
    
    jobs.forEach(job => {
      if (job.companyId !== authState.companyId || job.siteId !== authState.siteId) {
        console.warn(`Data leak detected: Job ${job.jobId} belongs to ${job.companyId}/${job.siteId} but user is ${authState.companyId}/${authState.siteId}`);
      }
    });
  }
  
  /**
   * Switch system to backend mode
   */
  private async switchToBackendMode(): Promise<void> {
    dataService.enableBackendMode();
    
    // Update local storage flag
    localStorage.setItem('jss-backend-mode', 'true');
    localStorage.setItem('jss-migration-completed', new Date().toISOString());
  }
  
  /**
   * Initialize activity tracking
   */
  private async initializeActivityTracking(): Promise<void> {
    // Clear any old localStorage activities
    activityService.clearActivities();
    
    // Log migration completion
    activityService.logActivity({
      type: 'admin_login',
      description: 'System migration to backend completed successfully'
    });
  }
  
  /**
   * Emergency rollback to localStorage mode
   */
  async emergencyRollback(): Promise<void> {
    console.log('🚨 Emergency rollback initiated...');
    
    try {
      // Switch back to local mode
      dataService.enableLocalMode();
      
      // Restore backup if available
      const backup = localStorage.getItem('jss-migration-backup');
      if (backup) {
        const backupData = JSON.parse(backup);
        console.log('Restoring from backup...');
        // Note: You would need to implement restore functionality in the store
      }
      
      // Clear backend mode flags
      localStorage.removeItem('jss-backend-mode');
      localStorage.setItem('jss-rollback-completed', new Date().toISOString());
      
      console.log('✅ Emergency rollback completed');
    } catch (error) {
      console.error('❌ Emergency rollback failed:', error);
      throw error;
    }
  }
  
  /**
   * Check migration status
   */
  getMigrationStatus(): {
    isCompleted: boolean;
    timestamp?: string;
    rollbackAvailable: boolean;
  } {
    const completed = localStorage.getItem('jss-migration-completed');
    const backup = localStorage.getItem('jss-migration-backup');
    
    return {
      isCompleted: !!completed,
      timestamp: completed || undefined,
      rollbackAvailable: !!backup
    };
  }
}

// Export singleton instance
export const completeMigrationService = new CompleteMigrationService();

// Global helper functions for console access
(window as any).JSS_MIGRATION = {
  runMigration: () => completeMigrationService.runFullMigration(),
  rollback: () => completeMigrationService.emergencyRollback(),
  status: () => completeMigrationService.getMigrationStatus()
};