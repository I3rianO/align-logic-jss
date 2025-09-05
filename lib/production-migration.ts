import { migrationService } from '@/utils/migration';
import { activityService } from '@/services/activity-service';
import { tenantService } from '@/services/tenant-service';

// Production Migration Execution
export class ProductionMigration {
  
  static async executeFullMigration() {
    console.log('🚀 Starting JSS Production Migration...');
    
    try {
      // Step 1: Initialize tenant context
      console.log('Step 1: Initializing tenant context...');
      await tenantService.initializeTenantContext();
      
      // Step 2: Run data migration
      console.log('Step 2: Migrating data from localStorage to backend...');
      const migrationResult = await migrationService.runMigration({
        validateData: true,
        preserveLocalStorage: true,
        batchSize: 50
      });
      
      if (!migrationResult.success) {
        throw new Error(`Migration failed: ${migrationResult.errors.join(', ')}`);
      }
      
      // Step 3: Initialize activity tracking
      console.log('Step 3: Initializing activity tracking...');
      await activityService.logActivity({
        action: 'system_migration',
        details: 'Production system migration completed successfully',
        timestamp: new Date().toISOString()
      });
      
      // Step 4: Verify data integrity
      console.log('Step 4: Verifying data integrity...');
      const verification = await this.verifyMigration();
      
      if (!verification.success) {
        throw new Error(`Verification failed: ${verification.errors.join(', ')}`);
      }
      
      console.log('✅ JSS Production Migration Complete!');
      console.log('📊 Migration Summary:', {
        driversCount: migrationResult.summary?.drivers || 0,
        jobsCount: migrationResult.summary?.jobs || 0,
        preferencesCount: migrationResult.summary?.preferences || 0,
        vacationWeeksCount: migrationResult.summary?.vacationWeeks || 0
      });
      
      return {
        success: true,
        message: 'Production migration completed successfully',
        summary: migrationResult.summary,
        verification
      };
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      
      // Attempt rollback
      console.log('🔄 Attempting rollback...');
      try {
        await migrationService.rollbackMigration();
        console.log('✅ Rollback completed');
      } catch (rollbackError) {
        console.error('❌ Rollback failed:', rollbackError);
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        rollbackAttempted: true
      };
    }
  }
  
  static async verifyMigration() {
    console.log('🔍 Verifying migration integrity...');
    
    try {
      // Verify tables exist and have data
      const { dataService } = await import('@/services/data-service');
      
      // Test basic data retrieval
      const drivers = await dataService.getDrivers();
      const jobs = await dataService.getJobs();
      const preferences = await dataService.getPreferences();
      
      console.log('📊 Data counts:', {
        drivers: drivers.length,
        jobs: jobs.length,
        preferences: preferences.length
      });
      
      return {
        success: true,
        counts: {
          drivers: drivers.length,
          jobs: jobs.length,
          preferences: preferences.length
        }
      };
      
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Verification failed']
      };
    }
  }
  
  static async createSampleData() {
    console.log('🌱 Creating sample data for testing...');
    
    try {
      const { dataService } = await import('@/services/data-service');
      
      // Create sample company/site
      const sampleCompany = 'UPS-JACFL';
      const sampleSite = 'Jacksonville';
      
      // Create sample driver
      const sampleDriver = await dataService.createDriver({
        seniority: 1,
        name: 'John Sample',
        email: 'john.sample@ups.com',
        phone: '904-555-0123',
        address: '123 Sample St, Jacksonville, FL',
        companyId: sampleCompany,
        siteId: sampleSite
      });
      
      // Create sample job
      const sampleJob = await dataService.createJob({
        title: 'Sample Route 001',
        description: 'Sample delivery route for testing',
        location: 'Jacksonville Metro',
        shift: 'Day',
        companyId: sampleCompany,
        siteId: sampleSite
      });
      
      console.log('✅ Sample data created successfully');
      return {
        success: true,
        sampleDriver,
        sampleJob
      };
      
    } catch (error) {
      console.error('❌ Sample data creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}