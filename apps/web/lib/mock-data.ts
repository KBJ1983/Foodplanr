/**
 * Example data for the UI while the real pipeline (offers → engine) is phase 1.
 * Everything here is invented by us: dish names, plans and prices. No third-party
 * content. Prices are per-store example prices in DKK for the whole item.
 */

export type StoreId = 'rema' | 'lidl' | 'netto' | 'foetex' | 'bilka' | 'meny' | 'brugsen' | '365';

export interface Store {
  id: StoreId;
  name: string;
  /** Colour block used for store headers in the shopping list. */
  tone: 'a' | 'b' | 'c';
}

export const STORES: Store[] = [
  { id: 'rema', name: 'Rema 1000', tone: 'a' },
  { id: 'lidl', name: 'Lidl', tone: 'b' },
  { id: 'netto', name: 'Netto', tone: 'c' },
  { id: 'foetex', name: 'føtex', tone: 'b' },
  { id: 'bilka', name: 'Bilka', tone: 'a' },
  { id: 'meny', name: 'Meny', tone: 'c' },
  { id: 'brugsen', name: 'SuperBrugsen', tone: 'a' },
  { id: '365', name: '365discount', tone: 'b' },
];

export const storeById = (id: StoreId): Store => STORES.find((s) => s.id === id)!;

export const AVOID_PREFS = ['Ingen svinekød', 'Nøddefri', 'Vegetar', 'Laktosefri', 'Glutenfri'] as const;
export const LIKE_PREFS = ['Elsker kylling', 'Fisk', 'Pasta', 'Meget grønt', 'Rester'] as const;

export type PlanTag = 'børn' | 'hurtig' | 'grøn' | 'rester' | 'madpakke' | 'fisk';

export interface PlanItem {
  name: string;
  qty: string;
  /** Example price for the whole quantity, per store where available. */
  prices: Partial<Record<StoreId, number>>;
}

export interface PlanDay {
  day: string;
  dish: string;
  /** Example kcal per portion for the dinner. */
  kcal: number;
}

export interface MealPlan {
  id: string;
  title: string;
  tags: PlanTag[];
  kcalPerDay: number;
  persons: number;
  days: PlanDay[];
  items: PlanItem[];
  tone: 'a' | 'b' | 'c';
}

const p = (rema?: number, lidl?: number, netto?: number, foetex?: number, bilka?: number): Partial<Record<StoreId, number>> => {
  const out: Partial<Record<StoreId, number>> = {};
  if (rema !== undefined) out.rema = rema;
  if (lidl !== undefined) out.lidl = lidl;
  if (netto !== undefined) out.netto = netto;
  if (foetex !== undefined) out.foetex = foetex;
  if (bilka !== undefined) out.bilka = bilka;
  return out;
};

