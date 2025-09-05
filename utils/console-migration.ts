/**
 * Console Migration Utilities
 * 
 * Instructions for running migration from browser console:
 * 
 * 1. Open your JSS application in the browser
 * 2. Open Developer Tools (F12)
 * 3. Go to Console tab
 * 4. Copy and paste the commands below
 */

import { migrationService } from '@/services/migrationService';

// Make migration service available globally for console access
declare global {
  interface Window {
    JSS_MIGRATION: {
      runMigration: typeof migrationService.runMigration;
      getMigrationStatus: typeof migrationService.getMigrationStatus;
      emergencyRollback: typeof migrationService.emergencyRollback;
      clearLocalStorageData: typeof migrationService.clearLocalStorageData;
    };
  }
}

// Expose migration utilities to global scope
window.JSS_MIGRATION = {
  runMigration: migrationService.runMigration.bind(migrationService),
  getMigrationStatus: migrationService.getMigrationStatus.bind(migrationService),
  emergencyRollback: migrationService.emergencyRollback.bind(migrationService),
  clearLocalStorageData: migrationService.clearLocalStorageData.bind(migrationService)
};

/**
 * Console Commands Reference:
 * 
 * // Check current migration status
 * await JSS_MIGRATION.getMigrationStatus();
 * 
 * // Run a dry run (test migration without making changes)
 * await JSS_MIGRATION.runMigration({ dryRun: true, validateData: true });
 * 
 * // Run actual migration
 * await JSS_MIGRATION.runMigration({ validateData: true, skipExisting: true });
 * 
 * // Emergency rollback (if something goes wrong)
 * await JSS_MIGRATION.emergencyRollback();
 * 
 * // Clear localStorage data (use with caution!)
 * await JSS_MIGRATION.clearLocalStorageData();
 */

console.log(`
🚀 JSS Migration Console Commands Available!

Available commands:
• JSS_MIGRATION.getMigrationStatus() - Check current data status
• JSS_MIGRATION.runMigration({ dryRun: true }) - Test migration
• JSS_MIGRATION.runMigration() - Run actual migration
• JSS_MIGRATION.emergencyRollback() - Emergency rollback
• JSS_MIGRATION.clearLocalStorageData() - Clear localStorage

Quick Start:
1. await JSS_MIGRATION.getMigrationStatus()
2. await JSS_MIGRATION.runMigration({ dryRun: true })
3. await JSS_MIGRATION.runMigration()
`);

export default migrationService;