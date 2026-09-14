'use client';

import { useState } from 'react';
import { formatCopyList } from '@madplan/checkout';
import type { MealPlan } from '@/lib/mock-data';
import { storeById } from '@/lib/mock-data';
import { kr } from '@/lib/format';
import { useStore } from '@/lib/store';
import { STRATEGY_LABEL, allStrategies } from '@/lib/strategy';
import { isoWeekNumber, weekLabel } from '@/lib/week';
import { PriceSource } from './PriceSource';

/**
 * Store header blocks (Rema = magenta, Lidl = blue, Netto = yellow), item rows
 * with 4px-radius checkboxes and a "kr" price; counter updates live. Groups in
 * the strategy's store order. On desktop the groups become columns.
 */
export function ShoppingList({ plan, columns = false }: { plan: MealPlan; columns?: boolean }) {
  const { state, toggleChecked, weekStart } = useStore();
  const result = allStrategies(plan, state.stores)[state.strategy];
  const total = result.groups.reduce((a, g) => a + g.items.length, 0);
  const done = result.groups.reduce((a, g) => a + g.items.filter((i) => state.checked.includes(`${plan.id}|${i.name}`)).length, 0);
  const [copied, setCopied] = useState(false);

  async function copy() {
    // copy_list handoff — works for every retailer without any third-party rights.
    const text = [
      `${plan.title} · ${weekLabel(weekStart)}`,
      ...result.groups.map((g) =>
        formatCopyList({
          retailerId: g.store,
          retailerName: storeById(g.store).name,
          lines: g.items.map((i) => ({ ingredientId: i.name, name: `${i.name} ${i.qty}`, qty: 1, unit: 'pcs' as const, estPriceDkk: i.price })),
        }),
      ),
    ].join('\n\n');
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
      <div className="row ae wrap" style={{ gap: 12 }}>
        <p className="num" style={{ fontSize: columns ? 80 : 44 }}>
          {done}
          <small className="dim">/{total}</small>
        </p>
        <p className="mono" style={{ paddingBottom: columns ? 12 : 6 }}>
          varer i kurven · uge {isoWeekNumber(weekStart)}
          {columns ? ` · ${plan.title}` : ''}
        </p>
        <button type="button" className="chip" style={{ marginLeft: 'auto' }} onClick={copy}>
          {copied ? 'Kopieret ✓' : 'Kopiér liste'}
        </button>
      </div>
      <p className="s" style={{ marginTop: -6 }}>
        {STRATEGY_LABEL[state.strategy]} · {result.groups.length} {result.groups.length === 1 ? 'butik' : 'butikker'} · i alt {kr(result.total)}
      </p>
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
                    <span className="s" style={{ whiteSpace: 'nowrap' }}>
                      {kr(item.price)}
                    </span>
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
      <PriceSource weekStart={weekStart} compact />
    </>
  );
}
