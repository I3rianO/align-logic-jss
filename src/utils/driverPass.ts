// Simple, per-driver passcode helpers (local-only, namespaced by employeeId).
// NOTE: This is convenience auth only (not secure). We'll migrate to Supabase later.

const keyFor = (employeeId: string) => `jss:driverPin:${employeeId}`;

export function getDriverPin(employeeId: string): string | null {
  try {
    return localStorage.getItem(keyFor(employeeId));
  } catch {
    return null;
  }
}

export function setDriverPin(employeeId: string, pin: string): void {
  localStorage.setItem(keyFor(employeeId), pin);
}

export function clearDriverPin(employeeId: string): void {
  localStorage.removeItem(keyFor(employeeId));
}
