import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Driver, Job, JobPreference, JobAssignment, ManualAssignment } from './driverStore';

// Mock data - same as in driverStore.ts
const mockDrivers: Driver[] = [
  { employeeId: '1234567', name: 'John Smith', seniorityNumber: 1, vcStatus: false, airportCertified: true, isEligible: true },
  { employeeId: '2345678', name: 'Jane Doe', seniorityNumber: 2, vcStatus: true, airportCertified: true, isEligible: true },
  { employeeId: '3456789', name: 'Mike Johnson', seniorityNumber: 3, vcStatus: false, airportCertified: false, isEligible: true },
  { employeeId: '4567890', name: 'Sara Williams', seniorityNumber: 4, vcStatus: false, airportCertified: true, isEligible: false },
  { employeeId: '0123456', name: 'David Miller', seniorityNumber: 5, vcStatus: false, airportCertified: false, isEligible: true },
];

const mockJobs: Job[] = [
  { jobId: 'J001', startTime: '08:00', isAirport: false, weekDays: 'Mon-Fri' },
  { jobId: 'J002', startTime: '09:00', isAirport: true, weekDays: 'Mon-Fri' },
  { jobId: 'J003', startTime: '10:30', isAirport: false, weekDays: 'Mon-Thu' },
  { jobId: 'J004', startTime: '14:00', isAirport: true, weekDays: 'Mon-Wed-Fri' },
  { jobId: 'J005', startTime: '17:00', isAirport: false, weekDays: 'Tue-Wed-Thu-Fri' },
];

// Default cutoff time is Wednesday of current week at 3:00 PM
const getDefaultCutoffTime = () => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysUntilWednesday = (3 - dayOfWeek + 7) % 7; // Calculate days until next Wednesday
  
  const nextWednesday = new Date(now);
  nextWednesday.setDate(now.getDate() + daysUntilWednesday);
  nextWednesday.setHours(15, 0, 0, 0); // 3:00 PM
  
  return nextWednesday;
};

interface DriverState {
  drivers: Driver[];
  jobs: Job[];
  preferences: JobPreference[];
  manualAssignments: ManualAssignment[]; 
  cutoffTime: Date;
  isCutoffActive: boolean;
  isAutoCutoffScheduled: boolean;
  disableAutoAssignments: boolean;
  useSeniorityAssignment: boolean;
  
  // Actions
  addDriver: (driver: Driver) => void;
  updateDriver: (driver: Driver) => void;
  deleteDriver: (employeeId: string) => void;
  
  addJob: (job: Job) => void;
  updateJob: (job: Job) => void;
  deleteJob: (jobId: string) => void;
  
  submitPreferences: (preference: JobPreference) => void;
  updatePreferences: (preference: JobPreference) => void;
  
  assignJobManually: (driverId: string, jobId: string) => void;
  removeManualAssignment: (jobId: string) => void;
  
  setCutoffTime: (date: Date) => void;
  toggleCutoff: (isActive: boolean) => void;
  scheduleAutoCutoff: (schedule: boolean) => void;
  toggleAutoAssignments: (disabled: boolean) => void;
  toggleSeniorityAssignment: (enabled: boolean) => void;
  
  getEligibleDrivers: () => Driver[];
  getDriverPreferences: (employeeId: string) => string[] | null;
  getJobById: (jobId: string) => Job | undefined;
  
  calculateJobAssignments: () => JobAssignment[];
  getAssignedJobForDriver: (driverId: string) => string | null;
  exportAssignments: () => string;
  exportUnassignedJobs: () => string;
  exportDriversWithoutPicks: () => string;
  
  cleanPreferences: () => void;
  getUniqueDriverPreferences: () => JobPreference[];
}

