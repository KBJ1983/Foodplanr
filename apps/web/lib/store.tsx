'use client';

/**
 * Client-side app state (design handoff "State" section), persisted in
 * localStorage. Replaced by server state + auth in phase 1.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { StoreId } from './mock-data';
import type { Strategy } from './strategy';

export interface AppState {
  household: { adults: number; kids: number };
  kcalPerDay: number;
  weeklyBudget: number;
  stores: StoreId[];
  ingredientPrefs: string[];
  selectedPlanId: string | null;
  strategy: Strategy;
  /** `${planId}|${item name}` for checked lines. */
  checked: string[];
  onboarded: boolean;
  shareWithHousehold: boolean;
  sundayReminder: boolean;
}

export const DEFAULT_STATE: AppState = {
  household: { adults: 2, kids: 2 },
  kcalPerDay: 1850,
  weeklyBudget: 900,
  stores: ['rema', 'lidl'],
  ingredientPrefs: ['Ingen svinekød', 'Nøddefri', 'Elsker kylling'],
  selectedPlanId: null,
  strategy: 'cheapest',
  checked: [],
  onboarded: false,
  shareWithHousehold: true,
  sundayReminder: false,
};

const KEY = 'foodplanr.state.v1';

interface Ctx {
  state: AppState;
  /** True once localStorage has been read (avoids hydration flicker). */
  ready: boolean;
  update: (patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => void;
  toggleChecked: (planId: string, itemName: string) => void;
  reset: () => void;
}

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setState({ ...DEFAULT_STATE, ...(JSON.parse(raw) as Partial<AppState>) });
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, ready]);

  const value = useMemo<Ctx>(
    () => ({
      state,
      ready,
      update: (patch) => setState((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) })),
      toggleChecked: (planId, itemName) =>
        setState((s) => {
          const key = `${planId}|${itemName}`;
          const checked = s.checked.includes(key) ? s.checked.filter((k) => k !== key) : [...s.checked, key];
          return { ...s, checked };
        }),
      reset: () => setState(DEFAULT_STATE),
    }),
    [state, ready],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Ctx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

export const persons = (s: AppState) => s.household.adults + s.household.kids;
