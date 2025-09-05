import { create } from 'zustand';

export interface VacationWeek {
  weekId: string;
  startDate: string;
  endDate: string;
  totalSlots: number;
  remainingSlots: number;
}

export interface VacationPreference {
  driverId: string;
  preferences: string[];  // Array of weekIds in order of preference
  submissionTime: string;
}

export interface VacationAssignment {
  driverId: string;
  weekId: string;
  driverName?: string;
  weekDetails?: VacationWeek;
  assignmentType: 'preference' | 'vc-assigned' | 'manual' | 'seniority';
}

interface VacationState {
  vacationWeeks: VacationWeek[];
  vacationPreferences: VacationPreference[];
  manualAssignments: { driverId: string; weekId: string }[];
  
  // Actions
  addVacationWeek: (week: VacationWeek) => void;
  updateVacationWeek: (week: VacationWeek) => void;
  deleteVacationWeek: (weekId: string) => void;
  
  submitPreferences: (preference: VacationPreference) => void;
  updatePreferences: (preference: VacationPreference) => void;
  
  // Manual assignment actions
  assignVacationManually: (driverId: string, weekId: string) => void;
  removeManualAssignment: (weekId: string) => void;
  
  getDriverVacationPreferences: (employeeId: string) => string[] | null;
  getWeekById: (weekId: string) => VacationWeek | undefined;
  
  // Vacation week assignment functions
  calculateVacationAssignments: () => VacationAssignment[];
  getAssignedVacationForDriver: (driverId: string) => string | null;
  exportAssignments: () => string;
  exportUnassignedWeeks: () => string;
  exportDriversWithoutVacationPicks: () => string;
  
  // Clean preferences that refer to non-existent drivers or vacation weeks
  cleanPreferences: () => void;
}

// Mock data
const mockVacationWeeks: VacationWeek[] = [
  { weekId: 'W001', startDate: '2025-01-06', endDate: '2025-01-12', totalSlots: 5, remainingSlots: 3 },
  { weekId: 'W002', startDate: '2025-01-13', endDate: '2025-01-19', totalSlots: 5, remainingSlots: 5 },
  { weekId: 'W003', startDate: '2025-01-20', endDate: '2025-01-26', totalSlots: 5, remainingSlots: 2 },
  { weekId: 'W004', startDate: '2025-01-27', endDate: '2025-02-02', totalSlots: 5, remainingSlots: 4 },
  { weekId: 'W005', startDate: '2025-02-03', endDate: '2025-02-09', totalSlots: 5, remainingSlots: 5 },
  { weekId: 'W006', startDate: '2025-02-10', endDate: '2025-02-16', totalSlots: 5, remainingSlots: 1 },
  { weekId: 'W007', startDate: '2025-02-17', endDate: '2025-02-23', totalSlots: 5, remainingSlots: 3 },
  { weekId: 'W008', startDate: '2025-02-24', endDate: '2025-03-02', totalSlots: 5, remainingSlots: 5 },
];

