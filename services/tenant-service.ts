import { useAuthStore } from '@/store/auth-store';

/**
 * Tenant Service - Enforces multi-tenant data isolation
 * 
 * This service ensures that all data operations are automatically scoped
 * to the current user's company/site context, preventing cross-tenant data leaks.
 */
export class TenantService {
  
  /**
   * Get current user's tenant context with validation
   */
  getCurrentTenantContext(): { companyId: string; siteId: string } {
    const authState = useAuthStore.getState();
    
    if (!authState.isAuthenticated) {
      throw new Error('User must be authenticated to access tenant data');
    }
    
    if (!authState.companyId || !authState.siteId) {
      throw new Error('User context missing company/site information');
    }
    
    return {
      companyId: authState.companyId,
      siteId: authState.siteId
    };
  }
  
  /**
   * Validate if current user can access specific tenant data
   */
  validateTenantAccess(targetCompanyId: string, targetSiteId: string): boolean {
    const authState = useAuthStore.getState();
    
    // Master admins can access all tenants
    if (authState.isMasterAdmin()) {
      return true;
    }
    
    // Regular users can only access their own tenant
    return authState.canAccessSite(targetCompanyId, targetSiteId);
  }
  
  /**
   * Force tenant filtering on query parameters
   * Automatically injects user's company/site unless they're master admin
   */
  enforceTenantFiltering(params: any = {}): any {
    const authState = useAuthStore.getState();
    
    // Master admins can query across tenants (but must be explicit)
    if (authState.isMasterAdmin()) {
      return params;
    }
    
    // Regular users MUST be scoped to their tenant
    const { companyId, siteId } = this.getCurrentTenantContext();
    
    return {
      ...params,
      companyId,
      siteId
    };
  }
  
  /**
   * Validate that data belongs to user's tenant before operations
   */
  validateDataOwnership(data: any): void {
    const authState = useAuthStore.getState();
    
    // Master admins can operate on any data
    if (authState.isMasterAdmin()) {
      return;
    }
    
    // Regular users can only operate on their tenant's data
    if (data.companyId !== authState.companyId || data.siteId !== authState.siteId) {
      throw new Error(`Access denied: Data belongs to different tenant (${data.companyId}/${data.siteId})`);
    }
  }
  
  /**
   * Get list of tenants user can access
   */
  getAccessibleTenants(): Array<{ companyId: string; siteId: string; name: string }> {
    const authState = useAuthStore.getState();
    
    if (authState.isMasterAdmin()) {
      // Return all tenants (would need to query from database)
      return [
        { companyId: 'UPS', siteId: 'JACFL', name: 'UPS Jacksonville, FL' },
        { companyId: 'UPS', siteId: 'DALTX', name: 'UPS Dallas, TX' },
        { companyId: 'FEDEX', siteId: 'ORLFL', name: 'FedEx Orlando, FL' }
      ];
    } else {
      // Return only user's tenant
      return [{
        companyId: authState.companyId!,
        siteId: authState.siteId!,
        name: `${authState.companyId} ${authState.siteId}`
      }];
    }
  }
  
  /**
   * Check if current user has cross-tenant access
   */
  hasCrossTenantAccess(): boolean {
    return useAuthStore.getState().isMasterAdmin();
  }
  
  /**
   * Get tenant display name
   */
  getTenantDisplayName(companyId?: string, siteId?: string): string {
    const authState = useAuthStore.getState();
    const targetCompanyId = companyId || authState.companyId;
    const targetSiteId = siteId || authState.siteId;
    
    if (!targetCompanyId || !targetSiteId) {
      return 'Unknown Tenant';
    }
    
    // Map company/site codes to display names
    const companyNames = {
      'UPS': 'United Parcel Service',
      'FEDEX': 'FedEx',
      'DHL': 'DHL'
    };
    
    const siteNames = {
      'JACFL': 'Jacksonville, FL',
      'DALTX': 'Dallas, TX',
      'ORLFL': 'Orlando, FL'
    };
    
    const companyName = companyNames[targetCompanyId as keyof typeof companyNames] || targetCompanyId;
    const siteName = siteNames[targetSiteId as keyof typeof siteNames] || targetSiteId;
    
    return `${companyName} - ${siteName}`;
  }
}

// Export singleton instance
export const tenantService = new TenantService();