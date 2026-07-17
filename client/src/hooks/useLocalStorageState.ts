import { useState, useCallback } from 'react';

/**
 * Custom React hook to synchronize state dynamically inside local storage.
 * Handles automatic serialization and fallback logic for plain string items.
 *
 * @param key Local storage key name identifier
 * @param defaultValue Default state value to populate upon missing entries
 * @returns A state value and state updater function callback tuple
 */
export function useLocalStorageState<T>(key: string, defaultValue: T): [T, (val: T) => void] {
  const [state, setState] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    if (stored !== null) {
      try {
        return JSON.parse(stored);
      } catch {
        // Fallback for raw string items
        return stored as unknown as T;
      }
    }
    return defaultValue;
  });

  const setValue = useCallback((value: T) => {
    setState(value);
    const serializeVal = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serializeVal);
  }, [key]);

  return [state, setValue];
}
export default useLocalStorageState;
