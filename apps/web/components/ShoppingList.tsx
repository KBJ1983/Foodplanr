'use client';

import { useState } from 'react';
import { formatCopyList } from '@madplan/checkout';
import { STRATEGY_LABEL, type LineCost } from '@/lib/engine';
import { kr } from '@/lib/format';
import type { MealPlan } from '@/lib/mock-data';
import { storeById } from '@/lib/mock-data';
import { useStore } from '@/lib/store';
import { usePricing } from '@/lib/use-pricing';
import { isoWeekNumber, weekLabel, weekRangeLabel } from '@/lib/week';
import { PriceSource } from './PriceSource';

function periodLabel(runFrom: string, runTill: string): string {
  const from = new Date(runFrom);
  const till = new Date(new Date(runTill).getTime() - 1); // exclusive end → last valid day
  const m = ['jan.', 'feb.', 'mar.', 'apr.', 'maj', 'juni', 'juli', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.'];
  const a = `${from.getDate()}.`;
  const b = `${till.getDate()}. ${m[till.getMonth()]}`;
  return from.getMonth() === till.getMonth() ? `${a}–${b}` : `${a} ${m[from.getMonth()]}–${b}`;
}

/** One line: name + qty, price, and beneath it *why*: offer (with period) or estimated normal price. */
function Line({ line, planId }: { line: LineCost; planId: string }) {
  const { state, toggleChecked } = useStore();
  const key = `${planId}|${line.ingredientId}`;
  const on = state.checked.includes(key);
  return (
    <button type="button" className="li line" role="checkbox" aria-checked={on} onClick={() => toggleChecked(planId, line.ingredientId)}>
      <span className="row ac" style={{ alignItems: 'flex-start' }}>
        <i className={`cb ${on ? 'x' : ''}`} aria-hidden="true" style={{ marginTop: 1 }} />
        <span className="col" style={{ gap: 2, textDecoration: on ? 'line-through' : 'none', opacity: on ? 0.6 : 1 }}>
          <span>
            {line.name} {line.qtyLabel}
          </span>
          {line.kind === 'offer' && line.offer ? (
            <span className="s offer-note">
              <b className="tag">Tilbud</b> {line.offer.heading} · {line.offer.packs} × {kr(line.offer.packPrice)} · gyldig {periodLabel(line.offer.runFrom, line.offer.runTill)}
              {line.offer.priceBefore ? ` · før ${kr(line.offer.priceBefore)}` : ''}
            </span>
          ) : (
            <span className="s offer-note">Normalpris, estimat</span>
          )}
        </span>
      </span>
      <span className="col" style={{ alignItems: 'flex-end', gap: 2, whiteSpace: 'nowrap' }}>
        <span style={{ fontWeight: line.kind === 'offer' ? 700 : 400 }}>{kr(line.price)}</span>
        {line.kind === 'offer' && line.baselinePrice > line.price && (
          <span className="s" style={{ fontSize: 10 }}>
            spar {kr(line.baselinePrice - line.price)}
          </span>
        )}
      </span>
    </button>
  );
}

/**
 * Store header blocks (Rema = magenta, Lidl = blue, Netto = yellow), item rows
 * with a checkbox, price and price origin. Groups in the strategy's store
 * order. On desktop the groups become columns.
 */
export function ShoppingList({ plan, columns = false }: { plan: MealPlan; columns?: boolean }) {
  const { state, weekStart } = useStore();
  const { active: result } = usePricing(plan);
  const total = result.lineCount;
  const done = result.groups.reduce((a, g) => a + g.lines.filter((l) => state.checked.includes(`${plan.id}|${l.ingredientId}`)).length, 0);
  const [copied, setCopied] = useState(false);

  async function copy() {
    // copy_list handoff — works for every retailer without any third-party rights.
    const text = [
      `${plan.title} · ${weekLabel(weekStart)} · ${STRATEGY_LABEL[state.strategy]}`,
      ...result.groups.map((g) =>
        formatCopyList({
          retailerId: g.store,
          retailerName: storeById(g.store).name,
          lines: g.lines.map((l) => ({
            ingredientId: l.ingredientId,
            name: `${l.name} ${l.qtyLabel}${l.kind === 'offer' && l.offer ? ` (tilbud ${periodLabel(l.offer.runFrom, l.offer.runTill)})` : ''}`,
            qty: 1,
            unit: 'pcs' as const,
            estPriceDkk: l.price,
          })),
        }),
      ),
      `Tilbud: ${result.offerLines} af ${total} varer. Sparet mod normalpris: ${kr(result.saved)}. Normalpriser er estimater.`,
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

      <div className="blk validity">
        <span>
          <b>Tilbud gyldige {weekRangeLabel(weekStart)}</b> · {result.offerLines} af {total} varer på tilbud
        </span>
        <span>
          <b>{kr(result.total)}</b> · spar {kr(result.saved)}
        </span>
      </div>
      <p className="s" style={{ marginTop: -4 }}>
        {STRATEGY_LABEL[state.strategy]} · {result.groups.length} {result.groups.length === 1 ? 'butik' : 'butikker'}. Fed pris = tilbud. Øvrige linjer er
        estimeret normalpris.
      </p>

      <div className={columns ? 'grid' : 'col'} style={columns ? { gridTemplateColumns: `repeat(${Math.max(1, result.groups.length)}, 1fr)`, alignItems: 'start' } : { gap: 6 }}>
        {result.groups.map((g) => {
          const store = storeById(g.store);
          return (
            <div key={g.store} className="col" style={{ gap: 0 }}>
              <div className={`blk ${store.tone}`}>
                <b>{store.name}</b>
                <span>
                  {g.offerLines} {g.offerLines === 1 ? 'tilbud' : 'tilbud'} · {kr(g.total)}
                </span>
              </div>
              {g.lines.map((l) => (
                <Line key={l.ingredientId} line={l} planId={plan.id} />
              ))}
            </div>
          );
        })}
      </div>
      <PriceSource weekStart={weekStart} compact />
    </>
  );
}
