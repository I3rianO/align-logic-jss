import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth } from '@devvai/devv-code-backend';

export interface User {
  projectId: string;
  uid: string;
  name: string;
  email: string;
  createdTime: number;
  lastLoginTime: number;
}

interface AuthState {
  // Authentication state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Role and permissions
  userRole: 'driver' | 'admin' | 'master' | null;
  companyId: string | null;
  siteId: string | null;
  employeeId: string | null; // For drivers
  
  // OTP flow state
  isOTPSent: boolean;
  otpEmail: string | null;
  
  // Actions
  sendOTP: (email: string, role: 'driver' | 'admin') => Promise<void>;
  verifyOTP: (email: string, code: string, role: 'driver' | 'admin', additionalData?: any) => Promise<User>;
  logout: () => Promise<void>;
  
  // Role-specific helpers
  isMasterAdmin: () => boolean;
  canAccessCompany: (companyId: string) => boolean;
  canAccessSite: (companyId: string, siteId: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      userRole: null,
      companyId: null,
      siteId: null,
      employeeId: null,
      isOTPSent: false,
      otpEmail: null,
      
      // Send OTP to email
      sendOTP: async (email: string, role: 'driver' | 'admin') => {
        try {
          set({ isLoading: true });
          
          await auth.sendOTP(email);
          
          set({
            isOTPSent: true,
            otpEmail: email,
            isLoading: false
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      // Verify OTP and complete login
      verifyOTP: async (email: string, code: string, role: 'driver' | 'admin', additionalData?: any) => {
        try {
          set({ isLoading: true });
          
          // Verify OTP with backend
          const response = await auth.verifyOTP(email, code);
          
          // Determine role and permissions based on login type
          let userRole: 'driver' | 'admin' | 'master' = role;
          let companyId: string | null = null;
          let siteId: string | null = null;
          let employeeId: string | null = null;
          
          if (role === 'admin') {
            // Admin login - check for master admin
            companyId = additionalData?.companyId || null;
            siteId = additionalData?.siteId || null;
            
            // Master admin check (UPS JACFL with master password)
            const isMaster = companyId === 'UPS' && siteId === 'JACFL' && additionalData?.isMasterLogin;
            if (isMaster) {
              userRole = 'master';
            }
          } else if (role === 'driver') {
            // Driver login
            employeeId = additionalData?.employeeId || null;
            companyId = additionalData?.companyId || null;
            siteId = additionalData?.siteId || null;
          }
          
          set({
            user: response.user,
            isAuthenticated: true,
            userRole,
            companyId,
            siteId,
            employeeId,
            isLoading: false,
            isOTPSent: false,
            otpEmail: null
          });
          
          return response.user;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      // Logout
      logout: async () => {
        try {
          await auth.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            userRole: null,
            companyId: null,
            siteId: null,
            employeeId: null,
            isOTPSent: false,
            otpEmail: null
          });
        }
      },
      
      // Check if user is master admin
      isMasterAdmin: () => {
        const state = get();
        return state.userRole === 'master' && 
               state.companyId === 'UPS' && 
               state.siteId === 'JACFL';
      },
      
      // Check if user can access specific company
      canAccessCompany: (targetCompanyId: string) => {
        const state = get();
        if (!state.isAuthenticated) return false;
        
        // Master admin can access all companies
        if (state.isMasterAdmin()) return true;
        
        // Regular users can only access their own company
        return state.companyId === targetCompanyId;
      },
      
      // Check if user can access specific site
      canAccessSite: (targetCompanyId: string, targetSiteId: string) => {
        const state = get();
        if (!state.isAuthenticated) return false;
        
        // Master admin can access all sites
        if (state.isMasterAdmin()) return true;
        
        // Regular users can only access their own company/site
        return state.companyId === targetCompanyId && state.siteId === targetSiteId;
      }
    }),
    {
      name: 'jss-auth-storage',
      // Don't persist sensitive authentication state
      // Only persist user info and basic permissions
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        userRole: state.userRole,
        companyId: state.companyId,
        siteId: state.siteId,
        employeeId: state.employeeId
      })
    }
  )
);