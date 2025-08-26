import { create } from 'zustand';

export interface Driver {
  employeeId: string;
  name: string;
  seniorityNumber: number;
  vcStatus: boolean;
  airportCertified: boolean;
  isEligible: boolean;
  passwordSet: boolean; // Flag indicating if the driver has set up a password
  securityQuestionsSet: boolean; // Flag indicating if security questions have been set up
  companyId: string; // Company this driver belongs to
  siteId: string; // Site location within the company
}

export interface DriverCredentials {
  driverId: string;
  passwordHash: string | null; // Hashed password, never store in plain text
  securityQuestions: {
    question1: string;
    answer1: string;
    question2: string;
    answer2: string;
  } | null;
}

export interface AdminCredentials {
  username: string;
  passwordHash: string;
  companyId: string; // Company this admin belongs to
  siteId: string; // Site location within the company
  isSiteAdmin: boolean; // Whether this is a site-level admin or company-level
}

export interface Job {
  jobId: string;
  startTime: string;
  isAirport: boolean;
  weekDays: string; // Mon-Fri, Mon-Thu, etc.
  companyId: string; // Company this job belongs to
  siteId: string; // Site location within the company
}

export interface JobPreference {
  driverId: string;
  preferences: string[];  // Array of jobIds in order of preference
  submissionTime: string;
}

export interface DriverActivity {
  driverId: string;
  driverName: string;
  action: 'login' | 'logout' | 'view' | 'create' | 'update' | 'delete';
  timestamp: string;
  details: string;
  jobDetails?: string[]; // Added field for storing relevant job IDs
}

export interface JobAssignment {
  driverId: string;
  jobId: string;
  driverName?: string;
  jobDetails?: Job;
  assignmentType: 'preference' | 'vc-assigned' | 'manual' | 'airport-auto' | 'airport-driver' | 'airport-driver-pool' | 'seniority'; // Added 'seniority' type
}

interface ManualAssignment {
  driverId: string;
  jobId: string;
}

interface SystemSettings {
  allowDriverPrinting: boolean;
  darkMode: boolean; // Setting for dark mode
  isPortalOpen: boolean; // Control whether the driver portal is open
  scheduledClosureEnabled: boolean; // Whether a scheduled closure is active
  scheduledClosureDate: string; // The date of scheduled closure
  scheduledClosureTime: string; // The time of scheduled closure
  companyId: string; // Company these settings apply to
  siteId: string; // Site location within the company
}

export interface Company {
  id: string; // Unique identifier for the company
  name: string; // Company name
  isActive: boolean; // Whether this company is active
  isFree: boolean; // Whether this is a free account
  registrationDate: string; // When this company was registered
  settings: {
    usesSeniorityForAssignment: boolean; // Whether to use seniority-based assignment
    usesVCStatus: boolean; // Whether to use VC status for assignments
    airportCertificationRequired: boolean; // Whether airport certification is required
    maxDrivers: number; // Maximum number of drivers allowed
    maxJobs: number; // Maximum number of jobs allowed
    maxSites: number; // Maximum number of sites allowed
  }
}

export interface Site {
  id: string; // Unique identifier for the site
  name: string; // Site name
  companyId: string; // Company this site belongs to
  address: string; // Physical address
  isActive: boolean; // Whether this site is active
}

export interface RegistrationRequest {
  id: string; // Unique identifier for this request
  companyName: string; // Company name
  contactName: string; // Contact person name
  contactEmail: string; // Contact email
  contactPhone: string; // Contact phone number
  requestDate: string; // When this request was submitted
  status: 'pending' | 'approved' | 'denied'; // Status of the request
  notes: string; // Additional notes
  siteCode: string; // Site code (e.g., JACFL, DALTX)
  siteName: string; // Site name (e.g., Jacksonville, FL)
  siteAddress: string; // Physical address of the site
  denialReason?: string; // Reason for denial if status is 'denied'
}

interface DriverState {
  drivers: Driver[];
  jobs: Job[];
  preferences: JobPreference[];
  manualAssignments: ManualAssignment[]; // New state for manual assignments
  cutoffTime: Date;
  isCutoffActive: boolean;
  isAutoCutoffScheduled: boolean;
  disableAutoAssignments: boolean; // New flag to disable auto assignments
  useSeniorityAssignment: boolean; // New flag to force seniority-based assignments
  systemSettings: SystemSettings; // System settings
  driverCredentials: DriverCredentials[];
  adminCredentials: AdminCredentials[];
  driverActivity: DriverActivity[]; // Log of all driver activity
  masterPassword: string; // Master password for system access
  companies: Company[]; // List of companies using the system
  sites: Site[]; // List of sites across all companies
  registrationRequests: RegistrationRequest[]; // List of pending registration requests
  currentCompanyId: string; // Currently selected company ID
  currentSiteId: string; // Currently selected site ID
  
  // Actions
  addDriver: (driver: Driver) => void;
  updateDriver: (driver: Driver) => void;
  deleteDriver: (employeeId: string) => void;
  
  addJob: (job: Job) => void;
  updateJob: (job: Job) => void;
  deleteJob: (jobId: string) => void;
  
  submitPreferences: (preference: JobPreference) => void;
  updatePreferences: (preference: JobPreference) => void;
  
  // Manual assignment actions
  assignJobManually: (driverId: string, jobId: string) => void;
  removeManualAssignment: (jobId: string) => void;
  
  setCutoffTime: (date: Date) => void;
  toggleCutoff: (isActive: boolean) => void;
  scheduleAutoCutoff: (schedule: boolean) => void;
  toggleAutoAssignments: (disabled: boolean) => void; // New function to toggle auto assignments
  toggleSeniorityAssignment: (enabled: boolean) => void; // New function to toggle seniority-based assignment
  
  // System settings actions
  updateSystemSettings: (settings: Partial<SystemSettings>) => void;
  toggleDarkMode: (enabled: boolean) => void; // Toggle dark mode
  
  getEligibleDrivers: () => Driver[];
  getDriverPreferences: (employeeId: string) => string[] | null;
  getJobById: (jobId: string) => Job | undefined;
  
  // Job assignment functions
  calculateJobAssignments: () => JobAssignment[];
  getAssignedJobForDriver: (driverId: string) => string | null;
  exportAssignments: () => string;
  exportUnassignedJobs: () => string;
  exportDriversWithoutPicks: () => string;
  
  // Clean preferences that refer to non-existent drivers or jobs
  cleanPreferences: () => void;

  // Get deduplicated driver preferences
  getUniqueDriverPreferences: () => JobPreference[];
  
  // Password and security functions
  validateDriverCredentials: (driverId: string, password: string) => boolean;
  setDriverPassword: (driverId: string, password: string) => void;
  setDriverSecurityQuestions: (
    driverId: string, 
    questions: { question1: string, answer1: string, question2: string, answer2: string }
  ) => void;
  resetDriverPassword: (driverId: string) => void;
  validateSecurityAnswers: (driverId: string, answers: { answer1: string, answer2: string }) => boolean;
  getDriverSecurityQuestions: (driverId: string) => { question1: string, question2: string } | null;
  
  // Admin password management
  validateAdminCredentials: (username: string, password: string) => boolean;
  setAdminPassword: (username: string, oldPassword: string, newPassword: string) => boolean;
  validateMasterPassword: (password: string) => boolean;
  
  // Driver activity logging
  logDriverActivity: (activity: Omit<DriverActivity, 'timestamp'>) => void;
  getDriverActivities: (driverId?: string) => DriverActivity[];
  exportActivityLog: () => string;
  
  // Multi-tenant functions
  getSiteById: (siteId: string) => Site | undefined;
  getCompanyById: (companyId: string) => Company | undefined;
  getDriversByCompanySite: (companyId?: string, siteId?: string) => Driver[];
  getJobsByCompanySite: (companyId?: string, siteId?: string) => Job[];
  getSitesByCompany: (companyId?: string) => Site[];
  setCurrentCompany: (companyId: string) => void;
  setCurrentSite: (siteId: string) => void;
  
