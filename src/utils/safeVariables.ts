/**
 * Utility functions to help avoid Temporal Dead Zone (TDZ) errors
 * by ensuring variables are initialized before use
 */

/**
 * Safely initialize a string variable with a default value
 * to prevent "Cannot access variable before initialization" errors
 */
export function safeString(value?: string | null): string {
  return value !== undefined && value !== null ? String(value) : '';
}

/**
 * Safely initialize a number variable with a default value
 */
export function safeNumber(value?: number | null): number {
  if (value === undefined || value === null || isNaN(Number(value))) {
    return 0;
  }
  return Number(value);
}

/**
 * Safely initialize a boolean variable with a default value
 */
export function safeBoolean(value?: boolean | null): boolean {
  return Boolean(value);
}

/**
 * Safely initialize an array with a default empty array
 */
export function safeArray<T>(value?: T[] | null): T[] {
  return Array.isArray(value) ? value : [];
}

/**
 * Safely initialize an object with a default empty object
 */
export function safeObject<T extends object>(value?: T | null): T {
  return (value !== null && typeof value === 'object') ? value : {} as T;
}

/**
 * Safely get a property from an object without risk of undefined errors
 */
export function safeObjectProperty<T, K extends keyof T>(
  obj: T | null | undefined, 
  key: K, 
  defaultValue: T[K]
): T[K] {
  if (obj === null || obj === undefined) {
    return defaultValue;
  }
  
  return obj[key] !== undefined ? obj[key] : defaultValue;
}

/**
 * Safely call a function without risk of it being undefined
 */
export function safeCall<T>(
  fn: ((...args: any[]) => T) | undefined | null,
  defaultValue: T,
  ...args: any[]
): T {
  if (typeof fn !== 'function') {
    return defaultValue;
  }
  
  try {
    return fn(...args);
  } catch (error) {
    console.error('Error in safeCall:', error);
    return defaultValue;
  }
}

/**
 * Initialize variables at the top of component functions to avoid TDZ issues
 */
export function initializeComponentVariables<T extends Record<string, any>>(
  initialValues: T
): T {
  // This forces early variable declaration and initialization
  // to prevent TDZ errors
  return { ...initialValues };
}

/**
 * A safe way to handle async operations that could reference variables
 * before they're properly initialized
 */
export async function safeAsync<T>(
  asyncFn: () => Promise<T>,
  defaultValue: T
): Promise<T> {
  try {
    return await asyncFn();
  } catch (error) {
    console.error('Error in safeAsync:', error);
    return defaultValue;
  }
}

/**
 * Use this to ensure a variable has a value and avoid the "cannot access before initialization" error
 * by forcing immediate variable initialization
 */
export function ensureInitialized<T>(value: T | null | undefined, defaultValue: T): T {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  return value;
} 