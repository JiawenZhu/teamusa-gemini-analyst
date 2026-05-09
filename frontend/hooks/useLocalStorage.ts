import { useState, useEffect, useCallback } from "react";

/**
 * A SSR-safe hook that syncs state to localStorage.
 * Reads the stored value on mount and persists updates automatically.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Always start with initialValue to avoid hydration mismatch
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Hydrate from localStorage after mount (client-only)
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item) as T);
      }
    } catch (e) {
      console.warn(`[useLocalStorage] Failed to read "${key}"`, e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = typeof value === "function" ? (value as (p: T) => T)(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch (e) {
          console.warn(`[useLocalStorage] Failed to write "${key}"`, e);
        }
        return next;
      });
    },
    [key]
  );

  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[useLocalStorage] Failed to remove "${key}"`, e);
    }
    setStoredValue(initialValue);
  }, [key, initialValue]);

  return [storedValue, setValue, clear];
}
