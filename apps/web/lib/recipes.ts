/**
 * Our own recipes (brief §0.6: 100 % ours). Quantities are for `servingsBase`
 * persons and are scaled by the engine. Mirrors `recipe` + `recipe_ingredient`
 * + `recipe_step`. Example content for the prototype.
 */
import type { Unit } from './ingredients';

export type RecipeTag = 'børn' | 'hurtig' | 'grøn' | 'fisk' | 'rester' | 'madpakke';

export interface RecipeLine {
  ingredientId: string;
  qty: number;
  unit: Unit;
}

export interface Recipe {
  id: string;
  title: string;
  servingsBase: number;
  prepMin: number;
  /** Dinner kcal per serving (computed from Frida data in phase 1; example numbers here). */
  kcalPerServing: number;
  tags: RecipeTag[];
  lines: RecipeLine[];
  steps: string[];
}

const L = (ingredientId: string, qty: number, unit: Unit): RecipeLine => ({ ingredientId, qty, unit });

export const RECIPES: Recipe[] = [
  {
    id: 'kyllingelaar-rodfrugter',
    title: 'Kyllingelår med rodfrugter',
    servingsBase: 4,
    prepMin: 50,
    kcalPerServing: 640,
    tags: ['børn'],
    lines: [L('kyllingelaar', 1000, 'g'), L('rodfrugter', 800, 'g'), L('kartofler', 600, 'g'), L('hvidloeg', 2, 'pcs'), L('citron', 1, 'pcs'), L('persille', 1, 'pcs')],
    steps: [
      'Tænd ovnen på 200 °C. Skær rodfrugter og kartofler i grove tern.',
      'Fordel grønt i et fad, læg kyllingelårene ovenpå. Krydr med salt, peber, presset hvidløg og citronsaft.',
      'Bag 40–45 min., til kyllingen er gylden og saften klar.',
      'Drys med hakket persille og servér direkte fra fadet.',
    ],
  },
  {
    id: 'linsebolognese',
    title: 'Linsebolognese',
    servingsBase: 4,
    prepMin: 35,
    kcalPerServing: 590,
    tags: ['grøn', 'børn'],
    lines: [L('roede-linser', 300, 'g'), L('hakkede-tomater', 800, 'g'), L('loeg', 200, 'g'), L('guleroedder', 200, 'g'), L('hvidloeg', 2, 'pcs'), L('tomatpure', 70, 'g'), L('fuldkornspasta', 400, 'g')],
    steps: [
      'Svits hakket løg, gulerod og hvidløg i olie 5 min.',
      'Tilsæt tomatpuré, linser og hakkede tomater plus 3 dl vand. Simr 20 min.',
      'Kog pastaen. Smag saucen til med salt, peber og lidt sukker.',
    ],
  },
  {
    id: 'fiskefrikadeller',
    title: 'Fiskefrikadeller med kartofler',
    servingsBase: 4,
    prepMin: 40,
    kcalPerServing: 610,
    tags: ['fisk', 'børn'],
    lines: [L('fiskefars', 800, 'g'), L('aeg', 2, 'pcs'), L('loeg', 100, 'g'), L('hvedemel', 50, 'g'), L('smoer', 50, 'g'), L('kartofler', 800, 'g'), L('remoulade', 100, 'g'), L('dild', 1, 'pcs')],
    steps: [
      'Rør fars med æg, finthakket løg, mel, salt, peber og hakket dild.',
      'Kog kartoflerne.',
      'Form frikadeller med en ske og steg dem gyldne i smør, 4–5 min. pr. side.',
      'Servér med remoulade og citron.',
    ],
  },
  {
    id: 'bagt-kartoffel-bar',
    title: 'Bagt kartoffel-bar',
    servingsBase: 4,
    prepMin: 60,
    kcalPerServing: 560,
    tags: ['børn', 'rester'],
    lines: [L('bagekartofler', 1200, 'g'), L('creme-fraiche', 300, 'g'), L('ost-revet', 200, 'g'), L('bacon', 150, 'g'), L('majs', 200, 'g'), L('agurk', 1, 'pcs')],
    steps: [
      'Bag kartoflerne ved 200 °C i ca. 55 min., til de er møre.',
      'Steg bacon sprødt. Skær agurk i tern.',
      'Sæt alt fyld på bordet i skåle, så alle fylder deres egen kartoffel.',
    ],
  },
  {
    id: 'hjemmelavet-pizza',
    title: 'Hjemmelavet pizza',
    servingsBase: 4,
    prepMin: 90,
    kcalPerServing: 720,
    tags: ['børn'],
    lines: [L('hvedemel', 600, 'g'), L('gaer', 1, 'pcs'), L('hakkede-tomater', 400, 'g'), L('mozzarella', 400, 'g'), L('peberfrugt', 1, 'pcs'), L('svampe', 200, 'g')],
    steps: [
      'Rør gær ud i 4 dl lunt vand, tilsæt mel, salt og lidt olie. Ælt og lad hæve 1 time.',
      'Kog hakkede tomater ind med salt og oregano i 10 min.',
      'Rul dejen ud, fordel sauce, mozzarella og grønt. Bag ved 250 °C i 10–12 min.',
    ],
  },
  {
    id: 'tacos',
    title: 'Tacos',
    servingsBase: 4,
    prepMin: 30,
    kcalPerServing: 680,
    tags: ['børn', 'hurtig'],
    lines: [L('hakket-oksekoed', 600, 'g'), L('tortillas', 12, 'pcs'), L('salat', 1, 'pcs'), L('tomater', 300, 'g'), L('ost-revet', 150, 'g'), L('creme-fraiche', 200, 'g'), L('majs', 150, 'g')],
    steps: [
      'Brun kødet, krydr med spidskommen, paprika, salt og peber.',
      'Snit salat og tomat. Varm tortillas.',
      'Fyld selv ved bordet.',
    ],
  },
  {
    id: 'boller-i-karry',
    title: 'Boller i karry',
    servingsBase: 4,
    prepMin: 45,
    kcalPerServing: 650,
    tags: ['børn'],
    lines: [L('hakket-kalv-flaesk', 600, 'g'), L('aeg', 1, 'pcs'), L('loeg', 150, 'g'), L('karrypasta', 40, 'g'), L('kokosmaelk', 400, 'ml'), L('aebler', 200, 'g'), L('ris', 400, 'g')],
    steps: [
      'Rør fars med æg, salt og peber. Form boller og kog dem i letsaltet vand 8 min.',
      'Svits løg og karrypasta, tilsæt kokosmælk og 2 dl kogevand. Simr 10 min. med æbletern.',
      'Vend bollerne i saucen og servér med ris.',
    ],
  },
  {
    id: 'kikaerte-curry',
    title: 'Kikærte-curry',
    servingsBase: 4,
    prepMin: 30,
    kcalPerServing: 560,
    tags: ['grøn', 'hurtig'],
    lines: [L('kikaerter', 800, 'g'), L('kokosmaelk', 400, 'ml'), L('karrypasta', 40, 'g'), L('spinat', 200, 'g'), L('loeg', 150, 'g'), L('ris', 400, 'g')],
    steps: [
      'Svits løg og karrypasta. Tilsæt kikærter og kokosmælk, simr 15 min.',
      'Vend spinat i til sidst. Servér med ris.',
    ],
  },
  {
    id: 'pasta-groenkaal',
    title: 'Pasta med grønkål og hasselnød',
    servingsBase: 4,
    prepMin: 25,
    kcalPerServing: 590,
    tags: ['grøn', 'hurtig'],
    lines: [L('pasta', 500, 'g'), L('groenkaal', 300, 'g'), L('hasselnoedder', 80, 'g'), L('hvidloeg', 2, 'pcs'), L('citron', 1, 'pcs'), L('ost-revet', 100, 'g')],
    steps: [
      'Kog pastaen. Rist hasselnødder på en tør pande og hak dem.',
      'Svits hvidløg og grønkål 3 min., vend pasta, citronsaft, ost og nødder i.',
    ],
  },
  {
    id: 'boennechili',
    title: 'Bønnechili',
    servingsBase: 4,
    prepMin: 40,
    kcalPerServing: 540,
    tags: ['grøn'],
    lines: [L('kidneyboenner', 800, 'g'), L('hakkede-tomater', 800, 'g'), L('loeg', 200, 'g'), L('peberfrugt', 2, 'pcs'), L('majs', 200, 'g'), L('ris', 400, 'g')],
    steps: ['Svits løg og peberfrugt. Tilsæt tomater, bønner, majs og chili. Simr 25 min.', 'Servér med ris.'],
  },
  {
    id: 'rodfrugter-hummus',
    title: 'Ovnbagte rodfrugter med hummus',
    servingsBase: 4,
    prepMin: 45,
    kcalPerServing: 520,
    tags: ['grøn'],
    lines: [L('rodfrugter', 1200, 'g'), L('hummus', 300, 'g'), L('feta', 150, 'g'), L('citron', 1, 'pcs'), L('persille', 1, 'pcs')],
    steps: ['Bag rodfrugter i tern ved 220 °C i 35 min.', 'Anret på hummus, drys med feta, persille og citronsaft.'],
  },
  {
    id: 'falafel-wraps',
    title: 'Falafel-wraps',
    servingsBase: 4,
    prepMin: 25,
    kcalPerServing: 640,
    tags: ['grøn', 'hurtig'],
    lines: [L('falafel', 600, 'g'), L('wraps', 8, 'pcs'), L('hummus', 200, 'g'), L('agurk', 1, 'pcs'), L('tomater', 300, 'g'), L('salat', 1, 'pcs')],
    steps: ['Varm falafel i ovnen 12 min.', 'Snit grønt. Fyld wraps med hummus, falafel og grønt.'],
  },
  {
    id: 'svampe-risotto',
    title: 'Svampe-risotto',
    servingsBase: 4,
    prepMin: 40,
    kcalPerServing: 610,
    tags: ['grøn'],
    lines: [L('risottoris', 400, 'g'), L('svampe', 500, 'g'), L('loeg', 150, 'g'), L('floede', 200, 'ml'), L('ost-revet', 100, 'g'), L('smoer', 50, 'g')],
    steps: [
      'Steg svampe i smør, tag dem af panden. Svits løg, tilsæt ris.',
      'Tilsæt 1 l varm bouillon lidt ad gangen under omrøring i 18 min.',
      'Rør fløde, ost og svampe i.',
    ],
  },
  {
    id: 'linsesuppe',
    title: 'Linsesuppe med brød',
    servingsBase: 4,
    prepMin: 35,
    kcalPerServing: 500,
    tags: ['grøn', 'hurtig'],
    lines: [L('roede-linser', 400, 'g'), L('guleroedder', 300, 'g'), L('loeg', 200, 'g'), L('hakkede-tomater', 400, 'g'), L('kokosmaelk', 400, 'ml'), L('rugbroed', 300, 'g')],
    steps: ['Svits løg og gulerod. Tilsæt linser, tomater, kokosmælk og 8 dl vand. Simr 25 min.', 'Blend groft og servér med brød.'],
  },
  {
    id: 'kylling-i-fad',
    title: 'Stor portion kylling i fad',
    servingsBase: 4,
    prepMin: 75,
    kcalPerServing: 650,
    tags: ['rester', 'børn'],
    lines: [L('kyllingelaar', 1500, 'g'), L('kartofler', 1000, 'g'), L('guleroedder', 400, 'g'), L('loeg', 200, 'g'), L('hvidloeg', 3, 'pcs')],
    steps: ['Alt i et fad med olie, salt, peber og timian. Bag ved 200 °C i 60 min.', 'Gem det overskydende kød til næste dags salat.'],
  },
  {
    id: 'kyllingesalat',
    title: 'Kyllingesalat af rester',
    servingsBase: 4,
    prepMin: 20,
    kcalPerServing: 520,
    tags: ['rester', 'hurtig'],
    lines: [L('kyllingebryst', 500, 'g'), L('salat', 2, 'pcs'), L('agurk', 1, 'pcs'), L('tomater', 300, 'g'), L('feta', 150, 'g'), L('rugbroed', 300, 'g')],
    steps: ['Pil kyllingekød fra i stykker (eller steg bryst).', 'Bland med snittet grønt og feta. Servér med rugbrød.'],
  },
  {
    id: 'chili-con-carne',
    title: 'Chili con carne',
    servingsBase: 4,
    prepMin: 50,
    kcalPerServing: 630,
    tags: ['rester', 'børn'],
    lines: [L('hakket-oksekoed', 800, 'g'), L('kidneyboenner', 500, 'g'), L('hakkede-tomater', 800, 'g'), L('loeg', 200, 'g'), L('peberfrugt', 1, 'pcs'), L('ris', 400, 'g')],
    steps: ['Brun kød og løg. Tilsæt tomater, bønner, peberfrugt og krydderier. Simr 30 min.', 'Servér med ris. Resten bliver til tacos.'],
  },
  {
    id: 'frikadeller',
    title: 'Frikadeller med kartofler',
    servingsBase: 4,
    prepMin: 40,
    kcalPerServing: 660,
    tags: ['børn', 'madpakke'],
    lines: [L('hakket-kalv-flaesk', 800, 'g'), L('aeg', 2, 'pcs'), L('loeg', 150, 'g'), L('hvedemel', 60, 'g'), L('maelk', 100, 'ml'), L('smoer', 50, 'g'), L('kartofler', 1000, 'g'), L('broccoli', 400, 'g')],
    steps: ['Rør fars med æg, løg, mel, mælk, salt og peber. Lad hvile 15 min.', 'Steg frikadeller i smør. Kog kartofler og damp broccoli.', 'Lav dobbelt portion: resten er madpakke.'],
  },
  {
    id: 'pastasalat-kylling',
    title: 'Pastasalat med kylling',
    servingsBase: 4,
    prepMin: 25,
    kcalPerServing: 580,
    tags: ['madpakke', 'hurtig', 'børn'],
    lines: [L('kyllingebryst', 500, 'g'), L('pasta', 400, 'g'), L('peberfrugt', 1, 'pcs'), L('agurk', 1, 'pcs'), L('majs', 150, 'g'), L('creme-fraiche', 200, 'g')],
    steps: ['Kog pasta, steg kylling i tern.', 'Bland alt med creme fraiche, salt, peber og citron.'],
  },
  {
    id: 'groentsagstaerte',
    title: 'Grøntsagstærte',
    servingsBase: 4,
    prepMin: 50,
    kcalPerServing: 540,
    tags: ['grøn', 'madpakke'],
    lines: [L('taertedej', 1, 'pcs'), L('aeg', 4, 'pcs'), L('floede', 200, 'ml'), L('squash', 300, 'g'), L('spinat', 200, 'g'), L('feta', 200, 'g')],
    steps: ['Beklæd form med dej. Fordel grønt og feta.', 'Pisk æg og fløde med salt, hæld over. Bag ved 190 °C i 35 min.'],
  },
  {
    id: 'burgere',
    title: 'Burgere',
    servingsBase: 4,
    prepMin: 35,
    kcalPerServing: 720,
    tags: ['børn'],
    lines: [L('hakket-oksekoed', 600, 'g'), L('burgerboller', 8, 'pcs'), L('ost-revet', 150, 'g'), L('salat', 1, 'pcs'), L('tomater', 200, 'g'), L('agurk', 1, 'pcs')],
    steps: ['Form 8 bøffer, krydr og steg 3–4 min. pr. side. Smelt ost på til sidst.', 'Rist boller og saml burgere med grønt.'],
  },
  {
    id: 'pandekager-fyld',
    title: 'Pandekager med fyld',
    servingsBase: 4,
    prepMin: 30,
    kcalPerServing: 640,
    tags: ['børn', 'madpakke'],
    lines: [L('hvedemel', 300, 'g'), L('aeg', 4, 'pcs'), L('maelk', 700, 'ml'), L('smoer', 50, 'g'), L('ost-revet', 150, 'g'), L('spinat', 200, 'g')],
    steps: ['Pisk mel, æg og mælk til en glat dej, hvil 15 min.', 'Bag tynde pandekager, fyld med ost og spinat og rul dem.'],
  },
  {
    id: 'ovnbagt-laks',
    title: 'Ovnbagt laks med kartofler',
    servingsBase: 4,
    prepMin: 30,
    kcalPerServing: 640,
    tags: ['fisk', 'hurtig'],
    lines: [L('laksefilet', 700, 'g'), L('kartofler', 800, 'g'), L('broccoli', 400, 'g'), L('citron', 1, 'pcs'), L('dild', 1, 'pcs')],
    steps: ['Kog kartofler. Bag laks med citronskiver og dild ved 200 °C i 15 min.', 'Damp broccoli og servér.'],
  },
  {
    id: 'torsk-sennepssovs',
    title: 'Torsk med sennepssovs',
    servingsBase: 4,
    prepMin: 35,
    kcalPerServing: 560,
    tags: ['fisk'],
    lines: [L('torskefilet', 800, 'g'), L('kartofler', 800, 'g'), L('sennep', 40, 'g'), L('floede', 200, 'ml'), L('smoer', 50, 'g'), L('guleroedder', 400, 'g')],
    steps: ['Kog kartofler og gulerødder.', 'Damp torsken 8 min. Kog fløde op med sennep og smør til en sovs.'],
  },
  {
    id: 'wok-kylling',
    title: 'Wok med kylling',
    servingsBase: 4,
    prepMin: 25,
    kcalPerServing: 600,
    tags: ['hurtig', 'børn'],
    lines: [L('kyllingebryst', 600, 'g'), L('wok-groent', 600, 'g'), L('nudler', 400, 'g'), L('hvidloeg', 2, 'pcs')],
    steps: ['Steg kylling i strimler hårdt. Tilsæt hvidløg og grønt, wok 4 min.', 'Vend kogte nudler og soja i.'],
  },
  {
    id: 'omelet',
    title: 'Omelet med brød',
    servingsBase: 4,
    prepMin: 20,
    kcalPerServing: 520,
    tags: ['hurtig', 'rester'],
    lines: [L('aeg', 10, 'pcs'), L('ost-revet', 150, 'g'), L('tomater', 300, 'g'), L('rugbroed', 300, 'g'), L('smoer', 30, 'g')],
    steps: ['Pisk æg med salt, bag omelet i smør ved svag varme, drys ost og tomat på.', 'Servér med rugbrød.'],
  },
];

const byId = new Map(RECIPES.map((r) => [r.id, r]));

export function recipeById(id: string): Recipe {
  const r = byId.get(id);
  if (!r) throw new Error(`Unknown recipe '${id}'`);
  return r;
}
