/**
 * Checkout handoff (brief §7). Only `copy_list` needs no third-party rights.
 * `deeplink_list` and `partner_api` are added per retailer once an agreement
 * (docs/legal/) exists; the interface does not change.
 */
export type CheckoutMode = 'copy_list' | 'deeplink_list' | 'partner_api';

export interface ShoppingListLine {
  ingredientId: string;
  /** Display name — ours, from the ontology. */
  name: string;
  qty: number;
  unit: 'g' | 'ml' | 'pcs';
  offerId?: string;
  estPriceDkk?: number;
}

export interface ShoppingList {
  retailerId: string;
  retailerName: string;
  lines: ShoppingListLine[];
}

export interface Basket {
  retailerId: string;
  mode: CheckoutMode;
  /** For copy_list: the text. For deeplink/partner: retailer product references. */
  payload: unknown;
}

export interface BasketResult {
  basket: Basket;
  unmatchedLines: ShoppingListLine[];
}

export interface HandoffUser {
  id: string;
}

export interface CheckoutHandoff {
  readonly retailerId: string;
  readonly mode: CheckoutMode;
  buildBasket(list: ShoppingList): Promise<BasketResult>;
  handoff(basket: Basket, user: HandoffUser): Promise<{ url?: string; status: string }>;
}

function formatQty(line: ShoppingListLine): string {
  if (line.unit === 'pcs') return `${line.qty} stk`;
  if (line.unit === 'g') return line.qty >= 1000 ? `${(line.qty / 1000).toFixed(1).replace('.', ',')} kg` : `${Math.round(line.qty)} g`;
  return line.qty >= 1000 ? `${(line.qty / 1000).toFixed(1).replace('.', ',')} l` : `${Math.round(line.qty)} ml`;
}

export function formatCopyList(list: ShoppingList): string {
  const header = `Indkøbsliste – ${list.retailerName}`;
  const body = list.lines.map((l) => `- ${l.name}, ${formatQty(l)}`);
  const total = list.lines.reduce((acc, l) => acc + (l.estPriceDkk ?? 0), 0);
  const footer = total > 0 ? `\nEstimeret pris: ${total.toFixed(2).replace('.', ',')} kr.` : '';
  return [header, '', ...body, footer].join('\n').trimEnd();
}

/** Works for every retailer from day one. */
export class CopyListHandoff implements CheckoutHandoff {
  readonly mode = 'copy_list' as const;
  constructor(readonly retailerId: string) {}

  async buildBasket(list: ShoppingList): Promise<BasketResult> {
    return {
      basket: { retailerId: this.retailerId, mode: this.mode, payload: formatCopyList(list) },
      unmatchedLines: [],
    };
  }

  async handoff(_basket: Basket, _user: HandoffUser): Promise<{ url?: string; status: string }> {
    return { status: 'ready_to_copy' };
  }
}
