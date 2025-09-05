import { dataService } from '@/services/data-service';
import { useAuthStore } from '@/store/auth-store';
import useDriverStore from '@/store/driverStore';

/**
 * Production Deployment Verification System
 * Runs comprehensive checks to ensure the system is ready for production use
 */
export class DeploymentVerification {
  
  /**
   * Run complete deployment verification
   */
  static async runFullVerification(): Promise<{
    success: boolean;
    results: Record<string, boolean>;
    errors: string[];
    summary: string;
  }> {
    console.log('🔍 Starting JSS Deployment Verification...');
    
    const results: Record<string, boolean> = {};
    const errors: string[] = [];
    
    try {
      // Test 1: Backend Connection
      console.log('Testing backend connection...');
      results.backendConnection = await this.testBackendConnection();
      
      // Test 2: Authentication System
      console.log('Testing authentication system...');
      results.authSystem = await this.testAuthenticationSystem();
      
      // Test 3: Database Operations
      console.log('Testing database operations...');
      results.databaseOps = await this.testDatabaseOperations();
      
      // Test 4: Data Integrity
      console.log('Testing data integrity...');
      results.dataIntegrity = await this.testDataIntegrity();
      
      // Test 5: UI Components
      console.log('Testing UI components...');
      results.uiComponents = await this.testUIComponents();
      
      // Test 6: Security Features
      console.log('Testing security features...');
      results.security = await this.testSecurityFeatures();
      
    } catch (error) {
      errors.push(`Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    const success = passedTests === totalTests && errors.length === 0;
    
    const summary = `${passedTests}/${totalTests} tests passed${errors.length > 0 ? `, ${errors.length} errors` : ''}`;
    
    console.log(success ? '✅ All verification tests passed!' : '❌ Some tests failed');
    console.log('📊 Test Results:', results);
    if (errors.length > 0) {
      console.log('🚨 Errors:', errors);
    }
    
    return { success, results, errors, summary };
  }
  
  /**
   * Test backend database connection
   */
  private static async testBackendConnection(): Promise<boolean> {
    try {
      // Try to fetch drivers to test connection
      await dataService.getDrivers();
      return true;
    } catch (error) {
      console.error('Backend connection failed:', error);
      return false;
    }
  }
  
  /**
   * Test authentication system
   */
  private static async testAuthenticationSystem(): Promise<boolean> {
    try {
      const authStore = useAuthStore.getState();
      
      // Check if auth store is properly initialized
      if (typeof authStore.sendOTP !== 'function' ||
          typeof authStore.verifyOTP !== 'function' ||
          typeof authStore.logout !== 'function') {
        return false;
      }
      
      // Check role-based access controls
      if (typeof authStore.isMasterAdmin !== 'function' ||
          typeof authStore.canAccessCompany !== 'function') {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Test database operations
   */
  private static async testDatabaseOperations(): Promise<boolean> {
    try {
      // Test read operations
      const [drivers, jobs, preferences] = await Promise.all([
        dataService.getDrivers(),
        dataService.getJobs(),
        dataService.getJobPreferences()
      ]);
      
      // Verify data types
      if (!Array.isArray(drivers) || !Array.isArray(jobs) || !Array.isArray(preferences)) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Test data integrity
   */
  private static async testDataIntegrity(): Promise<boolean> {
    try {
      const store = useDriverStore.getState();
      
      // Check if essential data exists
      const hasCompanies = store.companies.length > 0;
      const hasSites = store.sites.length > 0;
      const hasDrivers = store.drivers.length > 0;
      const hasJobs = store.jobs.length > 0;
      
      return hasCompanies && hasSites && hasDrivers && hasJobs;
    } catch {
      return false;
    }
  }
  
  /**
   * Test UI components
   */
  private static async testUIComponents(): Promise<boolean> {
    try {
      // Check if critical DOM elements exist
      const rootElement = document.getElementById('root');
      const hasHeader = document.querySelector('header') !== null;
      const hasNav = document.querySelector('nav') !== null;
      
      return rootElement !== null && (hasHeader || hasNav);
    } catch {
      return false;
    }
  }
  
  /**
   * Test security features
   */
  private static async testSecurityFeatures(): Promise<boolean> {
    try {
      // Check HTTPS in production
      const isHTTPS = window.location.protocol === 'https:' || 
                     window.location.hostname === 'localhost';
      
      // Check if sensitive data is not exposed in localStorage
      const localStorageKeys = Object.keys(localStorage);
      const hasSensitiveData = localStorageKeys.some(key => 
        key.toLowerCase().includes('password') || 
        key.toLowerCase().includes('secret')
      );
      
      return isHTTPS && !hasSensitiveData;
    } catch {
      return false;
    }
  }
  
  /**
   * Quick health check for production monitoring
   */
  static async quickHealthCheck(): Promise<boolean> {
    try {
      const authStore = useAuthStore.getState();
      const store = useDriverStore.getState();
      
      // Basic checks
      const hasData = store.drivers.length > 0;
      const authWorks = typeof authStore.sendOTP === 'function';
      const uiWorks = document.getElementById('root') !== null;
      
      return hasData && authWorks && uiWorks;
    } catch {
      return false;
    }
  }
}

// Make available globally for console access
(window as any).JSS_VERIFY = {
  runFullVerification: DeploymentVerification.runFullVerification,
  quickHealthCheck: DeploymentVerification.quickHealthCheck
};

export default DeploymentVerification;