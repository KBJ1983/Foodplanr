'use client';

import { useState } from 'react';
import { formatCopyList } from '@madplan/checkout';
import type { MealPlan } from '@/lib/mock-data';
import { storeById } from '@/lib/mock-data';
import { kr } from '@/lib/format';
import { useStore } from '@/lib/store';
import { allStrategies } from '@/lib/strategy';

/**
 * Store header blocks (Rema = magenta, Lidl = blue, Netto = yellow), item rows
 * with 4px-radius checkboxes; counter updates live. Groups in the strategy's
 * store order. On desktop the groups become columns.
 */
export function ShoppingList({ plan, columns = false }: { plan: MealPlan; columns?: boolean }) {
  const { state, toggleChecked } = useStore();
  const result = allStrategies(plan, state.stores)[state.strategy];
  const total = result.groups.reduce((a, g) => a + g.items.length, 0);
  const done = result.groups.reduce((a, g) => a + g.items.filter((i) => state.checked.includes(`${plan.id}|${i.name}`)).length, 0);
  const [copied, setCopied] = useState(false);

  async function copy() {
    // copy_list handoff — works for every retailer without any third-party rights.
    const text = result.groups
      .map((g) =>
        formatCopyList({
          retailerId: g.store,
          retailerName: storeById(g.store).name,
          lines: g.items.map((i) => ({ ingredientId: i.name, name: `${i.name} ${i.qty}`, qty: 1, unit: 'pcs' as const, estPriceDkk: i.price })),
        }),
      )
      .join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Kopiér listen:', text);
    }
  }

  return (
    <>
      <div className="row ae" style={{ gap: 12 }}>
        <p className="num" style={{ fontSize: columns ? 80 : 44 }}>
          {done}
          <small className="dim">/{total}</small>
        </p>
        <p className="mono" style={{ paddingBottom: columns ? 12 : 6 }}>
          varer i kurven{columns ? ` · ${plan.title}` : ''}
        </p>
        <button type="button" className="chip" style={{ marginLeft: 'auto' }} onClick={copy}>
          {copied ? 'Kopieret ✓' : 'Kopiér liste'}
        </button>
      </div>
      <div className={columns ? 'grid' : 'col'} style={columns ? { gridTemplateColumns: `repeat(${Math.max(1, result.groups.length)}, 1fr)`, alignItems: 'start' } : { gap: 6 }}>
        {result.groups.map((g) => {
          const store = storeById(g.store);
          return (
            <div key={g.store} className="col" style={{ gap: 0 }}>
              <div className={`blk ${store.tone}`}>
                <b>{store.name}</b>
                <span>{kr(g.total)}</span>
              </div>
              {g.items.map((item) => {
                const key = `${plan.id}|${item.name}`;
                const on = state.checked.includes(key);
                return (
                  <button key={item.name} type="button" className="li" role="checkbox" aria-checked={on} onClick={() => toggleChecked(plan.id, item.name)}>
                    <span className="row ac" style={{ textDecoration: on ? 'line-through' : 'none', opacity: on ? 0.6 : 1 }}>
                      <i className={`cb ${on ? 'x' : ''}`} aria-hidden="true" />
                      {item.name} {item.qty}
                    </span>
                    <span className="s">{item.price}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
      {result.missing.length > 0 && (
        <p className="s">Ikke i de valgte butikker: {result.missing.map((m) => m.name).join(', ')}.</p>
      )}
    </>
  );
}
