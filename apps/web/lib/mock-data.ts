/**
 * Retailers, preferences and our own meal plans. Plans reference recipes by
 * id (mirrors `meal_plan_template.week_pattern`); recipes reference the
 * ingredient ontology; offers reference the same ontology. See lib/engine.ts.
 */
export type StoreId = 'rema' | 'lidl' | 'netto' | 'foetex' | 'bilka' | 'meny' | 'brugsen' | '365';

export interface Store {
  id: StoreId;
  name: string;
  /** Colour block used for store headers in the shopping list. */
  tone: 'a' | 'b' | 'c';
  /** Example normal-price index vs. baseline (1.0). Our estimate, replaced by price_history. */
  priceIndex: number;
}

export const STORES: Store[] = [
  { id: 'rema', name: 'Rema 1000', tone: 'a', priceIndex: 1.0 },
  { id: 'lidl', name: 'Lidl', tone: 'b', priceIndex: 0.93 },
  { id: 'netto', name: 'Netto', tone: 'c', priceIndex: 0.97 },
  { id: 'foetex', name: 'føtex', tone: 'b', priceIndex: 1.12 },
  { id: 'bilka', name: 'Bilka', tone: 'a', priceIndex: 1.0 },
  { id: 'meny', name: 'Meny', tone: 'c', priceIndex: 1.25 },
  { id: 'brugsen', name: 'SuperBrugsen', tone: 'a', priceIndex: 1.15 },
  { id: '365', name: '365discount', tone: 'b', priceIndex: 0.95 },
];

export const storeById = (id: StoreId): Store => STORES.find((s) => s.id === id)!;

export const AVOID_PREFS = ['Ingen svinekød', 'Nøddefri', 'Vegetar', 'Laktosefri', 'Glutenfri'] as const;
export const LIKE_PREFS = ['Elsker kylling', 'Fisk', 'Pasta', 'Meget grønt', 'Rester'] as const;

export type PlanTag = 'børn' | 'hurtig' | 'grøn' | 'rester' | 'madpakke' | 'fisk';

export const DAY_NAMES = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'] as const;

export interface MealPlan {
  id: string;
  title: string;
  tags: PlanTag[];
  /** Target kcal per person per day the plan is composed for. */
  kcalPerDay: number;
  persons: number;
  /** Recipe id per day, Monday first. 5 or 7 entries. */
  recipeIds: string[];
  tone: 'a' | 'b' | 'c';
}

export const PLANS: MealPlan[] = [
  {
    id: 'familieuge',
    title: 'Familieuge under 900 kr',
    tags: ['børn'],
    kcalPerDay: 1850,
    persons: 4,
    tone: 'b',
    recipeIds: ['kyllingelaar-rodfrugter', 'linsebolognese', 'fiskefrikadeller', 'bagt-kartoffel-bar', 'hjemmelavet-pizza', 'tacos', 'boller-i-karry'],
  },
  {
    id: 'groen-hverdag',
    title: 'Grøn hverdag',
    tags: ['grøn', 'hurtig'],
    kcalPerDay: 1700,
    persons: 4,
    tone: 'c',
    recipeIds: ['kikaerte-curry', 'pasta-groenkaal', 'boennechili', 'rodfrugter-hummus', 'falafel-wraps', 'svampe-risotto', 'linsesuppe'],
  },
  {
    id: 'restemad-ugen',
    title: 'Restemad-ugen',
    tags: ['rester', 'hurtig'],
    kcalPerDay: 1800,
    persons: 4,
    tone: 'a',
    recipeIds: ['kylling-i-fad', 'kyllingesalat', 'chili-con-carne', 'tacos', 'bagt-kartoffel-bar'],
  },
  {
    id: 'madpakke-ugen',
    title: 'Madpakke-ugen',
    tags: ['børn', 'madpakke'],
    kcalPerDay: 1800,
    persons: 4,
    tone: 'c',
    recipeIds: ['frikadeller', 'pastasalat-kylling', 'fiskefrikadeller', 'groentsagstaerte', 'burgere', 'pandekager-fyld', 'boller-i-karry'],
  },
  {
    id: 'fiskeugen',
    title: 'Fiskeugen',
    tags: ['fisk', 'grøn'],
    kcalPerDay: 1750,
    persons: 4,
    tone: 'b',
    recipeIds: ['ovnbagt-laks', 'fiskefrikadeller', 'torsk-sennepssovs', 'linsesuppe', 'svampe-risotto', 'omelet', 'pasta-groenkaal'],
  },
  {
    id: 'hurtig-hverdag',
    title: 'Hurtig hverdag – 30 min',
    tags: ['hurtig', 'børn'],
    kcalPerDay: 1800,
    persons: 4,
    tone: 'a',
    recipeIds: ['wok-kylling', 'pasta-groenkaal', 'omelet', 'tacos', 'falafel-wraps', 'pastasalat-kylling', 'burgere'],
  },
];

export const planById = (id: string): MealPlan | undefined => PLANS.find((p) => p.id === id);
