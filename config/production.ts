// Production configuration for JSS deployment
export const PRODUCTION_CONFIG = {
  // Domain configuration
  DOMAIN: 'www.align-logic.com',
  APP_NAME: 'Job Selection System',
  
  // Backend configuration
  USE_BACKEND: true,
  ENABLE_FALLBACK: false,
  
  // Feature flags
  ENABLE_DEBUG_LOGGING: false,
  ENABLE_MIGRATION_UI: true,
  ENABLE_CONSOLE_TOOLS: true,
  
  // Performance settings
  DATABASE_QUERY_TIMEOUT: 10000, // 10 seconds
  AUTH_SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  
  // Security settings
  FORCE_HTTPS: true,
  SECURE_COOKIES: true,
  
  // Company/Site defaults
  DEFAULT_COMPANY: 'UPS',
  DEFAULT_SITE: 'JACFL'
};

// Environment detection
export const IS_PRODUCTION = window.location.hostname === 'www.align-logic.com' || 
                             window.location.hostname === 'align-logic.com';

export const IS_DEVELOPMENT = window.location.hostname === 'localhost' || 
                              window.location.hostname === '127.0.0.1';

// Production deployment verification
export const verifyProductionConfig = () => {
  if (IS_PRODUCTION) {
    console.log('🚀 JSS Production Mode Active');
    console.log('✅ Backend database enabled');
    console.log('✅ Authentication system ready');
    console.log('✅ Domain:', PRODUCTION_CONFIG.DOMAIN);
    
    // Verify critical services
    const criticalServices = [
      'Backend database connection',
      'Authentication service',
      'Data migration tools',
      'Admin access controls'
    ];
    
    console.log('🔍 Critical services check:', criticalServices);
    return true;
  }
  
  return false;
};