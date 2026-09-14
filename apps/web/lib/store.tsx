'use client';

/**
 * Client-side app state (design handoff "State" section), persisted in
 * localStorage. Replaced by server state + auth in phase 1.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { StoreId } from './mock-data';
import type { Strategy } from './strategy';
import { mondayOf } from './week';

export interface SavedPlan {
  planId: string;
  /** ISO Monday the plan is saved for. */
  weekStart: string;
  savedAt: string;
}

export interface AppState {
  household: { adults: number; kids: number };
  kcalPerDay: number;
  weeklyBudget: number;
  stores: StoreId[];
  ingredientPrefs: string[];
  selectedPlanId: string | null;
  /** ISO Monday of the week being planned. */
  weekStart: string | null;
  saved: SavedPlan[];
  strategy: Strategy;
  /** `${planId}|${item name}` for checked lines. */
  checked: string[];
  onboarded: boolean;
  shareWithHousehold: boolean;
  sundayReminder: boolean;
}

/** Free tier (brief §1.5): save a few plans, one week ahead. */
export const FREE_TIER = { maxSavedPlans: 3, maxWeeksAhead: 1 } as const;

export const DEFAULT_STATE: AppState = {
  household: { adults: 2, kids: 2 },
  kcalPerDay: 1850,
  weeklyBudget: 900,
  stores: ['rema', 'lidl'],
  ingredientPrefs: ['Ingen svinekød', 'Nøddefri', 'Elsker kylling'],
  selectedPlanId: null,
  weekStart: null,
  saved: [],
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
  /** The week being planned; defaults to the current week. */
  weekStart: string;
  update: (patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => void;
  toggleChecked: (planId: string, itemName: string) => void;
  /** Save/unsave a plan for a week. Returns false when the free limit blocks saving. */
  toggleSaved: (planId: string, weekStart: string) => boolean;
  isSaved: (planId: string, weekStart: string) => boolean;
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

  const value = useMemo<Ctx>(() => {
    const weekStart = state.weekStart ?? mondayOf();
    const isSaved = (planId: string, ws: string) => state.saved.some((s) => s.planId === planId && s.weekStart === ws);
    return {
      state,
      ready,
      weekStart,
      update: (patch) => setState((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) })),
      toggleChecked: (planId, itemName) =>
        setState((s) => {
          const key = `${planId}|${itemName}`;
          const checked = s.checked.includes(key) ? s.checked.filter((k) => k !== key) : [...s.checked, key];
          return { ...s, checked };
        }),
      toggleSaved: (planId, ws) => {
        if (isSaved(planId, ws)) {
          setState((s) => ({ ...s, saved: s.saved.filter((x) => !(x.planId === planId && x.weekStart === ws)) }));
          return true;
        }
        if (state.saved.length >= FREE_TIER.maxSavedPlans) return false;
        setState((s) => ({ ...s, saved: [...s.saved, { planId, weekStart: ws, savedAt: new Date().toISOString() }] }));
        return true;
      },
      isSaved,
      reset: () => setState(DEFAULT_STATE),
    };
  }, [state, ready]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Ctx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

export const persons = (s: AppState) => s.household.adults + s.household.kids;