  // Registration request management
  addRegistrationRequest: (request: Omit<RegistrationRequest, 'id' | 'requestDate' | 'status'>) => string;
  updateRegistrationRequest: (id: string, updates: Partial<RegistrationRequest>) => void;
  
  // Company management
  addCompany: (company: Omit<Company, 'id' | 'registrationDate' | 'isActive'>) => string;
  updateCompany: (id: string, updates: Partial<Company>) => void;
  
  // Site management
  addSite: (site: Omit<Site, 'isActive'>) => void;
  updateSite: (id: string, updates: Partial<Site>) => void;
  
  // System metrics
  getSystemMetrics: () => {
    totalCompanies: number;
    activeCompanies: number;
    totalSites: number;
    activeSites: number;
    totalDrivers: number;
    totalJobs: number;
    activityLast24Hours: number;
    activityLast7Days: number;
    companyMetrics: {
      companyId: string;
      companyName: string;
      sites: number;
      drivers: number;
      jobs: number;
      isActive: boolean;
    }[];
  }
  
  // Actions
  addDriver: (driver: Driver) => void;
  updateDriver: (driver: Driver) => void;
  deleteDriver: (employeeId: string) => void;
  
  addJob: (job: Job) => void;
  updateJob: (job: Job) => void;
  deleteJob: (jobId: string) => void;
  
  submitPreferences: (preference: JobPreference) => void;
  updatePreferences: (preference: JobPreference) => void;
  
  // Manual assignment actions
  assignJobManually: (driverId: string, jobId: string) => void;
  removeManualAssignment: (jobId: string) => void;
  
  setCutoffTime: (date: Date) => void;
  toggleCutoff: (isActive: boolean) => void;
  scheduleAutoCutoff: (schedule: boolean) => void;
  toggleAutoAssignments: (disabled: boolean) => void; // New function to toggle auto assignments
  toggleSeniorityAssignment: (enabled: boolean) => void; // New function to toggle seniority-based assignment
  
  // System settings actions
  updateSystemSettings: (settings: Partial<SystemSettings>) => void;
  toggleDarkMode: (enabled: boolean) => void; // Toggle dark mode
  
  getEligibleDrivers: () => Driver[];
  getDriverPreferences: (employeeId: string) => string[] | null;
  getJobById: (jobId: string) => Job | undefined;
  
  // Job assignment functions
  calculateJobAssignments: () => JobAssignment[];
  getAssignedJobForDriver: (driverId: string) => string | null;
  exportAssignments: () => string;
  exportUnassignedJobs: () => string;
  exportDriversWithoutPicks: () => string;
  
  // Clean preferences that refer to non-existent drivers or jobs
  cleanPreferences: () => void;

  // Get deduplicated driver preferences
  getUniqueDriverPreferences: () => JobPreference[];
  
  // Password and security functions
  validateDriverCredentials: (driverId: string, password: string) => boolean;
  setDriverPassword: (driverId: string, password: string) => void;
  setDriverSecurityQuestions: (
    driverId: string, 
    questions: { question1: string, answer1: string, question2: string, answer2: string }
  ) => void;
  resetDriverPassword: (driverId: string) => void;
  validateSecurityAnswers: (driverId: string, answers: { answer1: string, answer2: string }) => boolean;
  getDriverSecurityQuestions: (driverId: string) => { question1: string, question2: string } | null;
  
  // Admin password management
  validateAdminCredentials: (username: string, password: string) => boolean;
  setAdminPassword: (username: string, oldPassword: string, newPassword: string) => boolean;
  validateMasterPassword: (password: string) => boolean;
  
  // Driver activity logging
  logDriverActivity: (activity: Omit<DriverActivity, 'timestamp'>) => void;
  getDriverActivities: (driverId?: string) => DriverActivity[];
  exportActivityLog: () => string;
}

// Import the consistent hash function from utils
import { hashPassword } from '@/utils/passwordUtils';

// Mock data
// Initial drivers data for new installations
const initialDrivers: Driver[] = [
  // JACFL Drivers (Jacksonville, FL)
  { employeeId: '1234567', name: 'John Smith', seniorityNumber: 1, vcStatus: false, airportCertified: true, isEligible: true, passwordSet: false, securityQuestionsSet: false, companyId: 'UPS', siteId: 'JACFL' },
  { employeeId: '2345678', name: 'Jane Doe', seniorityNumber: 2, vcStatus: true, airportCertified: true, isEligible: true, passwordSet: false, securityQuestionsSet: false, companyId: 'UPS', siteId: 'JACFL' },
  { employeeId: '3456789', name: 'Mike Johnson', seniorityNumber: 3, vcStatus: false, airportCertified: false, isEligible: true, passwordSet: false, securityQuestionsSet: false, companyId: 'UPS', siteId: 'JACFL' },
  { employeeId: '4567890', name: 'Sara Williams', seniorityNumber: 4, vcStatus: false, airportCertified: true, isEligible: false, passwordSet: false, securityQuestionsSet: false, companyId: 'UPS', siteId: 'JACFL' },
  { employeeId: '0123456', name: 'David Miller', seniorityNumber: 5, vcStatus: false, airportCertified: false, isEligible: true, passwordSet: false, securityQuestionsSet: false, companyId: 'UPS', siteId: 'JACFL' },
  { employeeId: '0567890', name: 'Emma Parker', seniorityNumber: 6, vcStatus: true, airportCertified: true, isEligible: true, passwordSet: false, securityQuestionsSet: false, companyId: 'UPS', siteId: 'JACFL' },
  { employeeId: '9012345', name: 'James Wilson', seniorityNumber: 7, vcStatus: true, airportCertified: false, isEligible: true, passwordSet: false, securityQuestionsSet: false, companyId: 'UPS', siteId: 'JACFL' },
  { employeeId: '8765432', name: 'Olivia Martinez', seniorityNumber: 8, vcStatus: false, airportCertified: true, isEligible: true, passwordSet: false, securityQuestionsSet: false, companyId: 'UPS', siteId: 'JACFL' },
  
  // DALTX Drivers (Dallas, TX)
  { employeeId: '5678901', name: 'Robert Chen', seniorityNumber: 1, vcStatus: true, airportCertified: true, isEligible: true, passwordSet: false, securityQuestionsSet: false, companyId: 'UPS', siteId: 'DALTX' },
  { employeeId: '6789012', name: 'Maria Garcia', seniorityNumber: 2, vcStatus: false, airportCertified: true, isEligible: true, passwordSet: false, securityQuestionsSet: false, companyId: 'UPS', siteId: 'DALTX' },
  { employeeId: '7890123', name: 'Alex Turner', seniorityNumber: 3, vcStatus: true, airportCertified: false, isEligible: true, passwordSet: false, securityQuestionsSet: false, companyId: 'UPS', siteId: 'DALTX' },
  { employeeId: '2468101', name: 'Thomas Wright', seniorityNumber: 4, vcStatus: false, airportCertified: true, isEligible: true, passwordSet: false, securityQuestionsSet: false, companyId: 'UPS', siteId: 'DALTX' },
  { employeeId: '1357924', name: 'Sarah Johnson', seniorityNumber: 5, vcStatus: true, airportCertified: false, isEligible: true, passwordSet: false, securityQuestionsSet: false, companyId: 'UPS', siteId: 'DALTX' },
  { employeeId: '0987654', name: 'Kevin Lee', seniorityNumber: 6, vcStatus: false, airportCertified: false, isEligible: true, passwordSet: false, securityQuestionsSet: false, companyId: 'UPS', siteId: 'DALTX' },
  { employeeId: '0246813', name: 'Lisa Rodriguez', seniorityNumber: 7, vcStatus: true, airportCertified: true, isEligible: true, passwordSet: false, securityQuestionsSet: false, companyId: 'UPS', siteId: 'DALTX' },
];

