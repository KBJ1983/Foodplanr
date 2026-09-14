/**
 * Ingredient ontology (example subset). Mirrors the `ingredient` table: recipes
 * and offers reference these ids, never free text. `baseline` is our own
 * estimated normal price (DKK per kg, per litre or per piece) used when no
 * valid offer exists — it mirrors `ingredient.default_price_per_unit` and will
 * be replaced by `price_history` medians once real offers flow.
 */
export type Unit = 'g' | 'ml' | 'pcs';

export interface Ingredient {
  id: string;
  name: string;
  unit: Unit;
  /** DKK per kg (g), per litre (ml) or per piece (pcs). Our estimate. */
  baseline: number;
}

const I = (id: string, name: string, unit: Unit, baseline: number): Ingredient => ({ id, name, unit, baseline });

export const INGREDIENTS: Ingredient[] = [
  // meat & fish
  I('kyllingelaar', 'Kyllingelår', 'g', 55),
  I('kyllingebryst', 'Kyllingebryst', 'g', 90),
  I('hakket-oksekoed', 'Hakket oksekød', 'g', 85),
  I('hakket-kalv-flaesk', 'Hakket kalv og flæsk', 'g', 75),
  I('torskefilet', 'Torskefilet', 'g', 110),
  I('laksefilet', 'Laksefilet', 'g', 160),
  I('fiskefars', 'Fiskefars', 'g', 80),
  I('bacon', 'Bacon', 'g', 100),
  // pulses, grains, canned
  I('roede-linser', 'Røde linser', 'g', 35),
  I('kikaerter', 'Kikærter (dåse)', 'g', 22),
  I('kidneyboenner', 'Kidneybønner (dåse)', 'g', 22),
  I('hakkede-tomater', 'Hakkede tomater', 'g', 15),
  I('tomatpure', 'Tomatpuré', 'g', 40),
  I('pasta', 'Pasta', 'g', 18),
  I('fuldkornspasta', 'Fuldkornspasta', 'g', 24),
  I('ris', 'Ris', 'g', 20),
  I('risottoris', 'Risottoris', 'g', 40),
  I('nudler', 'Nudler', 'g', 25),
  I('hvedemel', 'Hvedemel', 'g', 8),
  I('gaer', 'Gær', 'pcs', 3),
  I('rugbroed', 'Rugbrød', 'g', 25),
  I('tortillas', 'Tortillas', 'pcs', 3.5),
  I('wraps', 'Wraps', 'pcs', 4),
  I('burgerboller', 'Burgerboller', 'pcs', 3),
  I('taertedej', 'Tærtedej', 'pcs', 12),
  I('falafel', 'Falafel', 'g', 70),
  I('hummus', 'Hummus', 'g', 60),
  // vegetables
  I('kartofler', 'Kartofler', 'g', 10),
  I('bagekartofler', 'Bagekartofler', 'g', 14),
  I('guleroedder', 'Gulerødder', 'g', 12),
  I('rodfrugter', 'Rodfrugter, blandede', 'g', 18),
  I('loeg', 'Løg', 'g', 12),
  I('hvidloeg', 'Hvidløg', 'pcs', 3),
  I('groenkaal', 'Grønkål', 'g', 45),
  I('spinat', 'Spinat', 'g', 45),
  I('svampe', 'Svampe', 'g', 60),
  I('peberfrugt', 'Peberfrugt', 'pcs', 6),
  I('squash', 'Squash', 'g', 20),
  I('broccoli', 'Broccoli', 'g', 30),
  I('wok-groent', 'Wok-grønt (frost)', 'g', 40),
  I('majs', 'Majs (dåse)', 'g', 20),
  I('agurk', 'Agurk', 'pcs', 8),
  I('tomater', 'Tomater', 'g', 30),
  I('salat', 'Salathoved', 'pcs', 15),
  I('citron', 'Citron', 'pcs', 4),
  I('aebler', 'Æbler', 'g', 20),
  I('persille', 'Persille (bundt)', 'pcs', 15),
  I('dild', 'Dild (bundt)', 'pcs', 15),
  // dairy & eggs
  I('mozzarella', 'Mozzarella', 'g', 70),
  I('ost-revet', 'Revet ost', 'g', 90),
  I('feta', 'Feta', 'g', 90),
  I('creme-fraiche', 'Creme fraiche', 'g', 30),
  I('floede', 'Fløde', 'ml', 35),
  I('maelk', 'Mælk', 'ml', 11),
  I('aeg', 'Æg', 'pcs', 2.8),
  I('smoer', 'Smør', 'g', 80),
  // pantry
  I('kokosmaelk', 'Kokosmælk', 'ml', 22),
  I('karrypasta', 'Karrypasta', 'g', 120),
  I('sennep', 'Sennep', 'g', 40),
  I('remoulade', 'Remoulade', 'g', 50),
  I('hasselnoedder', 'Hasselnødder', 'g', 150),
];

const byId = new Map(INGREDIENTS.map((i) => [i.id, i]));

export function ingredientById(id: string): Ingredient {
  const i = byId.get(id);
  if (!i) throw new Error(`Unknown ingredient '${id}'`);
  return i;
}

/** 800 g → "800 g", 1200 g → "1,2 kg", 8 pcs → "8 stk". */
export function formatQty(qty: number, unit: Unit): string {
  if (unit === 'pcs') return `${Math.ceil(qty)} stk`;
  const big = unit === 'g' ? 'kg' : 'l';
  if (qty >= 1000) {
    const v = qty / 1000;
    return `${(Math.round(v * 10) / 10).toString().replace('.', ',')} ${big}`;
  }
  return `${Math.round(qty)} ${unit}`;
}
