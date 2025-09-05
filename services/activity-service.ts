import { dataService } from './data-service';
import { tenantService } from './tenant-service';

export interface ActivityItem {
  id: string;
  type: 'preference_submitted' | 'driver_login' | 'driver_added' | 'job_added' | 'driver_updated' | 'admin_login';
  description: string;
  timestamp: string;
  driverName?: string;
  jobId?: string;
  metadata?: Record<string, any>;
}

/**
 * Activity Service - Provides tenant-scoped activity tracking
 * 
 * This service ensures activity feeds only show actions within the user's tenant,
 * preventing information leakage between different companies/sites.
 */
export class ActivityService {
  private activities: ActivityItem[] = [];
  
  /**
   * Log a new activity (automatically scoped to current tenant)
   */
  logActivity(activity: Omit<ActivityItem, 'id' | 'timestamp'>): void {
    const authStore = useAuthStore.getState();
    
    // Only log activities for authenticated users
    if (!authStore.isAuthenticated) return;
    
    const newActivity: ActivityItem = {
      ...activity,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      metadata: {
        ...activity.metadata,
        companyId: authStore.companyId,
        siteId: authStore.siteId,
        userRole: authStore.userRole
      }
    };
    
    this.activities.unshift(newActivity);
    
    // Keep only last 100 activities to prevent memory bloat
    if (this.activities.length > 100) {
      this.activities = this.activities.slice(0, 100);
    }
  }
  
  /**
   * Get activities scoped to current user's tenant
   */
  getTenantActivities(limit: number = 20): ActivityItem[] {
    const authStore = useAuthStore.getState();
    
    if (!authStore.isAuthenticated) return [];
    
    // Master admins can see all activities, regular users only see their tenant
    if (authStore.isMasterAdmin()) {
      return this.activities.slice(0, limit);
    }
    
    // Filter activities by tenant
    return this.activities
      .filter(activity => 
        activity.metadata?.companyId === authStore.companyId &&
        activity.metadata?.siteId === authStore.siteId
      )
      .slice(0, limit);
  }
  
  /**
   * Get real-time statistics for current tenant
   */
  async getTenantStatistics(): Promise<{
    totalDrivers: number;
    totalJobs: number;
    submittedPreferences: number;
    pendingDrivers: number;
    recentActivity: number;
    conflictsResolved: number;
  }> {
    try {
      const [stats, activities] = await Promise.all([
        dataService.getTenantStatistics(),
        this.getTenantActivities(50)
      ]);
      
      // Count recent activity (last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentActivity = activities.filter(
        activity => new Date(activity.timestamp) > oneDayAgo
      ).length;
      
      return {
        ...stats,
        recentActivity,
        conflictsResolved: 0 // TODO: Implement conflict tracking
      };
    } catch (error) {
      console.error('Failed to get tenant statistics:', error);
      return {
        totalDrivers: 0,
        totalJobs: 0,
        submittedPreferences: 0,
        pendingDrivers: 0,
        recentActivity: 0,
        conflictsResolved: 0
      };
    }
  }
  
  /**
   * Clear activities (admin only)
   */
  clearActivities(): void {
    this.activities = [];
  }
  
  /**
   * Get activity summary for tenant dashboard
   */
  getActivitySummary(): {
    todayCount: number;
    weekCount: number;
    topActivity: string;
  } {
    const activities = this.getTenantActivities(100);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const todayCount = activities.filter(
      activity => new Date(activity.timestamp) >= today
    ).length;
    
    const weekCount = activities.filter(
      activity => new Date(activity.timestamp) >= weekAgo
    ).length;
    
    // Find most common activity type
    const activityTypes = activities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topActivity = Object.entries(activityTypes)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';
    
    return {
      todayCount,
      weekCount,
      topActivity
    };
  }
}

// Export singleton instance
export const activityService = new ActivityService();

// Import useAuthStore after class definition to avoid circular dependency
import { useAuthStore } from '@/store/auth-store';