const initialJobs: Job[] = [
  { jobId: 'J001', startTime: '08:00', isAirport: false, weekDays: 'Mon-Fri', companyId: 'UPS', siteId: 'JACFL' },
  { jobId: 'J002', startTime: '09:00', isAirport: true, weekDays: 'Mon-Fri', companyId: 'UPS', siteId: 'JACFL' },
  { jobId: 'J003', startTime: '10:30', isAirport: false, weekDays: 'Mon-Thu', companyId: 'UPS', siteId: 'JACFL' },
  { jobId: 'J004', startTime: '14:00', isAirport: true, weekDays: 'Mon-Wed-Fri', companyId: 'UPS', siteId: 'JACFL' },
  { jobId: 'J005', startTime: '17:00', isAirport: false, weekDays: 'Tue-Wed-Thu-Fri', companyId: 'UPS', siteId: 'JACFL' },
  
  // Add some jobs for a different site (DALTX)
  { jobId: 'J101', startTime: '07:30', isAirport: true, weekDays: 'Mon-Fri', companyId: 'UPS', siteId: 'DALTX' },
  { jobId: 'J102', startTime: '09:30', isAirport: false, weekDays: 'Mon-Fri', companyId: 'UPS', siteId: 'DALTX' },
  { jobId: 'J103', startTime: '13:00', isAirport: false, weekDays: 'Mon-Wed-Fri', companyId: 'UPS', siteId: 'DALTX' },
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

// Initial company and site data for new installations
const initialCompanies: Company[] = [
  {
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
  },
  {
    id: 'FEDEX',
    name: 'FedEx',
    isActive: false, // Not active yet, pending approval
    isFree: false,
    registrationDate: new Date().toISOString(),
    settings: {
      usesSeniorityForAssignment: true,
      usesVCStatus: false,
      airportCertificationRequired: true,
      maxDrivers: 100,
      maxJobs: 50,
      maxSites: 5
    }
  }
];

const initialSites: Site[] = [
  {
    id: 'JACFL',
    name: 'Jacksonville, FL',
    companyId: 'UPS',
    address: '123 Main St, Jacksonville, FL 32256',
    isActive: true
  },
  {
    id: 'DALTX',
    name: 'Dallas, TX',
    companyId: 'UPS',
    address: '456 Commerce Ave, Dallas, TX 75201',
    isActive: true
  },
  {
    id: 'MEMTN',
    name: 'Memphis, TN',
    companyId: 'FEDEX',
    address: '789 Delivery Blvd, Memphis, TN 38103',
    isActive: false // Not active yet, pending approval
  }
];

// Function to check if UPS and JACFL site exists, if not add them
const ensureUPSJACFLExists = (sites: Site[], companies: Company[]): { updatedSites: Site[], updatedCompanies: Company[] } => {
  let updatedSites = [...sites];
  let updatedCompanies = [...companies];
  
  // Check if UPS company exists
  if (!updatedCompanies.some(company => company.id === 'UPS')) {
    // Add UPS company if it doesn't exist
    updatedCompanies.push({
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
  }
  
  // Check if JACFL site exists
  if (!updatedSites.some(site => site.id === 'JACFL' && site.companyId === 'UPS')) {
    // Add JACFL site if it doesn't exist
    updatedSites.push({
      id: 'JACFL',
      name: 'Jacksonville, FL',
      companyId: 'UPS',
      address: '123 Main St, Jacksonville, FL 32256',
      isActive: true
    });
  }
  
  return { updatedSites, updatedCompanies };
};

const mockRegistrationRequests: RegistrationRequest[] = [
  {
    id: 'REQ001',
    companyName: 'FedEx',
    contactName: 'William Smith',
    contactEmail: 'w.smith@fedex.com',
    contactPhone: '555-123-4567',
    requestDate: new Date().toISOString(),
    status: 'pending',
    notes: 'Requesting 5 site licenses with premium support.',
    siteCode: 'MEMTN',
    siteName: 'Memphis, TN',
    siteAddress: '789 Delivery Blvd, Memphis, TN 38103'
  },
  {
    id: 'REQ002',
    companyName: 'DHL',
    contactName: 'Emma Johnson',
    contactEmail: 'e.johnson@dhl.com',
    contactPhone: '555-987-6543',
    requestDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    status: 'pending',
    notes: 'Interested in implementing at 3 locations initially.',
    siteCode: 'CININ',
    siteName: 'Cincinnati, IN',
    siteAddress: '123 Airport Way, Cincinnati, IN 45201'
  }
];

// Helper function to ensure UPS and JACFL always exist in the data
const ensureRequiredData = (companies: Company[], sites: Site[]): { companies: Company[], sites: Site[] } => {
  let updatedCompanies = [...companies];
  let updatedSites = [...sites];
  
  // Check if UPS company exists
  const upsCompanyExists = updatedCompanies.some(company => company.id === 'UPS');
  if (!upsCompanyExists) {
    // Add UPS company if it doesn't exist
    updatedCompanies.push({
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
    console.log('UPS company added during store initialization');
  }
  
  // Check if JACFL site exists
  const jacflSiteExists = updatedSites.some(site => site.id === 'JACFL' && site.companyId === 'UPS');
  if (!jacflSiteExists) {
    // Add JACFL site if it doesn't exist
    updatedSites.push({
      id: 'JACFL',
      name: 'Jacksonville, FL',
      companyId: 'UPS',
      address: '123 Main St, Jacksonville, FL 32256',
      isActive: true
    });
    console.log('JACFL site added during store initialization');
  }
  
  return { companies: updatedCompanies, sites: updatedSites };
};

const useDriverStore = create<DriverState>((set, get) => ({
  // Get initial data from localStorage if available, or use the initial data
  drivers: initialDrivers,
  jobs: initialJobs,
  preferences: [],
  manualAssignments: [], // Initialize empty manual assignments
  cutoffTime: getDefaultCutoffTime(),
  isCutoffActive: false,
  isAutoCutoffScheduled: false,
  disableAutoAssignments: false, // Default to false (auto assignments enabled)
  useSeniorityAssignment: false, // Default to false (use regular assignment logic)
  systemSettings: {
    allowDriverPrinting: true, // Default to allow printing
    darkMode: false, // Default to light mode
    isPortalOpen: true, // Default to open portal
    scheduledClosureEnabled: false, // Default to no scheduled closure
    scheduledClosureDate: '', // Default empty date
    scheduledClosureTime: '', // Default empty time
    companyId: 'UPS', // Default company
    siteId: 'JACFL', // Default site
  },
  driverCredentials: [],
  adminCredentials: [
    // UPS JACFL admin (the only one with master admin capabilities)
    { username: 'admin', passwordHash: hashPassword('ups123'), companyId: 'UPS', siteId: 'JACFL', isSiteAdmin: true },
    // UPS DALTX admin - enforcing consistent credentials for all UPS sites
    { username: 'admin', passwordHash: hashPassword('ups123'), companyId: 'UPS', siteId: 'DALTX', isSiteAdmin: true },
    // FEDEX MEMTN admin (default "admin" password for non-UPS companies)
    { username: 'admin', passwordHash: hashPassword('admin'), companyId: 'FEDEX', siteId: 'MEMTN', isSiteAdmin: true }
  ],
  driverActivity: [],
  masterPassword: hashPassword('PBJ0103'), // Master password
  // Ensure UPS and JACFL exist in initial state
  ...(() => {
    // Apply the ensureRequiredData helper to the initial data
    const { companies, sites } = ensureRequiredData(initialCompanies, initialSites);
    return { companies, sites };
  })(),
  registrationRequests: mockRegistrationRequests,
  currentCompanyId: 'UPS', // Default company
  currentSiteId: 'JACFL', // Default site
  
  addDriver: (driver) => {
    set((state) => ({
      drivers: [...state.drivers, driver]
    }));
    
    // Clean preferences after driver changes
    setTimeout(() => get().cleanPreferences(), 0);
  },
  
  updateDriver: (driver) => {
    set((state) => ({
      drivers: state.drivers.map(d => 
        d.employeeId === driver.employeeId ? driver : d
      )
    }));
    
    // Clean preferences after driver changes
    setTimeout(() => get().cleanPreferences(), 0);
  },
  
  deleteDriver: (employeeId) => {
    set((state) => ({
      drivers: state.drivers.filter(d => d.employeeId !== employeeId)
    }));
    
    // Clean preferences after driver changes
    setTimeout(() => get().cleanPreferences(), 0);
  },
  
  addJob: (job) => {
    set((state) => ({
      jobs: [...state.jobs, job]
    }));
    // Clean preferences after job changes
    setTimeout(() => get().cleanPreferences(), 0);
  },
  
  updateJob: (job) => {
    set((state) => ({
      jobs: state.jobs.map(j => 
        j.jobId === job.jobId ? job : j
      )
    }));
    // Clean preferences after job changes
    setTimeout(() => get().cleanPreferences(), 0);
  },
  
  deleteJob: (jobId) => {
    set((state) => ({
      jobs: state.jobs.filter(j => j.jobId !== jobId)
    }));
    // Clean preferences after job changes
    setTimeout(() => get().cleanPreferences(), 0);
  },
  
  submitPreferences: (preference) => {
    // Get driver info to log activity
    const driver = get().drivers.find(d => d.employeeId === preference.driverId);

    set((state) => {
      // First, remove any existing preferences for this driver
      const filteredPreferences = state.preferences.filter(p => p.driverId !== preference.driverId);
      // Then add the new preference
      return {
        preferences: [...filteredPreferences, preference]
      };
    });
    
    // Log this activity
    if (driver) {
      get().logDriverActivity({
        driverId: preference.driverId,
        driverName: driver.name,
        action: 'create', 
        details: `Submitted ${preference.preferences.length} job preferences`,
        jobDetails: preference.preferences // Include the job IDs
      });
    }
  },
  
  updatePreferences: (preference) => {
    // Get driver info to log activity
    const driver = get().drivers.find(d => d.employeeId === preference.driverId);

    set((state) => ({
      preferences: state.preferences.map(p => 
        p.driverId === preference.driverId ? preference : p
      )
    }));
    
    // Log this activity
    if (driver) {
      get().logDriverActivity({
        driverId: preference.driverId,
        driverName: driver.name,
        action: 'update', 
        details: `Updated job preferences to ${preference.preferences.length} picks`,
        jobDetails: preference.preferences // Include the job IDs
      });
    }
  },
  
  // Add manual assignment
  assignJobManually: (driverId, jobId) => {
    set((state) => {
      // First, remove any existing manual assignments for this job
      const filteredAssignments = state.manualAssignments.filter(
        assignment => assignment.jobId !== jobId
      );
      
      // Add the new manual assignment
      return {
        manualAssignments: [
          ...filteredAssignments,
          { driverId, jobId }
        ]
      };
    });
  },
  
  // Remove manual assignment
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
  
  // Update system settings
  updateSystemSettings: (settings) => {
    set((state) => ({
      systemSettings: {
        ...state.systemSettings,
        ...settings
      }
    }));
  },
  
  // Toggle dark mode
  toggleDarkMode: (enabled) => {
    set((state) => ({
      systemSettings: {
        ...state.systemSettings,
        darkMode: enabled
      }
    }));
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

  // Get deduplicated driver preferences (only the most recent submission per driver)
  getUniqueDriverPreferences: () => {
    const { preferences } = get();
    const driverMap = new Map<string, JobPreference>();
    
    // Loop through preferences and keep only the most recent submission per driver
    preferences.forEach(pref => {
      const existing = driverMap.get(pref.driverId);
      if (!existing || new Date(pref.submissionTime) > new Date(existing.submissionTime)) {
        driverMap.set(pref.driverId, pref);
      }
    });
    
    // Convert map values back to array
    return Array.from(driverMap.values());
  },
  
  // Clean preferences to remove entries for non-existent drivers or jobs
  cleanPreferences: () => {
    const { drivers, jobs, preferences, manualAssignments } = get();
    
    // Get all valid driver IDs and job IDs
    const validDriverIds = new Set(drivers.map(d => d.employeeId));
    const validJobIds = new Set(jobs.map(j => j.jobId));
    
    // Filter preferences to keep only those with valid driver IDs
    const validPreferences = preferences.filter(p => validDriverIds.has(p.driverId));
    
    // For each valid preference, filter out job IDs that no longer exist
    const cleanedPreferences = validPreferences.map(p => ({
      ...p,
      preferences: p.preferences.filter(jobId => validJobIds.has(jobId))
    }));
    
    // Remove duplicate driver entries, keeping only the most recent submission per driver
    const driverMap = new Map<string, JobPreference>();
    cleanedPreferences.forEach(pref => {
      const existing = driverMap.get(pref.driverId);
      if (!existing || new Date(pref.submissionTime) > new Date(existing.submissionTime)) {
        driverMap.set(pref.driverId, pref);
      }
    });
    
    // Also clean up manual assignments
    const validManualAssignments = manualAssignments.filter(
      assignment => validDriverIds.has(assignment.driverId) && validJobIds.has(assignment.jobId)
    );
    
    // Update the preferences and manual assignments in state
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
    // For this implementation, we'll consider any driver who made at least one pick
    // as having made "sufficient" picks, but this could be expanded in the future
    const driverMadeSufficientPicks = (driverId: string): boolean => {
      const prefs = uniquePreferences.find(pref => pref.driverId === driverId);
      return prefs !== undefined;
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
      // First, process all drivers with sufficient picks normally
      // Sort drivers by seniority (lower number = higher priority)
      const driversWithSufficientPicks = [...drivers]
        .filter(driver => driver.isEligible && !assignedDrivers.has(driver.employeeId) && driverMadeSufficientPicks(driver.employeeId))
        .sort((a, b) => a.seniorityNumber - b.seniorityNumber);
        
      // Process each driver with sufficient picks in order of seniority
      for (const driver of driversWithSufficientPicks) {
        const driverPrefs = uniquePreferences.find(p => p.driverId === driver.employeeId);
        
        // Skip if driver hasn't submitted preferences (shouldn't happen in this filtered list)
        if (!driverPrefs) continue;
        
        // Try to assign their preferences in order
        let assigned = false;
        
        for (const jobId of driverPrefs.preferences) {
          // Skip if job is already assigned
          if (assignedJobs.has(jobId)) continue;
          
          // Get job details to check qualifications
          const job = jobs.find(j => j.jobId === jobId);
          if (!job) continue;
          
          // Check airport certification if needed
          if (job.isAirport && !driver.airportCertified) continue;
          
          // Assign job
          assignments.push({ 
            driverId: driver.employeeId,
            jobId: job.jobId,
            driverName: driver.name,
            jobDetails: job,
            assignmentType: 'preference'
          });
          
          assignedJobs.add(job.jobId);
          assignedDrivers.add(driver.employeeId);
          assigned = true;
          break;
        }
      }

      // Now handle drivers who either didn't make picks or didn't make sufficient picks
      // These will be assigned by strict seniority order from remaining jobs
      
      // Sort all eligible drivers who haven't been assigned yet by seniority
      // UPDATED: Remove the filter that excluded non-VC drivers without picks
      const remainingEligibleDrivers = [...drivers]
        .filter(driver => 
          driver.isEligible && 
          !assignedDrivers.has(driver.employeeId)
          // Removed the filter that excluded non-VC drivers who didn't make picks
        )
        .sort((a, b) => a.seniorityNumber - b.seniorityNumber);  // Lowest number (highest seniority) first

      // Sort all remaining jobs - first by airport status (airport first), then by start time (earliest first)
      const remainingJobs = [...jobs]
        .filter(job => !assignedJobs.has(job.jobId))
        .sort((a, b) => {
          if (a.isAirport && !b.isAirport) return -1;
          if (!a.isAirport && b.isAirport) return 1;
          return getMinutes(a.startTime) - getMinutes(b.startTime);
        });

      // Assign airport jobs to airport-certified drivers first, in seniority order
      const airportJobs = remainingJobs.filter(job => job.isAirport);
      const airportDrivers = remainingEligibleDrivers.filter(driver => driver.airportCertified);
      
      for (const driver of airportDrivers) {
        // Find first available airport job
        const job = airportJobs.find(job => !assignedJobs.has(job.jobId));
        if (!job) break; // No more airport jobs
        
        assignments.push({
          driverId: driver.employeeId,
          jobId: job.jobId,
          driverName: driver.name,
          jobDetails: job,
          assignmentType: 'seniority'
        });
        
        assignedJobs.add(job.jobId);
        assignedDrivers.add(driver.employeeId);
      }
      
      // Assign remaining drivers to remaining jobs in seniority order
      for (const driver of remainingEligibleDrivers) {
        // Skip if driver is already assigned
        if (assignedDrivers.has(driver.employeeId)) continue;
        
        // Find first suitable job for this driver
        let suitableJob = remainingJobs.find(job => {
          // Skip if job is already assigned
          if (assignedJobs.has(job.jobId)) return false;
          
          // Skip airport jobs for non-airport certified drivers
          if (job.isAirport && !driver.airportCertified) return false;
          
          return true;
        });
        
        if (suitableJob) {
          assignments.push({
            driverId: driver.employeeId,
            jobId: suitableJob.jobId,
            driverName: driver.name,
            jobDetails: suitableJob,
            assignmentType: 'seniority'
          });
          
          assignedJobs.add(suitableJob.jobId);
          assignedDrivers.add(driver.employeeId);
        }
      }
      
      // Return all assignments
      return assignments;
    }
    
    // If not using seniority assignment, use the original assignment logic
    
    // Sort drivers by seniority (lower number = higher priority)
    const sortedDrivers = [...drivers]
      .filter(driver => driver.isEligible && !assignedDrivers.has(driver.employeeId))
      .sort((a, b) => a.seniorityNumber - b.seniorityNumber);
      
    // Process each driver in order of seniority - for preference picks
    for (const driver of sortedDrivers) {
      const driverPrefs = uniquePreferences.find(p => p.driverId === driver.employeeId);
      
      // Skip if driver hasn't submitted preferences
      if (!driverPrefs) continue;
      
      // Try to assign their preferences in order
      let assigned = false;
      
      for (const jobId of driverPrefs.preferences) {
        // Skip if job is already assigned
        if (assignedJobs.has(jobId)) continue;
        
        // Get job details to check qualifications
        const job = jobs.find(j => j.jobId === jobId);
        if (!job) continue;
        
        // Check airport certification if needed
        if (job.isAirport && !driver.airportCertified) continue;
        
        // Assign job
        assignments.push({ 
          driverId: driver.employeeId,
          jobId: job.jobId,
          driverName: driver.name,
          jobDetails: job,
          assignmentType: 'preference'
        });
        
        assignedJobs.add(job.jobId);
        assignedDrivers.add(driver.employeeId);
        assigned = true;
        break;
      }
    }

    // If auto assignments are disabled, return only preference-based and manual assignments
    if (disableAutoAssignments) {
      return assignments;
    }
    
    // Handle all airport jobs before any other auto-assignments
    
    // Step 1: Get all unassigned airport jobs
    const unassignedAirportJobs = jobs
      .filter(job => job.isAirport && !assignedJobs.has(job.jobId))
      // Sort by start time in ascending order (earliest first)
      .sort((a, b) => getMinutes(a.startTime) - getMinutes(b.startTime));

    // Step 2: Get all airport-certified drivers who aren't assigned yet
    // CRITICAL FIX: Only include drivers who are VC OR who made picks (non-VC drivers with no picks are excluded)
    let availableAirportDrivers = drivers
      .filter(driver => 
        driver.isEligible && 
        driver.airportCertified && 
        !assignedDrivers.has(driver.employeeId) &&
        (driver.vcStatus || driverMadePicks(driver.employeeId))
      )
      // Sort by seniority number in ascending order (highest ranking / lowest number first)
      .sort((a, b) => a.seniorityNumber - b.seniorityNumber);

    // Calculate how many airport jobs we'll need for airport jobs
    const airportJobsCount = unassignedAirportJobs.length;
    const availableAirportDriversCount = availableAirportDrivers.length;
    
    if (unassignedAirportJobs.length > 0 && availableAirportDriversCount > 0) {
      // We have airport jobs that need to be assigned and airport drivers available
      
      // Sort airport jobs by start time in ascending order (earliest first)
      const earliestStartTimeFirst = [...unassignedAirportJobs].sort((a, b) => {
        return getMinutes(a.startTime) - getMinutes(b.startTime);
      });
      
      // FIX: Instead of sorting drivers by highest seniority number first (lowest ranking),
      // we want to assign the earliest start time jobs to the drivers with the highest seniority (lowest number)
      // Sort airport-certified drivers by seniority number in ascending order (highest seniority / lowest number first)
      const highestSeniorityFirst = [...availableAirportDrivers].sort((a, b) => {
        return a.seniorityNumber - b.seniorityNumber;
      });
      
      // Determine how many drivers will be used for airport jobs
      const driversNeededForAirport = Math.min(earliestStartTimeFirst.length, availableAirportDriversCount);
      
      // If we have more airport drivers than airport jobs, we'll only use the needed number of airport drivers
      if (availableAirportDriversCount > airportJobsCount) {
        // Assign drivers to airport jobs based on seniority
        for (let i = 0; i < driversNeededForAirport; i++) {
          const job = earliestStartTimeFirst[i]; // Earliest start time first
          const driver = highestSeniorityFirst[i]; // Highest seniority first (lowest number)
          
          assignments.push({
            driverId: driver.employeeId,
            jobId: job.jobId,
            driverName: driver.name,
            jobDetails: job,
            assignmentType: 'airport-auto'
          });
          
          assignedJobs.add(job.jobId);
          assignedDrivers.add(driver.employeeId);
        }
        
        // The remaining airport-certified drivers who didn't get assigned to airport jobs
        // will go into the general pool for non-airport jobs
      } else {
        // If we don't have enough airport drivers for airport jobs, assign all available
        // airport drivers to airport jobs, prioritizing the earliest start times
        for (let i = 0; i < availableAirportDriversCount; i++) {
          const job = earliestStartTimeFirst[i]; // Earliest start time first
          const driver = highestSeniorityFirst[i]; // Highest seniority first (lowest number)
          
          assignments.push({
            driverId: driver.employeeId,
            jobId: job.jobId,
            driverName: driver.name,
            jobDetails: job,
            assignmentType: 'airport-auto'
          });
          
          assignedJobs.add(job.jobId);
          assignedDrivers.add(driver.employeeId);
        }
      }
    }
    
    // Get all remaining eligible drivers, including:
    // 1. Airport-certified drivers who didn't make enough picks or any picks but weren't assigned airport jobs
    // 2. Non-airport certified drivers who didn't get their preferences
    // CRITICAL FIX: EXCLUDE non-VC drivers who didn't make any picks
    
    // First, create a combined pool of remaining drivers sorted by seniority
    // CRITICAL FIX: Only include drivers who are VC OR who made picks
    const remainingDrivers = drivers
      .filter(driver => 
        driver.isEligible && 
        !assignedDrivers.has(driver.employeeId) &&
        (driver.vcStatus || driverMadePicks(driver.employeeId))
      )
      // Sort by seniority number in ascending order (highest ranking first)
      .sort((a, b) => a.seniorityNumber - b.seniorityNumber);

    // Get remaining unassigned jobs that are not airport jobs
    // UPDATED: Sort by start time - earliest first to ensure earliest jobs are assigned first
    const remainingNonAirportJobs = jobs
      .filter(job => !job.isAirport && !assignedJobs.has(job.jobId))
      // Sort by start time - earliest first
      .sort((a, b) => getMinutes(a.startTime) - getMinutes(b.startTime));
    
    // Only process remaining assignments if auto assignments are not disabled
    if (remainingNonAirportJobs.length > 0 && remainingDrivers.length > 0) {
      // Assign remaining drivers to non-airport jobs based on seniority
      // This includes airport-certified drivers who weren't assigned to airport jobs
      // mixed in with non-airport-certified drivers, sorted by seniority
      const minDriversJobs = Math.min(remainingNonAirportJobs.length, remainingDrivers.length);
      
      for (let i = 0; i < minDriversJobs; i++) {
        const job = remainingNonAirportJobs[i]; // Already sorted earliest first
        const driver = remainingDrivers[i];
        
        // Determine assignment type based on whether the driver is airport certified
        const assignmentType = driver.airportCertified ? 'airport-driver-pool' : 'vc-assigned';
        
        assignments.push({
          driverId: driver.employeeId,
          jobId: job.jobId,
          driverName: driver.name,
          jobDetails: job,
          assignmentType
        });
        
        assignedJobs.add(job.jobId);
        assignedDrivers.add(driver.employeeId);
      }
      
      // UPDATED: If there are still any airport or non-airport jobs left and available drivers
      // Continue to sort all remaining jobs by earliest start time first
      const anyRemainingJobs = jobs
        .filter(job => !assignedJobs.has(job.jobId))
        .sort((a, b) => getMinutes(a.startTime) - getMinutes(b.startTime));
      
      // Get company settings for the current company
      const currentCompany = get().companies.find(company => company.id === get().currentCompanyId);
      const useCompanyVCStatus = currentCompany?.settings.usesVCStatus || false;
      const requireAirportCertification = currentCompany?.settings.airportCertificationRequired || false;
      
      // Apply company-specific rules for any remaining drivers
      const anyRemainingDrivers = drivers
        .filter(driver => 
          driver.isEligible && 
          !assignedDrivers.has(driver.employeeId) &&
          // Use company-specific VC status rule if applicable
          (!useCompanyVCStatus || driver.vcStatus || driverMadePicks(driver.employeeId))
        )
        .sort((a, b) => a.seniorityNumber - b.seniorityNumber);
      
      for (let i = 0; i < Math.min(anyRemainingJobs.length, anyRemainingDrivers.length); i++) {
        const job = anyRemainingJobs[i]; // Using earliest start time first
        const driver = anyRemainingDrivers[i];
        
        // Only assign airport job to airport-certified driver if company requires it
        if (job.isAirport && requireAirportCertification && !driver.airportCertified) continue;
        
        assignments.push({
          driverId: driver.employeeId,
          jobId: job.jobId,
          driverName: driver.name,
          jobDetails: job,
          assignmentType: 'vc-assigned'
        });
        
        assignedJobs.add(job.jobId);
        assignedDrivers.add(driver.employeeId);
      }
    }
    
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
    
    // Create CSV content
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
    
    // Create CSV content
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
    
    // Create CSV content
    let csvContent = "Driver ID,Driver Name,Seniority Number,VC Status,Airport Certified\n";
    
    driversWithoutPicks.forEach(driver => {
      csvContent += `${driver.employeeId},${driver.name},${driver.seniorityNumber},${driver.vcStatus ? 'Yes' : 'No'},${driver.airportCertified ? 'Yes' : 'No'}\n`;
    });
    
    return csvContent;
  },

  // Password and security functions
  validateDriverCredentials: (driverId, password) => {
    const { driverCredentials } = get();
    const credentials = driverCredentials.find(c => c.driverId === driverId);
    
    if (!credentials || credentials.passwordHash === null) {
      return false; // No credentials found for this driver or password is reset
    }
    
    return credentials.passwordHash === hashPassword(password);
  },
  
  setDriverPassword: (driverId, password) => {
    const driver = get().drivers.find(d => d.employeeId === driverId);
    
    if (!driver) {
      return; // Driver not found
    }
    
    // Hash the password
    const passwordHash = hashPassword(password);
    
    // Update or create driver credentials
    set((state) => {
      // Check if driver already has credentials
      const existingCredentials = state.driverCredentials.find(c => c.driverId === driverId);
      
      let updatedCredentials: DriverCredentials[];
      
      if (existingCredentials) {
        // Update existing credentials
        updatedCredentials = state.driverCredentials.map(c => 
          c.driverId === driverId 
            ? { ...c, passwordHash } 
            : c
        );
      } else {
        // Create new credentials
        updatedCredentials = [...state.driverCredentials, {
          driverId,
          passwordHash,
          securityQuestions: null
        }];
      }
      
      // Update driver's passwordSet status
      const updatedDrivers = state.drivers.map(d => 
        d.employeeId === driverId 
          ? { ...d, passwordSet: true } 
          : d
      );
      
      return { 
        driverCredentials: updatedCredentials,
        drivers: updatedDrivers
      };
    });
    
    // Log this activity
    if (driver) {
      get().logDriverActivity({
        driverId,
        driverName: driver.name,
        action: 'update',
        details: 'Set or updated password'
      });
    }
  },
  
  setDriverSecurityQuestions: (driverId, questions) => {
    const driver = get().drivers.find(d => d.employeeId === driverId);
    
    if (!driver) {
      return; // Driver not found
    }
    
    // Update or create driver credentials with security questions
    set((state) => {
      // Check if driver already has credentials
      const existingCredentials = state.driverCredentials.find(c => c.driverId === driverId);
      
      let updatedCredentials: DriverCredentials[];
      
      if (existingCredentials) {
        // Update existing credentials
        updatedCredentials = state.driverCredentials.map(c => 
          c.driverId === driverId 
            ? { ...c, securityQuestions: questions } 
            : c
        );
      } else {
        // Cannot set security questions without a password
        return { driverCredentials: state.driverCredentials };
      }
      
      // Update driver's securityQuestionsSet status
      const updatedDrivers = state.drivers.map(d => 
        d.employeeId === driverId 
          ? { ...d, securityQuestionsSet: true } 
          : d
      );
      
      return { 
        driverCredentials: updatedCredentials,
        drivers: updatedDrivers
      };
    });
    
    // Log this activity
    if (driver) {
      get().logDriverActivity({
        driverId,
        driverName: driver.name,
        action: 'update',
        details: 'Set or updated security questions'
      });
    }
  },
  
  resetDriverPassword: (driverId) => {
    const driver = get().drivers.find(d => d.employeeId === driverId);
    
    if (!driver) {
      return; // Driver not found
    }
    
    // Update driver credentials - reset password to null and mark as not set
    set((state) => {
      // Update credentials - set passwordHash to null
      const updatedCredentials = state.driverCredentials.map(c => 
        c.driverId === driverId 
          ? { ...c, passwordHash: null } 
          : c
      );
      
      // Update driver's passwordSet status to false
      const updatedDrivers = state.drivers.map(d => 
        d.employeeId === driverId 
          ? { ...d, passwordSet: false } 
          : d
      );
      
      return { 
        driverCredentials: updatedCredentials,
        drivers: updatedDrivers
      };
    });
    
    // Log this activity (by admin)
    if (driver) {
      get().logDriverActivity({
        driverId,
        driverName: driver.name,
        action: 'update',
        details: 'Password was reset by admin'
      });
    }
  },
  
  validateSecurityAnswers: (driverId, answers) => {
    const { driverCredentials } = get();
    const credentials = driverCredentials.find(c => c.driverId === driverId);
    
    if (!credentials || !credentials.securityQuestions) {
      return false; // No credentials or security questions found for this driver
    }
    
    // Case-insensitive comparison of answers
    return (
      credentials.securityQuestions.answer1.toLowerCase() === answers.answer1.toLowerCase() &&
      credentials.securityQuestions.answer2.toLowerCase() === answers.answer2.toLowerCase()
    );
  },
  
  getDriverSecurityQuestions: (driverId) => {
    const { driverCredentials } = get();
    const credentials = driverCredentials.find(c => c.driverId === driverId);
    
    if (!credentials || !credentials.securityQuestions) {
      return null; // No credentials or security questions found for this driver
    }
    
    // Return only the questions, not the answers
    return {
      question1: credentials.securityQuestions.question1,
      question2: credentials.securityQuestions.question2
    };
  },
  
  // Admin password management
  validateAdminCredentials: (username, password) => {
    // Check if we're in a login context (AdminPortalPage)
    // If not, we're in an authenticated context (e.g., SystemSettingsPage)
    const inLoginContext = !localStorage.getItem('adminSiteId');
    const { adminCredentials } = get();
    
    if (inLoginContext) {
      // During login, verify against the currently selected site
      // This is handled separately in the AdminPortalPage
      // Just verify the general credential exists
      const credentials = adminCredentials.find(c => c.username === username);
      
      if (!credentials) {
        return false; // No credentials found for this username
      }
      
      // Also validate against master password
      if (hashPassword(password) === get().masterPassword) {
        return true; // Master password is always valid
      }
      
      return credentials.passwordHash === hashPassword(password);
    } else {
      // In an authenticated context, check the specific site's admin credentials
      const adminSiteId = localStorage.getItem('adminSiteId');
      const adminCompanyId = localStorage.getItem('adminCompanyId');
      
      if (!adminSiteId || !adminCompanyId) {
        console.error('Admin site or company ID missing when validating credentials');
        return false;
      }
      
      // Find the specific credentials for this site
      const credentials = adminCredentials.find(c => 
        c.username === username && 
        c.siteId === adminSiteId && 
        c.companyId === adminCompanyId
      );
      
      if (!credentials) {
        return false; // No credentials found for this specific site
      }
      
      // Also validate against master password
      if (hashPassword(password) === get().masterPassword) {
        return true; // Master password is always valid
      }
      
      return credentials.passwordHash === hashPassword(password);
    }
  },
  
  setAdminPassword: (username, oldPassword, newPassword) => {
    // Get admin site and company ID from localStorage
    const adminSiteId = localStorage.getItem('adminSiteId');
    const adminCompanyId = localStorage.getItem('adminCompanyId');
    
    if (!adminSiteId || !adminCompanyId) {
      console.error('Admin site or company ID missing when changing password');
      return false; // Missing context information
    }
    
    const { adminCredentials } = get();
    // Find the specific admin credential for this site
    const credentials = adminCredentials.find(c => 
      c.username === username && 
      c.siteId === adminSiteId && 
      c.companyId === adminCompanyId
    );
    
    // Verify old password is correct (also allow master password)
    if (!credentials || (credentials.passwordHash !== hashPassword(oldPassword) && hashPassword(oldPassword) !== get().masterPassword)) {
      return false; // Invalid credentials or incorrect old password
    }
    
    // Hash the new password
    const passwordHash = hashPassword(newPassword);
    
    // Update ONLY this specific site's admin credentials
    set((state) => {
      const updatedCredentials = state.adminCredentials.map(c => 
        (c.username === username && c.siteId === adminSiteId && c.companyId === adminCompanyId)
          ? { ...c, passwordHash } 
          : c
      );
      
      return { adminCredentials: updatedCredentials };
    });
    
    // Log this security-related action
    console.log(`Admin password changed for ${adminCompanyId} > ${adminSiteId}`);
    
    return true;
  },
  
  validateMasterPassword: (password) => {
    return hashPassword(password) === get().masterPassword;
  },
  
  // Get site and company by IDs
  getSiteById: (siteId) => {
    // Get the current admin's company ID for strict isolation
    const adminCompanyId = localStorage.getItem('adminCompanyId');
    const isMasterAdmin = localStorage.getItem('isMasterAdmin') === 'true' && 
                         adminCompanyId === 'UPS' && 
                         localStorage.getItem('adminSiteId') === 'JACFL';
    
    const site = get().sites.find(site => site.id === siteId);
    
    // Only return site if it belongs to admin's company or if master admin
    if (site) {
      if (isMasterAdmin || site.companyId === adminCompanyId) {
        return site;
      }
    }
    
    // Only the master admin (UPS JACFL) should ever see sites from other companies
    return isMasterAdmin ? site : undefined;
  },
  
  getCompanyById: (companyId) => {
    // Get the current admin's company ID for strict isolation
    const adminCompanyId = localStorage.getItem('adminCompanyId');
    const isMasterAdmin = localStorage.getItem('isMasterAdmin') === 'true' && 
                         adminCompanyId === 'UPS' && 
                         localStorage.getItem('adminSiteId') === 'JACFL';
    
    // Only return company if it's the admin's company or if master admin
    const company = get().companies.find(company => company.id === companyId);
    
    // Enforce strict isolation - only return if matching or master admin
    if (isMasterAdmin || companyId === adminCompanyId) {
      return company;
    }
    
    return undefined;
  },
  
  // Get filtered entities by company/site
  getDriversByCompanySite: (companyId, siteId) => {
    // Enhanced security filtering - ensures absolute tenant isolation
    // If both companyId and siteId are provided, filter to exact match only
    // If only companyId is provided, filter to that company's sites only
    // If no filters provided, return all drivers (for UPS JACFL master admin ONLY)
    // Special case: Only allow all data access if UPS JACFL with master password
    const adminCompanyId = localStorage.getItem('adminCompanyId');
    const isMasterAdminAccess = localStorage.getItem('isMasterAdmin') === 'true' && 
                               adminCompanyId === 'UPS' && 
                               localStorage.getItem('adminSiteId') === 'JACFL';
    
    return get().drivers.filter(driver => {
      if (companyId && siteId) {
        // Exact company and site match for strict isolation
        // If not master admin and trying to access data from another company, deny access
        if (!isMasterAdminAccess && companyId !== adminCompanyId) {
          return false;
        }
        return driver.companyId === companyId && driver.siteId === siteId;
      } else if (companyId) {
        // Company-wide access (only for admins from that company)
        // If not UPS JACFL master admin, ensure strict company isolation
        if (!isMasterAdminAccess && adminCompanyId !== companyId) {
          return false;
        }
        return driver.companyId === companyId;
      }
      
      // Only UPS JACFL master admin should ever see all drivers
      return isMasterAdminAccess;
    });
  },
  
  getJobsByCompanySite: (companyId, siteId) => {
    // Enhanced security filtering - ensures absolute tenant isolation
    // If both companyId and siteId are provided, filter to exact match only
    // If only companyId is provided, filter to that company's sites only
    // If no filters provided, return all jobs (for UPS JACFL master admin ONLY)
    // Special case: Only allow all data access if UPS JACFL with master password
    const adminCompanyId = localStorage.getItem('adminCompanyId');
    const isMasterAdminAccess = localStorage.getItem('isMasterAdmin') === 'true' && 
                               adminCompanyId === 'UPS' && 
                               localStorage.getItem('adminSiteId') === 'JACFL';
    
    return get().jobs.filter(job => {
      if (companyId && siteId) {
        // Exact company and site match for strict isolation
        // Strict tenant isolation - never allow access to other companies' data
        if (!isMasterAdminAccess && companyId !== adminCompanyId) {
          return false;
        }
        return job.companyId === companyId && job.siteId === siteId;
      } else if (companyId) {
        // Company-wide access (only for admins from that company)
        // If not UPS JACFL master admin, ensure strict company isolation
        if (!isMasterAdminAccess && adminCompanyId !== companyId) {
          return false;
        }
        return job.companyId === companyId;
      }
      
      // Only UPS JACFL master admin should ever see all jobs
      return isMasterAdminAccess;
    });
  },
  
  getSitesByCompany: (companyId) => {
    // CRITICAL: ALWAYS ensure UPS JACFL site exists before returning sites
    import('../utils/directUPSJACFLRestore').then(module => {
      module.forceRestoreUPSJACFL();
    });
    
    // Enhanced security filtering - ensures absolute tenant isolation
    // Special case: Only allow all site data access if UPS JACFL with master password
    const adminCompanyId = localStorage.getItem('adminCompanyId');
    const isMasterAdminAccess = localStorage.getItem('isMasterAdmin') === 'true' && 
                               adminCompanyId === 'UPS' && 
                               localStorage.getItem('adminSiteId') === 'JACFL';
    
    // If no company ID specified, default to the admin's company
    const effectiveCompanyId = companyId || adminCompanyId;
    
    // SPECIAL CASE: ALWAYS allow UPS to see JACFL on Admin Portal login page
    // This is the critical exception to ensure admin access works
    if (effectiveCompanyId === 'UPS') {
      const allSites = get().sites;
      const upsSites = allSites.filter(site => site.companyId === 'UPS' && site.isActive);
      
      // Ensure JACFL is in the list
      const hasJACFL = upsSites.some(site => site.id === 'JACFL');
      if (!hasJACFL) {
        // Force immediate restoration
        console.warn('🚨 CRITICAL MISSING SITE: JACFL not found in UPS sites! Force restoring...');
        const jacflSite = {
          id: 'JACFL',
          name: 'Jacksonville, FL',
          companyId: 'UPS',
          address: '123 Main St, Jacksonville, FL 32256',
          isActive: true
        };
        
        // Add it to the site list immediately
        get().addSite('UPS', 'JACFL', 'Jacksonville, FL', '123 Main St, Jacksonville, FL 32256');
        
        // Return all UPS sites plus JACFL
        return [...upsSites, jacflSite];
      }
      
      return upsSites;
    }
    
    // Enforce strict company isolation
    if (effectiveCompanyId) {
      // If user is trying to access sites from another company, block it
      // Exception: Master Admin can see all sites
      if (!isMasterAdminAccess && adminCompanyId !== effectiveCompanyId) {
        // Strict isolation - if attempting to view other company's sites, return empty
        return [];
      }
      return get().sites.filter(site => site.companyId === effectiveCompanyId && site.isActive);
    }
    
    // Only UPS JACFL master admin should ever see all sites
    return isMasterAdminAccess ? get().sites.filter(site => site.isActive) : [];
  },
  
  // Set current company/site
  setCurrentCompany: (companyId) => {
    set({ currentCompanyId: companyId });
  },
  
  setCurrentSite: (siteId) => {
    set({ currentSiteId: siteId });
  },
  
  // Registration request management
  addRegistrationRequest: (request: Omit<RegistrationRequest, 'id' | 'requestDate' | 'status'>) => {
    const id = `REQ${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    const newRequest: RegistrationRequest = {
      ...request,
      id,
      requestDate: new Date().toISOString(),
      status: 'pending'
    };
    
    set(state => ({
      registrationRequests: [...state.registrationRequests, newRequest]
    }));
    
    return id;
  },
  
  updateRegistrationRequest: (id: string, updates: Partial<RegistrationRequest>) => {
    set(state => ({
      registrationRequests: state.registrationRequests.map(req => 
        req.id === id ? { ...req, ...updates } : req
      )
    }));
  },
  
  // Company management
  addCompany: (company: Omit<Company, 'id' | 'registrationDate' | 'isActive'>) => {
    const id = company.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const newCompany: Company = {
      ...company,
      id,
      isActive: true,
      registrationDate: new Date().toISOString()
    };
    
    set(state => ({
      companies: [...state.companies, newCompany]
    }));
    
    return id;
  },
  
  updateCompany: (id: string, updates: Partial<Company>) => {
    // Special protection for UPS company - cannot be deactivated
    if (id === 'UPS' && updates.isActive === false) {
      console.warn('Attempted to deactivate UPS company - operation blocked for system integrity');
      return;
    }
    
    set(state => ({
      companies: state.companies.map(company => 
        company.id === id ? { ...company, ...updates } : company
      )
    }));
  },
  
  // Site management
  addSite: (site: Omit<Site, 'isActive'>) => {
    const newSite: Site = {
      ...site,
      isActive: true
    };
    
    // Before adding the site, ensure UPS and JACFL exist
    // This ensures that even if we're adding a new site,
    // the UPS JACFL site is never deleted
    set(state => {
      // Check if JACFL site still exists
      const { companies, sites } = ensureRequiredData(state.companies, state.sites);
      
      // Double check for JACFL before adding the new site
      const jacflExists = sites.some(site => site.id === 'JACFL' && site.companyId === 'UPS');
      if (!jacflExists) {
        console.warn('JACFL site missing during addSite operation - adding it before continuing');
        sites.push({
          id: 'JACFL',
          name: 'Jacksonville, FL',
          companyId: 'UPS',
          address: '123 Main St, Jacksonville, FL 32256',
          isActive: true
        });
      }
      
      return {
        companies,
        sites: [...sites, newSite]
      };
    });
    
    // Create default admin account for the new site
    // For UPS sites: username 'admin', password 'ups123'
    // For non-UPS companies: username 'admin', password 'admin'
    // This ensures that all UPS sites have consistent credentials
    const defaultPassword = site.companyId === 'UPS' ? 'ups123' : 'admin';
    
    // Add admin credentials for the new site
    set(state => ({
      adminCredentials: [...state.adminCredentials, {
        username: 'admin',
        passwordHash: hashPassword(defaultPassword),
        companyId: site.companyId,
        siteId: site.id,
        isSiteAdmin: true
      }]
    }));
    
    // Log the action for debugging purposes
    console.log(`Site ${site.id} added to company ${site.companyId}`);
  },
  
  updateSite: (id: string, updates: Partial<Site>) => {
    // Special protection for UPS JACFL site
    // Don't allow deactivation of the JACFL site
    if (id === 'JACFL' && updates.isActive === false) {
      console.warn('Attempted to deactivate UPS JACFL site - operation blocked for system integrity');
      return;
    }
    
    set(state => {
      // First ensure the required data exists
      const { companies, sites } = ensureRequiredData(state.companies, state.sites);
      
      // Then apply the updates
      return {
        companies,
        sites: sites.map(site => 
          site.id === id ? { ...site, ...updates } : site
        )
      };
    });
  },
  
  // System metrics
  getSystemMetrics: () => {
    const { drivers, jobs, sites, companies, driverActivity } = get();
    
    // Count active entities
    const activeCompanies = companies.filter(c => c.isActive).length;
    const activeSites = sites.filter(s => s.isActive).length;
    const totalDrivers = drivers.length;
    const totalJobs = jobs.length;
    
    // Activity metrics
    const last24HoursActivity = driverActivity.filter(activity => {
      const activityTime = new Date(activity.timestamp).getTime();
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      return activityTime > oneDayAgo;
    }).length;
    
    const last7DaysActivity = driverActivity.filter(activity => {
      const activityTime = new Date(activity.timestamp).getTime();
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      return activityTime > sevenDaysAgo;
    }).length;
    
    // Company-specific metrics
    const companyMetrics = companies.map(company => {
      const companySites = sites.filter(site => site.companyId === company.id).length;
      const companyDrivers = drivers.filter(driver => driver.companyId === company.id).length;
      const companyJobs = jobs.filter(job => job.companyId === company.id).length;
      
      return {
        companyId: company.id,
        companyName: company.name,
        sites: companySites,
        drivers: companyDrivers,
        jobs: companyJobs,
        isActive: company.isActive
      };
    });
    
    return {
      totalCompanies: companies.length,
      activeCompanies,
      totalSites: sites.length,
      activeSites,
      totalDrivers,
      totalJobs,
      activityLast24Hours: last24HoursActivity,
      activityLast7Days: last7DaysActivity,
      companyMetrics
    };
  },
  
  // Driver activity logging
  logDriverActivity: (activity) => {
    const timestamp = new Date().toISOString();
    
    set((state) => ({
      driverActivity: [...state.driverActivity, { ...activity, timestamp }]
    }));
  },
  
  getDriverActivities: (driverId) => {
    const { driverActivity } = get();
    
    if (driverId) {
      return driverActivity.filter(activity => activity.driverId === driverId);
    }
    
    return driverActivity;
  },
  
  exportActivityLog: () => {
    const { driverActivity, jobs } = get();
    
    // Helper function to get job details as string
    const getJobDetails = (jobIds?: string[]) => {
      if (!jobIds || jobIds.length === 0) return '';
      
      return jobIds.map(jobId => {
        const job = jobs.find(j => j.jobId === jobId);
        return job ? `${job.jobId}(${job.startTime}, ${job.weekDays})` : jobId;
      }).join(', ');
    };
    
    // Create CSV content
    let csvContent = "Driver ID,Driver Name,Action,Timestamp,Details,Job Details\n";
    
    driverActivity.forEach(activity => {
      // Format timestamp in 24-hour format
      const date = new Date(activity.timestamp);
      const formattedTimestamp = date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      // Get job details
      const jobDetailsStr = getJobDetails(activity.jobDetails);
      
      csvContent += `${activity.driverId},${activity.driverName},${activity.action},${formattedTimestamp},"${activity.details}","${jobDetailsStr}"\n`;
    });
    
    return csvContent;
  }
}));

export default useDriverStore;