// Helper function to ensure UPS company and JACFL site always exist in the data
const ensureCriticalData = (data: any): any => {
  // Check if data is valid
  if (!data || typeof data !== 'object') {
    console.warn('🚨 Invalid persistent data - creating new base data with UPS JACFL');
    // Create default base data structure with UPS and JACFL
    return {
      drivers: [],
      jobs: [],
      preferences: [],
      manualAssignments: [],
      cutoffTime: new Date(),
      isCutoffActive: false,
      isAutoCutoffScheduled: false,
      disableAutoAssignments: false,
      useSeniorityAssignment: false,
      companies: [{
        id: 'UPS',
        name: 'UPS',
        isActive: true,
        isFree: true,
        registrationDate: new Date().toISOString(),
        settings: {
          usesSeniorityForAssignment: true,
          usesVCStatus: true,
          airportCertificationRequired: true,
          maxDrivers: 1000,
          maxJobs: 500,
          maxSites: 10
        }
      }],
      sites: [{
        id: 'JACFL',
        name: 'Jacksonville, FL',
        companyId: 'UPS',
        address: '123 Main St, Jacksonville, FL 32256',
        isActive: true
      }],
      adminCredentials: [{
        username: 'admin',
        passwordHash: hashPassword('ups123'),
        companyId: 'UPS',
        siteId: 'JACFL',
        isSiteAdmin: true
      }],
      masterPassword: hashPassword('PBJ0103')
    };
  }
  
  // Simple hash function for password - same as in driverStore.ts
  function hashPassword(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }
  
  // Create deep copies of arrays we need to modify
  let companies = Array.isArray(data.companies) ? [...data.companies] : [];
  let sites = Array.isArray(data.sites) ? [...data.sites] : [];
  let adminCredentials = Array.isArray(data.adminCredentials) ? [...data.adminCredentials] : [];
  let dataChanged = false;
  
  // Check if UPS company exists
  if (!companies.some((c: any) => c && c.id === 'UPS')) {
    console.warn('🚨 UPS company missing - forcefully restoring');
    companies.push({
      id: 'UPS',
      name: 'UPS',
      isActive: true,
      isFree: true,
      registrationDate: new Date().toISOString(),
      settings: {
        usesSeniorityForAssignment: true,
        usesVCStatus: true,
        airportCertificationRequired: true,
        maxDrivers: 1000,
        maxJobs: 500,
        maxSites: 10
      }
    });
    console.log('UPS company restored in persistent store');
    dataChanged = true;
  }
  
  // Check if JACFL site exists
  if (!sites.some((s: any) => s && s.id === 'JACFL' && s.companyId === 'UPS')) {
    console.warn('🚨 JACFL site missing - forcefully restoring');
    sites.push({
      id: 'JACFL',
      name: 'Jacksonville, FL',
      companyId: 'UPS',
      address: '123 Main St, Jacksonville, FL 32256',
      isActive: true
    });
    console.log('JACFL site restored in persistent store');
    dataChanged = true;
  } else {
    // Make sure JACFL is active even if it exists
    const jacflIndex = sites.findIndex((s: any) => s && s.id === 'JACFL' && s.companyId === 'UPS');
    if (jacflIndex !== -1 && sites[jacflIndex].isActive !== true) {
      sites[jacflIndex].isActive = true;
      console.log('JACFL site was inactive - restored to active');
      dataChanged = true;
    }
  }
  
  // Check if UPS JACFL admin exists
  if (!adminCredentials.some((a: any) => a && a.companyId === 'UPS' && a.siteId === 'JACFL' && a.username === 'admin')) {
    console.warn('🚨 UPS JACFL admin credentials missing - forcefully restoring');
    
    adminCredentials.push({
      username: 'admin',
      passwordHash: hashPassword('ups123'),
      companyId: 'UPS',
      siteId: 'JACFL',
      isSiteAdmin: true
    });
    console.log('UPS JACFL admin restored in persistent store');
    dataChanged = true;
  }
  
  // Update masterPassword if missing or incorrect
  if (data.masterPassword !== hashPassword('PBJ0103')) {
    data.masterPassword = hashPassword('PBJ0103');
    console.log('Master password restored in persistent store');
    dataChanged = true;
  }
  
  // Force localStorage update if any critical data was changed
  if (dataChanged) {
    try {
      const localStorageKey = 'driver-storage';
      const currentData = localStorage.getItem(localStorageKey);
      if (currentData) {
        const parsedData = JSON.parse(currentData);
        parsedData.state.companies = companies;
        parsedData.state.sites = sites;
        parsedData.state.adminCredentials = adminCredentials;
        parsedData.state.masterPassword = hashPassword('PBJ0103');
        localStorage.setItem(localStorageKey, JSON.stringify(parsedData));
        console.log('📝 Critical data directly updated in localStorage');
      }
    } catch (error) {
      console.error('Failed to update localStorage directly:', error);
    }
  }
  
  return {
    ...data,
    companies,
    sites,
    adminCredentials,
    masterPassword: hashPassword('PBJ0103')
  };
};

// Simple hash function for password - same as in driverStore.ts
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
};

