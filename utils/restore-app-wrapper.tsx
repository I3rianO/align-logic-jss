import React, { useEffect, useState } from 'react';
import { guaranteeCriticalSiteIntegrity } from './criticalSiteRestore';
import { forceRestoreUPSJACFL } from './directUPSJACFLRestore';
import { forceRestoreJACFLAccess } from './forceInitJACFL';

/**
 * This wrapper component ensures all critical data is loaded
 * and restored before the app is rendered. It also provides
 * a loading indicator while data is being prepared.
 */
export default function RestoreAppWrapper({ children }: { children: React.ReactNode }) {
  const [isRestoring, setIsRestoring] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const restoreData = async () => {
      try {
        console.log(`🔄 Running critical data restoration attempt #${retryCount + 1}`);
        
        // Run all restoration methods in sequence
        const directlyRestored = forceRestoreUPSJACFL();
        const guaranteeRestored = guaranteeCriticalSiteIntegrity();
        const legacyRestored = forceRestoreJACFLAccess();
        
        if (directlyRestored || guaranteeRestored || legacyRestored) {
          console.log('✅ Critical data successfully restored');
          
          // If this is the first restore, try one more time to be safe
          if (retryCount < 1) {
            setRetryCount(retryCount + 1);
            return; // Will trigger another restoration cycle
          }
        }
        
        // Data is now ready, render the app
        setIsRestoring(false);
      } catch (error) {
        console.error('❌ Error during restoration:', error);
        
        // If we've retried less than 3 times, try again
        if (retryCount < 3) {
          setRetryCount(retryCount + 1);
        } else {
          // Give up and render the app anyway
          console.error('⛔ Maximum retries reached, proceeding with app render');
          setIsRestoring(false);
        }
      }
    };
    
    restoreData();
  }, [retryCount]);

  // Show a loading indicator while restoring data
  if (isRestoring) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 to-blue-900 text-white">
        <div className="text-center p-8 max-w-md">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-6"></div>
          <h1 className="text-2xl font-bold mb-2">Preparing Application</h1>
          <p className="text-blue-200">Loading critical system data...</p>
          <div className="mt-4 bg-white/10 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-blue-500 h-full transition-all duration-300 ease-in-out"
              style={{ width: `${Math.min(100, retryCount * 33 + 33)}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  // Render the app once data is ready
  return <>{children}</>;
}