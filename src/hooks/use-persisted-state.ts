'use client';

import { useEffect, useState } from 'react';

export function usePersistedState<T>(storageKey: string, initialValue: T) {
  const [state, setState] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setState(JSON.parse(raw) as T);
      }
    } catch (error) {
      console.error(`Falha ao carregar ${storageKey} do localStorage:`, error);
    } finally {
      setIsHydrated(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.error(`Falha ao salvar ${storageKey} no localStorage:`, error);
    }
  }, [isHydrated, state, storageKey]);

  return [state, setState, isHydrated] as const;
}