export const PLANS: MealPlan[] = [
  {
    id: 'familieuge',
    title: 'Familieuge under 900 kr',
    tags: ['børn'],
    kcalPerDay: 1850,
    persons: 4,
    tone: 'b',
    days: [
      { day: 'Man', dish: 'Kyllingelår med rodfrugter', kcal: 640 },
      { day: 'Tir', dish: 'Linsebolognese', kcal: 590 },
      { day: 'Ons', dish: 'Fiskefrikadeller med kartofler', kcal: 610 },
      { day: 'Tor', dish: 'Bagt kartoffel-bar', kcal: 560 },
      { day: 'Fre', dish: 'Hjemmelavet pizza', kcal: 720 },
      { day: 'Lør', dish: 'Tacos', kcal: 680 },
      { day: 'Søn', dish: 'Boller i karry', kcal: 650 },
    ],
    items: [
      { name: 'Kyllingelår', qty: '1 kg', prices: p(49, 52, 55, 59, 54) },
      { name: 'Gulerødder', qty: '1 kg', prices: p(12, 10, 12, 14, 12) },
      { name: 'Rødløg', qty: '500 g', prices: p(10, 9, 11, 12, 10) },
      { name: 'Fuldkornspasta', qty: '2 pk', prices: p(24, 22, 26, 28, 25) },
      { name: 'Røde linser', qty: '500 g', prices: p(18, 16, 19, 22, 18) },
      { name: 'Hakkede tomater', qty: '3 ds', prices: p(21, 18, 22, 24, 21) },
      { name: 'Torskefilet', qty: '800 g', prices: p(79, 69, 82, 89, 79) },
      { name: 'Kartofler', qty: '3 kg', prices: p(25, 22, 24, 29, 25) },
      { name: 'Bagekartofler', qty: '1 kg', prices: p(15, 14, 16, 18, 15) },
      { name: 'Creme fraiche', qty: '2 stk', prices: p(20, 18, 20, 24, 21) },
      { name: 'Hvedemel', qty: '2 kg', prices: p(14, 12, 15, 16, 14) },
      { name: 'Gær', qty: '2 stk', prices: p(5, 4, 5, 6, 5) },
      { name: 'Mozzarella', qty: '2 stk', prices: p(28, 24, 26, 32, 28) },
      { name: 'Tortillas', qty: '2 pk', prices: p(30, 26, 30, 34, 30) },
      { name: 'Hakket oksekød', qty: '800 g', prices: p(64, 62, 66, 72, 65) },
      { name: 'Ris', qty: '1 kg', prices: p(18, 15, 18, 22, 18) },
      { name: 'Karry, kokosmælk', qty: '1 sæt', prices: p(32, 28, 31, 36, 32) },
      { name: 'Æbler', qty: '1 kg', prices: p(20, 18, 22, 24, 20) },
      { name: 'Agurk, tomat, salat', qty: '1 sæt', prices: p(38, 34, 39, 44, 38) },
      { name: 'Havregryn', qty: '1 kg', prices: p(12, 9, 12, 14, 12) },
      { name: 'Skyr', qty: '2 x 450 g', prices: p(25, 22, 26, 28, 25) },
      { name: 'Rugbrød', qty: '2 stk', prices: p(36, 30, 36, 40, 36) },
      { name: 'Ost', qty: '600 g', prices: p(52, 45, 50, 58, 52) },
      { name: 'Mælk', qty: '6 l', prices: p(66, 60, 66, 72, 66) },
      { name: 'Æg', qty: '20 stk', prices: p(48, 42, 50, 55, 48) },
      { name: 'Smør', qty: '2 stk', prices: p(40, 36, 40, 45, 40) },
      { name: 'Bananer', qty: '2 kg', prices: p(30, 26, 30, 34, 30) },
      { name: 'Pålæg', qty: '2 pk', prices: p(40, 34, 40, 46, 40) },
      { name: 'Frossent grønt', qty: '2 pk', prices: p(24, 20, 24, 28, 24) },
      { name: 'Citron, hvidløg', qty: '1 sæt', prices: p(14, 12, 15, 16, 14) },
      { name: 'Persille, dild', qty: '1 sæt', prices: p(24, 20, 22, 28, 24) },
    ],
  },
  {
    id: 'groen-hverdag',
    title: 'Grøn hverdag',
    tags: ['grøn', 'hurtig'],
    kcalPerDay: 1700,
    persons: 4,
    tone: 'c',
    days: [
      { day: 'Man', dish: 'Kikærte-curry', kcal: 560 },
      { day: 'Tir', dish: 'Pasta med grønkål og hasselnød', kcal: 590 },
      { day: 'Ons', dish: 'Bønnechili', kcal: 540 },
      { day: 'Tor', dish: 'Ovnbagte rodfrugter med hummus', kcal: 520 },
      { day: 'Fre', dish: 'Falafel-wraps', kcal: 640 },
      { day: 'Lør', dish: 'Svampe-risotto', kcal: 610 },
      { day: 'Søn', dish: 'Linsesuppe med brød', kcal: 500 },
    ],
    items: [
      { name: 'Kikærter', qty: '4 ds', prices: p(28, 24, 28, 32, 28) },
      { name: 'Kokosmælk', qty: '2 ds', prices: p(24, 20, 24, 28, 24) },
      { name: 'Grønkål', qty: '400 g', prices: p(20, 18, 22, 24, 20) },
      { name: 'Pasta', qty: '1 kg', prices: p(12, 10, 12, 14, 12) },
      { name: 'Kidneybønner', qty: '3 ds', prices: p(21, 18, 21, 24, 21) },
      { name: 'Rodfrugter', qty: '2 kg', prices: p(30, 26, 30, 34, 30) },
      { name: 'Hummus', qty: '2 stk', prices: p(30, 26, 30, 34, 30) },
      { name: 'Falafel', qty: '2 pk', prices: p(36, 30, 36, 40, 36) },
      { name: 'Wraps', qty: '2 pk', prices: p(30, 26, 30, 34, 30) },
      { name: 'Risottoris', qty: '500 g', prices: p(22, 18, 22, 26, 22) },
      { name: 'Svampe', qty: '500 g', prices: p(30, 26, 32, 36, 30) },
      { name: 'Linser', qty: '500 g', prices: p(18, 16, 19, 22, 18) },
      { name: 'Løg, hvidløg', qty: '1 sæt', prices: p(15, 12, 15, 18, 15) },
      { name: 'Grønt til salat', qty: '1 sæt', prices: p(45, 40, 46, 52, 45) },
      { name: 'Havregryn', qty: '1 kg', prices: p(12, 9, 12, 14, 12) },
      { name: 'Rugbrød', qty: '2 stk', prices: p(36, 30, 36, 40, 36) },
      { name: 'Plantedrik', qty: '4 l', prices: p(60, 52, 60, 68, 60) },
      { name: 'Frugt', qty: '3 kg', prices: p(55, 48, 56, 62, 55) },
      { name: 'Hasselnødder', qty: '200 g', prices: p(32, 28, 32, 36, 32) },
      { name: 'Krydderier', qty: '1 sæt', prices: p(40, 34, 40, 46, 40) },
    ],
  },
  {
    id: 'restemad-ugen',
    title: 'Restemad-ugen',
    tags: ['rester', 'hurtig'],
    kcalPerDay: 1800,
    persons: 4,
    tone: 'a',
    days: [
      { day: 'Man', dish: 'Stor portion kylling i fad', kcal: 650 },
      { day: 'Tir', dish: 'Kyllingesalat af rester', kcal: 520 },
      { day: 'Ons', dish: 'Chili con carne', kcal: 630 },
      { day: 'Tor', dish: 'Chili-tacos', kcal: 620 },
      { day: 'Fre', dish: 'Ovnkartofler med det sidste', kcal: 560 },
    ],
    items: [
      { name: 'Hel kylling', qty: '1,4 kg', prices: p(59, 62, 65, 69, 62) },
      { name: 'Kartofler', qty: '3 kg', prices: p(25, 22, 24, 29, 25) },
      { name: 'Salat, tomat', qty: '1 sæt', prices: p(30, 26, 32, 36, 30) },
      { name: 'Hakket oksekød', qty: '1 kg', prices: p(79, 75, 82, 89, 80) },
      { name: 'Kidneybønner', qty: '2 ds', prices: p(14, 12, 14, 16, 14) },
      { name: 'Hakkede tomater', qty: '3 ds', prices: p(21, 18, 22, 24, 21) },
      { name: 'Tortillas', qty: '2 pk', prices: p(30, 26, 30, 34, 30) },
      { name: 'Ost', qty: '400 g', prices: p(36, 32, 36, 40, 36) },
      { name: 'Løg, hvidløg', qty: '1 sæt', prices: p(15, 12, 15, 18, 15) },
      { name: 'Ris', qty: '1 kg', prices: p(18, 15, 18, 22, 18) },
      { name: 'Havregryn', qty: '1 kg', prices: p(12, 9, 12, 14, 12) },
      { name: 'Mælk', qty: '4 l', prices: p(44, 40, 44, 48, 44) },
      { name: 'Rugbrød', qty: '1 stk', prices: p(18, 15, 18, 20, 18) },
      { name: 'Æg', qty: '10 stk', prices: p(25, 22, 26, 28, 25) },
      { name: 'Frugt', qty: '2 kg', prices: p(38, 34, 38, 42, 38) },
    ],
  },
  {
    id: 'madpakke-ugen',
    title: 'Madpakke-ugen',
    tags: ['børn', 'madpakke'],
    kcalPerDay: 1800,
    persons: 4,
    tone: 'c',
    days: [
      { day: 'Man', dish: 'Frikadeller med kartofler', kcal: 660 },
      { day: 'Tir', dish: 'Pastasalat med kylling', kcal: 580 },
      { day: 'Ons', dish: 'Fiskefilet med rugbrød', kcal: 560 },
      { day: 'Tor', dish: 'Grøntsagstærte', kcal: 540 },
      { day: 'Fre', dish: 'Burgere', kcal: 720 },
      { day: 'Lør', dish: 'Pandekager med fyld', kcal: 640 },
      { day: 'Søn', dish: 'Kylling i fad', kcal: 620 },
    ],
    items: [
      { name: 'Hakket kalv og flæsk', qty: '1 kg', prices: p(69, 65, 72, 79, 69) },
      { name: 'Kartofler', qty: '3 kg', prices: p(25, 22, 24, 29, 25) },
      { name: 'Kyllingebryst', qty: '1 kg', prices: p(75, 69, 79, 85, 75) },
      { name: 'Pasta', qty: '1 kg', prices: p(12, 10, 12, 14, 12) },
      { name: 'Fiskefilet', qty: '600 g', prices: p(45, 40, 46, 52, 45) },
      { name: 'Tærtedej', qty: '2 stk', prices: p(30, 26, 30, 34, 30) },
      { name: 'Burgerboller', qty: '2 pk', prices: p(30, 24, 30, 34, 30) },
      { name: 'Hakket oksekød', qty: '800 g', prices: p(64, 62, 66, 72, 65) },
      { name: 'Mel, æg, mælk', qty: '1 sæt', prices: p(70, 62, 70, 78, 70) },
      { name: 'Rugbrød', qty: '3 stk', prices: p(54, 45, 54, 60, 54) },
      { name: 'Pålæg', qty: '4 pk', prices: p(80, 68, 80, 92, 80) },
      { name: 'Grønt til madpakker', qty: '1 sæt', prices: p(60, 52, 62, 70, 60) },
      { name: 'Frugt', qty: '3 kg', prices: p(55, 48, 56, 62, 55) },
      { name: 'Ost', qty: '600 g', prices: p(52, 45, 50, 58, 52) },
      { name: 'Smør', qty: '2 stk', prices: p(40, 36, 40, 45, 40) },
    ],
  },
  {
    id: 'fiskeugen',
    title: 'Fiskeugen',
    tags: ['fisk', 'grøn'],
    kcalPerDay: 1750,
    persons: 4,
    tone: 'b',
    days: [
      { day: 'Man', dish: 'Ovnbagt laks med kartofler', kcal: 640 },
      { day: 'Tir', dish: 'Fiskefrikadeller', kcal: 600 },
      { day: 'Ons', dish: 'Torsk med sennepssovs', kcal: 560 },
      { day: 'Tor', dish: 'Rejesalat med brød', kcal: 520 },
      { day: 'Fre', dish: 'Fisketacos', kcal: 660 },
      { day: 'Lør', dish: 'Fiskesuppe', kcal: 540 },
      { day: 'Søn', dish: 'Stegt rødspætte', kcal: 610 },
    ],
    items: [
      { name: 'Laksefilet', qty: '800 g', prices: p(119, 109, 125, 139, 119) },
      { name: 'Fiskefars', qty: '800 g', prices: p(60, 55, 62, 69, 60) },
      { name: 'Torskefilet', qty: '800 g', prices: p(79, 69, 82, 89, 79) },
      { name: 'Rejer', qty: '400 g', prices: p(55, 49, 58, 65, 55) },
      { name: 'Rødspættefilet', qty: '800 g', prices: p(85, 79, 89, 95, 85) },
      { name: 'Kartofler', qty: '4 kg', prices: p(33, 29, 32, 38, 33) },
      { name: 'Tortillas', qty: '2 pk', prices: p(30, 26, 30, 34, 30) },
      { name: 'Grønt', qty: '1 sæt', prices: p(70, 62, 72, 80, 70) },
      { name: 'Fløde, sennep', qty: '1 sæt', prices: p(35, 30, 35, 40, 35) },
      { name: 'Rugbrød', qty: '2 stk', prices: p(36, 30, 36, 40, 36) },
      { name: 'Havregryn', qty: '1 kg', prices: p(12, 9, 12, 14, 12) },
      { name: 'Mælk', qty: '5 l', prices: p(55, 50, 55, 60, 55) },
      { name: 'Æg', qty: '10 stk', prices: p(25, 22, 26, 28, 25) },
      { name: 'Frugt', qty: '3 kg', prices: p(55, 48, 56, 62, 55) },
    ],
  },
  {
    id: 'hurtig-hverdag',
    title: 'Hurtig hverdag – 30 min',
    tags: ['hurtig', 'børn'],
    kcalPerDay: 1800,
    persons: 4,
    tone: 'a',
    days: [
      { day: 'Man', dish: 'Wok med kylling', kcal: 600 },
      { day: 'Tir', dish: 'Pasta carbonara', kcal: 700 },
      { day: 'Ons', dish: 'Omelet med brød', kcal: 520 },
      { day: 'Tor', dish: 'Kødsovs med spaghetti', kcal: 680 },
      { day: 'Fre', dish: 'Pitabrød med fyld', kcal: 640 },
      { day: 'Lør', dish: 'Nudelsuppe', kcal: 540 },
      { day: 'Søn', dish: 'Pølser og kartoffelsalat', kcal: 660 },
    ],
    items: [
      { name: 'Kyllingebryst', qty: '1 kg', prices: p(75, 69, 79, 85, 75) },
      { name: 'Wok-grønt', qty: '2 pk', prices: p(40, 34, 40, 46, 40) },
      { name: 'Nudler', qty: '1 kg', prices: p(24, 20, 24, 28, 24) },
      { name: 'Bacon', qty: '2 pk', prices: p(40, 36, 40, 46, 40) },
      { name: 'Pasta', qty: '1,5 kg', prices: p(18, 15, 18, 21, 18) },
      { name: 'Æg', qty: '20 stk', prices: p(48, 42, 50, 55, 48) },
      { name: 'Hakket oksekød', qty: '800 g', prices: p(64, 62, 66, 72, 65) },
      { name: 'Pitabrød', qty: '2 pk', prices: p(24, 20, 24, 28, 24) },
      { name: 'Pølser', qty: '2 pk', prices: p(50, 44, 50, 56, 50) },
      { name: 'Kartofler', qty: '2 kg', prices: p(17, 15, 16, 20, 17) },
      { name: 'Grønt', qty: '1 sæt', prices: p(60, 52, 62, 70, 60) },
      { name: 'Ost', qty: '400 g', prices: p(36, 32, 36, 40, 36) },
      { name: 'Mælk', qty: '5 l', prices: p(55, 50, 55, 60, 55) },
      { name: 'Rugbrød', qty: '2 stk', prices: p(36, 30, 36, 40, 36) },
      { name: 'Frugt', qty: '3 kg', prices: p(55, 48, 56, 62, 55) },
    ],
  },
];

export const planById = (id: string): MealPlan | undefined => PLANS.find((p) => p.id === id);
