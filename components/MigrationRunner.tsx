import React, { useState } from 'react';
import { migrationService, MigrationResult } from '@/services/migrationService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Clock, Database, HardDrive } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Migration Runner Component - Provides UI for running data migration
 */
export const MigrationRunner: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [status, setStatus] = useState<any>(null);

  // Load initial status
  React.useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const statusData = await migrationService.getMigrationStatus();
      setStatus(statusData);
    } catch (error) {
      console.error('Failed to load migration status:', error);
    }
  };

  const runMigration = async (dryRun = false) => {
    if (isRunning) return;

    setIsRunning(true);
    setResult(null);

    try {
      console.log(`🚀 ${dryRun ? 'DRY RUN' : 'RUNNING'} Migration...`);
      
      const migrationResult = await migrationService.runMigration({
        dryRun,
        validateData: true,
        skipExisting: true
      });

      setResult(migrationResult);
      
      if (migrationResult.success) {
        console.log('✅ Migration completed successfully!');
        await loadStatus(); // Refresh status
      } else {
        console.error('❌ Migration failed:', migrationResult.errors);
      }

    } catch (error) {
      console.error('Migration error:', error);
      setResult({
        success: false,
        message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        migratedCounts: { companies: 0, sites: 0, drivers: 0, jobs: 0, preferences: 0 },
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duration: 0
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getTotalItems = (counts: any) => {
    return Object.values(counts).reduce((total: number, count: any) => total + (count || 0), 0);
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">JSS Data Migration</h1>
        <p className="text-muted-foreground">
          Migrate your Job Selection System data from localStorage to backend database
        </p>
      </div>

      {/* Current Status */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Current Data Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  <span className="font-medium">Local Storage</span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Companies: {status.localCounts.companies}</div>
                  <div>Sites: {status.localCounts.sites}</div>
                  <div>Drivers: {status.localCounts.drivers}</div>
                  <div>Jobs: {status.localCounts.jobs}</div>
                  <div>Preferences: {status.localCounts.preferences}</div>
                  <div className="font-medium pt-1">
                    Total: {getTotalItems(status.localCounts)} items
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span className="font-medium">Backend Database</span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Companies: {status.backendCounts.companies}</div>
                  <div>Sites: {status.backendCounts.sites}</div>
                  <div>Drivers: {status.backendCounts.drivers}</div>
                  <div>Jobs: {status.backendCounts.jobs}</div>
                  <div>Preferences: {status.backendCounts.preferences}</div>
                  <div className="font-medium pt-1">
                    Total: {getTotalItems(status.backendCounts)} items
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="text-sm">
                <span className="font-medium">Backend Mode: </span>
                <span className={status.backendEnabled ? 'text-green-600' : 'text-orange-600'}>
                  {status.backendEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Migration Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Migration Controls</CardTitle>
          <CardDescription>
            Run a dry run first to test the migration, then run the actual migration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={() => runMigration(true)}
              disabled={isRunning}
              variant="outline"
            >
              {isRunning ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                'Dry Run'
              )}
            </Button>
            
            <Button
              onClick={() => runMigration(false)}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRunning ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Migrating...
                </>
              ) : (
                'Run Migration'
              )}
            </Button>
            
            <Button
              onClick={loadStatus}
              variant="ghost"
            >
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Migration Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert className={result.success ? 'border-green-200' : 'border-red-200'}>
                <AlertDescription>
                  {result.message}
                </AlertDescription>
              </Alert>

              {result.success && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Migrated Items:</h4>
                    <div className="text-sm space-y-1">
                      <div>Companies: {result.migratedCounts.companies}</div>
                      <div>Sites: {result.migratedCounts.sites}</div>
                      <div>Drivers: {result.migratedCounts.drivers}</div>
                      <div>Jobs: {result.migratedCounts.jobs}</div>
                      <div>Preferences: {result.migratedCounts.preferences}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Statistics:</h4>
                    <div className="text-sm space-y-1">
                      <div>Duration: {result.duration}ms</div>
                      <div>Total Items: {getTotalItems(result.migratedCounts)}</div>
                      <div>Status: {result.success ? '✅ Success' : '❌ Failed'}</div>
                    </div>
                  </div>
                </div>
              )}

              {result.errors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-red-600">Errors:</h4>
                  <div className="text-sm space-y-1">
                    {result.errors.map((error, index) => (
                      <div key={index} className="text-red-600 font-mono bg-red-50 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Migration Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Review your current data status above</li>
            <li>Run a "Dry Run" to test the migration process without making changes</li>
            <li>If the dry run succeeds, click "Run Migration" to perform the actual migration</li>
            <li>After successful migration, your system will automatically switch to backend mode</li>
            <li>Verify that all data appears correctly in your application</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};