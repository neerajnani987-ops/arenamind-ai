import { useState } from 'react';

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

  const setValue = (value: T) => {
    setState(value);
    const serializeVal = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serializeVal);
  };

  return [state, setValue];
}
export default useLocalStorageState;
