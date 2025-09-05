import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Toaster } from '@/components/ui/sonner';

// Production configuration
import { verifyProductionConfig, IS_PRODUCTION } from '@/config/production';

// Initialize store before rendering the app
import './store/persistenceInit';

// Import the data restoration wrapper component  
import RestoreAppWrapper from './utils/restore-app-wrapper';

// Import and run the emergency fix script FIRST before anything else
import './utils/emergencyFix';

// Perform additional direct restoration before rendering anything
import { forceRestoreUPSJACFL } from './utils/directUPSJACFLRestore';

// Import production setup and migration utilities
import './utils/complete-migration';
import './utils/production-setup';
import './utils/deployment-verification';

// Import production migration class
import { ProductionMigration } from '@/lib/production-migration';

// Import auth store
import { useAuthStore } from '@/store/auth-store';

// Global auth utilities
(window as any).JSS_AUTH = {
  getState: () => useAuthStore.getState(),
  logout: () => useAuthStore.getState().logout(),
  isMaster: () => useAuthStore.getState().isMasterAdmin()
};

// HIGHEST PRIORITY: Direct restoration before React loads
forceRestoreUPSJACFL();

// Initialize production configuration
if (IS_PRODUCTION) {
  verifyProductionConfig();
  console.log('🌐 JSS Live on www.align-logic.com');
  console.log('🔒 Multi-tenant architecture with secure backend');
} else {
  console.log('🔧 JSS Development Mode');
}

// Make production migration available globally
(window as any).JSS_PRODUCTION = ProductionMigration;

// Production-ready console utilities
console.log('🚀 JSS Production System Ready');
console.log('📋 Available commands:');
console.log('  JSS_PRODUCTION.executeFullMigration() - Complete production migration');
console.log('  JSS_PRODUCTION.verifyMigration() - Verify migration integrity');
console.log('  JSS_PRODUCTION.createSampleData() - Create test data');
console.log('  JSS_SETUP.initialize() - Initialize production environment');
console.log('  JSS_SETUP.verify() - Verify deployment readiness');  
console.log('  JSS_MIGRATION.runMigration() - Migrate data to backend');
console.log('  JSS_MIGRATION.rollback() - Emergency rollback to localStorage');
console.log('  JSS_MIGRATION.status() - Check migration status');

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RestoreAppWrapper>
      <App />
      <Toaster />
    </RestoreAppWrapper>
  </React.StrictMode>
);