const usePersistentDriverStore = create<DriverState>()(
  persist(
    (set, get) => ({
      drivers: mockDrivers,
      jobs: mockJobs,
      preferences: [],
      manualAssignments: [],
      cutoffTime: getDefaultCutoffTime(),
      isCutoffActive: false,
      isAutoCutoffScheduled: false,
      disableAutoAssignments: false,
      useSeniorityAssignment: false,
      
      addDriver: (driver) => {
        set((state) => ({
          drivers: [...state.drivers, driver]
        }));
        
        setTimeout(() => get().cleanPreferences(), 0);
      },
      
      updateDriver: (driver) => {
        set((state) => ({
          drivers: state.drivers.map(d => 
            d.employeeId === driver.employeeId ? driver : d
          )
        }));
        
        setTimeout(() => get().cleanPreferences(), 0);
      },
      
      deleteDriver: (employeeId) => {
        set((state) => ({
          drivers: state.drivers.filter(d => d.employeeId !== employeeId)
        }));
        
        setTimeout(() => get().cleanPreferences(), 0);
      },
      
      addJob: (job) => {
        set((state) => ({
          jobs: [...state.jobs, job]
        }));
        setTimeout(() => get().cleanPreferences(), 0);
      },
      
      updateJob: (job) => {
        set((state) => ({
          jobs: state.jobs.map(j => 
            j.jobId === job.jobId ? job : j
          )
        }));
        setTimeout(() => get().cleanPreferences(), 0);
      },
      
      deleteJob: (jobId) => {
        set((state) => ({
          jobs: state.jobs.filter(j => j.jobId !== jobId)
        }));
        setTimeout(() => get().cleanPreferences(), 0);
      },
      
      submitPreferences: (preference) => {
        set((state) => {
          const filteredPreferences = state.preferences.filter(p => p.driverId !== preference.driverId);
          return {
            preferences: [...filteredPreferences, preference]
          };
        });
      },
      
      updatePreferences: (preference) => {
        set((state) => ({
          preferences: state.preferences.map(p => 
            p.driverId === preference.driverId ? preference : p
          )
        }));
      },
      
      assignJobManually: (driverId, jobId) => {
        set((state) => {
          const filteredAssignments = state.manualAssignments.filter(
            assignment => assignment.jobId !== jobId
          );
          
          return {
            manualAssignments: [
              ...filteredAssignments,
              { driverId, jobId }
            ]
          };
        });
      },
      
      removeManualAssignment: (jobId) => {
        set((state) => ({
          manualAssignments: state.manualAssignments.filter(
            assignment => assignment.jobId !== jobId
          )
        }));
      },
      
      setCutoffTime: (date) => {
        set({ cutoffTime: date });
      },
      
      toggleCutoff: (isActive) => {
        set({ isCutoffActive: isActive });
      },
      
      scheduleAutoCutoff: (schedule) => {
        set({ isAutoCutoffScheduled: schedule });
      },
      
      toggleAutoAssignments: (disabled) => {
        set({ disableAutoAssignments: disabled });
      },
    
      toggleSeniorityAssignment: (enabled) => {
        set({ useSeniorityAssignment: enabled });
      },
      
      getEligibleDrivers: () => {
        return get().drivers.filter(d => d.isEligible);
      },
      
      getDriverPreferences: (employeeId) => {
        const preference = get().preferences.find(p => p.driverId === employeeId);
        return preference ? preference.preferences : null;
      },
      
      getJobById: (jobId) => {
        return get().jobs.find(j => j.jobId === jobId);
      },
    
      getUniqueDriverPreferences: () => {
        const { preferences } = get();
        const driverMap = new Map<string, JobPreference>();
        
        preferences.forEach(pref => {
          const existing = driverMap.get(pref.driverId);
          if (!existing || new Date(pref.submissionTime) > new Date(existing.submissionTime)) {
            driverMap.set(pref.driverId, pref);
          }
        });
        
        return Array.from(driverMap.values());
      },
      
      cleanPreferences: () => {
        const { drivers, jobs, preferences, manualAssignments } = get();
        
        const validDriverIds = new Set(drivers.map(d => d.employeeId));
        const validJobIds = new Set(jobs.map(j => j.jobId));
        
        const validPreferences = preferences.filter(p => validDriverIds.has(p.driverId));
        
        const cleanedPreferences = validPreferences.map(p => ({
          ...p,
          preferences: p.preferences.filter(jobId => validJobIds.has(jobId))
        }));
        
        const driverMap = new Map<string, JobPreference>();
        cleanedPreferences.forEach(pref => {
          const existing = driverMap.get(pref.driverId);
          if (!existing || new Date(pref.submissionTime) > new Date(existing.submissionTime)) {
            driverMap.set(pref.driverId, pref);
          }
        });
        
        const validManualAssignments = manualAssignments.filter(
          assignment => validDriverIds.has(assignment.driverId) && validJobIds.has(assignment.jobId)
        );
        
        set({ 
          preferences: Array.from(driverMap.values()),
          manualAssignments: validManualAssignments
        });
      },
      
      calculateJobAssignments: () => {
        const { drivers, jobs, disableAutoAssignments, manualAssignments, useSeniorityAssignment } = get();
        const uniquePreferences = get().getUniqueDriverPreferences();
        const assignments: JobAssignment[] = [];
        const assignedJobs: Set<string> = new Set();
        const assignedDrivers: Set<string> = new Set();
        
        // Helper function to check if a driver made picks
        const driverMadePicks = (driverId: string): boolean => {
          return uniquePreferences.some(pref => pref.driverId === driverId);
        };
    
        // Helper function to check if a driver made sufficient picks
        const driverMadeSufficientPicks = (driverId: string): boolean => {
          const prefs = uniquePreferences.find(pref => pref.driverId === driverId);
          return prefs !== undefined && prefs.preferences.length > 0;
        };
        
        // Helper function to convert time strings to minutes for sorting
        const getMinutes = (timeStr: string): number => {
          const [hours, minutes] = timeStr.split(':').map(Number);
          return hours * 60 + minutes;
        };
        
        // Process manual assignments first (highest priority)
        for (const manual of manualAssignments) {
          const driver = drivers.find(d => d.employeeId === manual.driverId);
          const job = jobs.find(j => j.jobId === manual.jobId);
          
          if (driver && job) {
            assignments.push({ 
              driverId: driver.employeeId,
              jobId: job.jobId,
              driverName: driver.name,
              jobDetails: job,
              assignmentType: 'manual'
            });
            
            assignedJobs.add(job.jobId);
            assignedDrivers.add(driver.employeeId);
          }
        }
    
        // If using seniority-based assignment for drivers who didn't make sufficient picks
        if (useSeniorityAssignment) {
          // Implementation similar to original driverStore.ts
          // This is a placeholder - full implementation would match original
          return assignments;
        }
        
        // If not using seniority assignment, use the original assignment logic
        // Implementation similar to original driverStore.ts
        // This is a placeholder - full implementation would match original
        
        return assignments;
      },
      
      getAssignedJobForDriver: (driverId) => {
        const assignments = get().calculateJobAssignments();
        const driverAssignment = assignments.find(a => a.driverId === driverId);
        return driverAssignment ? driverAssignment.jobId : null;
      },
      
      exportAssignments: () => {
        const { drivers, jobs } = get();
        const assignments = get().calculateJobAssignments();
        
        let csvContent = "Driver ID,Driver Name,Seniority Number,VC Status,Job ID,Job Start Time,Week Days,Airport Job,Assignment Type\n";
        
        assignments.forEach(assignment => {
          const driver = drivers.find(d => d.employeeId === assignment.driverId);
          const job = jobs.find(j => j.jobId === assignment.jobId);
          
          if (driver && job) {
            const assignmentTypeMap = {
              'preference': 'Pick',
              'vc-assigned': 'Auto',
              'manual': 'Manual',
              'airport-auto': 'Airport Auto',
              'airport-driver': 'Airport Driver',
              'airport-driver-pool': 'Airport Driver Pool',
              'seniority': 'Seniority'
            };
    
            csvContent += `${driver.employeeId},${driver.name},${driver.seniorityNumber},${driver.vcStatus ? 'Yes' : 'No'},${job.jobId},${job.startTime},${job.weekDays},${job.isAirport ? 'Yes' : 'No'},${assignmentTypeMap[assignment.assignmentType]}\n`;
          }
        });
        
        return csvContent;
      },
      
      exportUnassignedJobs: () => {
        const { jobs } = get();
        const assignments = get().calculateJobAssignments();
        const assignedJobIds = assignments.map(a => a.jobId);
        
        const unassignedJobs = jobs.filter(job => !assignedJobIds.includes(job.jobId));
        
        let csvContent = "Job ID,Start Time,Work Days,Airport Job\n";
        
        unassignedJobs.forEach(job => {
          csvContent += `${job.jobId},${job.startTime},${job.weekDays},${job.isAirport ? 'Yes' : 'No'}\n`;
        });
        
        return csvContent;
      },
      
      exportDriversWithoutPicks: () => {
        const { drivers } = get();
        const uniquePreferences = get().getUniqueDriverPreferences();
        
        const eligibleDrivers = drivers.filter(d => d.isEligible);
        const driversWithoutPicks = eligibleDrivers.filter(
          driver => !uniquePreferences.some(pref => pref.driverId === driver.employeeId)
        );
        
        let csvContent = "Driver ID,Driver Name,Seniority Number,VC Status,Airport Certified\n";
        
        driversWithoutPicks.forEach(driver => {
          csvContent += `${driver.employeeId},${driver.name},${driver.seniorityNumber},${driver.vcStatus ? 'Yes' : 'No'},${driver.airportCertified ? 'Yes' : 'No'}\n`;
        });
        
        return csvContent;
      }
    }),
    {
      name: 'driver-storage', // unique name for localStorage
      // Advanced options to handle serializing Date objects and parsing them back correctly
      serialize: (state) => JSON.stringify({
        ...state,
        cutoffTime: state.cutoffTime.toISOString(),
      }),
      deserialize: (str) => {
        try {
          let state = JSON.parse(str);
          
          // Apply data integrity check to ensure UPS/JACFL always exist
          state = ensureCriticalData(state);
          
          // Additional verification that critical data is present
          const hasUPS = state.companies?.some((c: any) => c && c.id === 'UPS');
          const hasJACFL = state.sites?.some((s: any) => s && s.id === 'JACFL' && s.companyId === 'UPS');
          const hasJACFLAdmin = state.adminCredentials?.some(
            (a: any) => a && a.username === 'admin' && a.companyId === 'UPS' && a.siteId === 'JACFL'
          );
          
          if (!hasUPS || !hasJACFL || !hasJACFLAdmin) {
            console.error('🚨 CRITICAL: Data integrity check failed, recreating default data');
            // Force recreation of default data
            return {
              drivers: [],
              jobs: [],
              preferences: [],
              manualAssignments: [],
              cutoffTime: new Date(),
              companies: [{
                id: 'UPS',
                name: 'UPS',
                isActive: true,
                isFree: true,
                registrationDate: new Date().toISOString(),
                settings: {
                  usesSeniorityForAssignment: true,
                  usesVCStatus: true,
                  airportCertificationRequired: true,
                  maxDrivers: 1000,
                  maxJobs: 500,
                  maxSites: 10
                }
              }],
              sites: [{
                id: 'JACFL',
                name: 'Jacksonville, FL',
                companyId: 'UPS',
                address: '123 Main St, Jacksonville, FL 32256',
                isActive: true
              }],
              adminCredentials: [{
                username: 'admin',
                passwordHash: hashPassword('ups123'),
                companyId: 'UPS',
                siteId: 'JACFL',
                isSiteAdmin: true
              }],
              masterPassword: hashPassword('PBJ0103')
            };
          }
          
          return {
            ...state,
            cutoffTime: new Date(state.cutoffTime),
          };
        } catch (error) {
          console.error('🚨 Error deserializing persistent store:', error);
          // Return initial default data on error
          return {
            drivers: [],
            jobs: [],
            preferences: [],
            manualAssignments: [],
            cutoffTime: new Date(),
            companies: [{
              id: 'UPS',
              name: 'UPS',
              isActive: true,
              isFree: true,
              registrationDate: new Date().toISOString(),
              settings: {
                usesSeniorityForAssignment: true,
                usesVCStatus: true,
                airportCertificationRequired: true,
                maxDrivers: 1000,
                maxJobs: 500,
                maxSites: 10
              }
            }],
            sites: [{
              id: 'JACFL',
              name: 'Jacksonville, FL',
              companyId: 'UPS',
              address: '123 Main St, Jacksonville, FL 32256',
              isActive: true
            }],
            adminCredentials: [{
              username: 'admin',
              passwordHash: hashPassword('ups123'),
              companyId: 'UPS',
              siteId: 'JACFL',
              isSiteAdmin: true
            }],
            masterPassword: hashPassword('PBJ0103')
          };
        }
      },
    }
  )
);

export default usePersistentDriverStore;