const useVacationStore = create<VacationState>((set, get) => ({
  vacationWeeks: mockVacationWeeks,
  vacationPreferences: [],
  manualAssignments: [],
  
  addVacationWeek: (week) => {
    set((state) => ({
      vacationWeeks: [...state.vacationWeeks, week]
    }));
    
    // Clean preferences after week changes
    setTimeout(() => get().cleanPreferences(), 0);
  },
  
  updateVacationWeek: (week) => {
    set((state) => ({
      vacationWeeks: state.vacationWeeks.map(w => 
        w.weekId === week.weekId ? week : w
      )
    }));
    
    // Clean preferences after week changes
    setTimeout(() => get().cleanPreferences(), 0);
  },
  
  deleteVacationWeek: (weekId) => {
    set((state) => ({
      vacationWeeks: state.vacationWeeks.filter(w => w.weekId !== weekId)
    }));
    
    // Clean preferences after week changes
    setTimeout(() => get().cleanPreferences(), 0);
  },
  
  submitPreferences: (preference) => {
    set((state) => {
      // First, remove any existing preferences for this driver
      const filteredPreferences = state.vacationPreferences.filter(p => p.driverId !== preference.driverId);
      // Then add the new preference
      return {
        vacationPreferences: [...filteredPreferences, preference]
      };
    });
  },
  
  updatePreferences: (preference) => {
    set((state) => ({
      vacationPreferences: state.vacationPreferences.map(p => 
        p.driverId === preference.driverId ? preference : p
      )
    }));
  },
  
  // Add manual assignment
  assignVacationManually: (driverId, weekId) => {
    set((state) => {
      // First, remove any existing manual assignments for this week
      const filteredAssignments = state.manualAssignments.filter(
        assignment => assignment.weekId !== weekId
      );
      
      // Add the new manual assignment
      return {
        manualAssignments: [
          ...filteredAssignments,
          { driverId, weekId }
        ]
      };
    });
  },
  
  // Remove manual assignment
  removeManualAssignment: (weekId) => {
    set((state) => ({
      manualAssignments: state.manualAssignments.filter(
        assignment => assignment.weekId !== weekId
      )
    }));
  },
  
  getDriverVacationPreferences: (employeeId) => {
    const preference = get().vacationPreferences.find(p => p.driverId === employeeId);
    return preference ? preference.preferences : null;
  },
  
  getWeekById: (weekId) => {
    return get().vacationWeeks.find(w => w.weekId === weekId);
  },
  
  // Clean preferences to remove entries for non-existent weeks
  cleanPreferences: () => {
    const { vacationWeeks, vacationPreferences, manualAssignments } = get();
    
    // Get all valid week IDs
    const validWeekIds = new Set(vacationWeeks.map(w => w.weekId));
    
    // For each valid preference, filter out week IDs that no longer exist
    const cleanedPreferences = vacationPreferences.map(p => ({
      ...p,
      preferences: p.preferences.filter(weekId => validWeekIds.has(weekId))
    }));
    
    // Remove duplicate driver entries, keeping only the most recent submission per driver
    const driverMap = new Map<string, VacationPreference>();
    cleanedPreferences.forEach(pref => {
      const existing = driverMap.get(pref.driverId);
      if (!existing || new Date(pref.submissionTime) > new Date(existing.submissionTime)) {
        driverMap.set(pref.driverId, pref);
      }
    });
    
    // Also clean up manual assignments
    const validManualAssignments = manualAssignments.filter(
      assignment => validWeekIds.has(assignment.weekId)
    );
    
    // Update the preferences and manual assignments in state
    set({ 
      vacationPreferences: Array.from(driverMap.values()),
      manualAssignments: validManualAssignments
    });
  },
  
  calculateVacationAssignments: () => {
    // A placeholder implementation - in a real app, this would be more sophisticated
    const assignments: VacationAssignment[] = [];
    
    // In a real implementation, this would implement logic to assign vacation weeks
    // based on preferences, seniority, etc.
    
    return assignments;
  },
  
  getAssignedVacationForDriver: (driverId) => {
    const assignments = get().calculateVacationAssignments();
    const driverAssignment = assignments.find(a => a.driverId === driverId);
    return driverAssignment ? driverAssignment.weekId : null;
  },
  
  exportAssignments: () => {
    // Placeholder for a real CSV export implementation
    return "Driver ID,Driver Name,Week ID,Start Date,End Date,Assignment Type\n";
  },
  
  exportUnassignedWeeks: () => {
    // Placeholder for a real CSV export implementation
    return "Week ID,Start Date,End Date,Total Slots,Remaining Slots\n";
  },
  
  exportDriversWithoutVacationPicks: () => {
    // Placeholder for a real CSV export implementation
    return "Driver ID,Driver Name,Seniority Number\n";
  }
}));

export default useVacationStore;