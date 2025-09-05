/**
 * Password utility functions for the job selection system.
 * These are extracted for consistent hashing across the application.
 */

/**
 * Simple hash function for passwords (in a real app, use bcrypt or similar)
 * This implementation ensures consistent hashing across all parts of the application.
 * 
 * @param password Plain text password to hash
 * @returns Hashed password as a hex string
 */
export const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
};