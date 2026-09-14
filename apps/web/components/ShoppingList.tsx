'use client';

import { useState } from 'react';
import { formatCopyList } from '@madplan/checkout';
import { STRATEGY_LABEL, storeOptions, type LineCost } from '@/lib/engine';
import { kr } from '@/lib/format';
import type { MealPlan } from '@/lib/mock-data';
import { storeById } from '@/lib/mock-data';
import { useStore } from '@/lib/store';
import { useOffers, usePricing } from '@/lib/use-pricing';
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

/** Store picker for one line: price in each of the household's chosen stores (offers marked ★), plus the UDSOLGT list. */
function MovePicker({ line, planId, onDone, excludeCurrent = false }: { line: LineCost; planId: string; onDone: () => void; excludeCurrent?: boolean }) {
  const { state, weekStart, setLineOverride } = useStore();
  const offers = useOffers();
  const chosen = new Set(state.stores);
  const options = storeOptions(line, offers, weekStart)
    .filter((o) => chosen.has(o.store) && (!excludeCurrent || o.store !== line.store))
    .sort((a, b) => a.price - b.price);
  return (
    <div className="move" role="group" aria-label={`Flyt ${line.name}`}>
      <span className="mono">Flyt til · dine butikker</span>
      {options.length === 0 ? (
        <span className="s">
          {state.stores.length === 0 ? 'Vælg jeres butikker under Profil for at kunne flytte varer.' : 'Ingen andre af jeres butikker at flytte til. Tilføj flere under Profil.'}
        </span>
      ) : (
        <div className="row wrap" style={{ gap: 6 }}>
          {options.map((o) => (
            <button
              key={o.store}
              type="button"
              className="chip"
              aria-pressed={o.store === line.store}
              onClick={() => {
                setLineOverride(planId, weekStart, line.ingredientId, { store: o.store });
                onDone();
              }}
              title={o.kind === 'offer' && o.offer ? `${o.offer.heading} · gyldig ${periodLabel(o.offer.runFrom, o.offer.runTill)}` : 'Normalpris, estimat'}
            >
              {storeById(o.store).name} · {kr(o.price)}
              {o.kind === 'offer' ? ' ★' : ''}
            </button>
          ))}
        </div>
      )}
      <div className="row wrap" style={{ gap: 6 }}>
        <button
          type="button"
          className="chip grey"
          onClick={() => {
            setLineOverride(planId, weekStart, line.ingredientId, { soldOut: true });
            onDone();
          }}
        >
          → UDSOLGT-liste
        </button>
        {line.movedFrom && (
          <button
            type="button"
            className="chip outline"
            onClick={() => {
              setLineOverride(planId, weekStart, line.ingredientId, null);
              onDone();
            }}
          >
            Tilbage til {storeById(line.movedFrom).name}
          </button>
        )}
        <button type="button" className="chip" onClick={onDone}>
          Luk
        </button>
      </div>
      <span className="s" style={{ fontSize: 10 }}>
        ★ = tilbud i den butik denne uge. Kun jeres valgte butikker vises.
      </span>
    </div>
  );
}

/** One line: name + qty, price, and beneath it *why*: offer (with period) or estimated normal price. */
function Line({ line, planId, open, onToggleMenu }: { line: LineCost; planId: string; open: boolean; onToggleMenu: () => void }) {
  const { state, toggleChecked } = useStore();
  const key = `${planId}|${line.ingredientId}`;
  const on = state.checked.includes(key);
  return (
    <div className="col" style={{ gap: 0 }}>
      <div className="li line" style={{ borderBottom: open ? 0 : undefined }}>
        <button type="button" className="row ac grow" role="checkbox" aria-checked={on} onClick={() => toggleChecked(planId, line.ingredientId)} style={{ alignItems: 'flex-start', textAlign: 'left' }}>
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
            {line.movedFrom && (
              <span className="s offer-note">
                <b className="tag tag-muted">Flyttet</b> fra {storeById(line.movedFrom).name}
              </span>
            )}
          </span>
        </button>
        <span className="col" style={{ alignItems: 'flex-end', gap: 2, whiteSpace: 'nowrap' }}>
          <span style={{ fontWeight: line.kind === 'offer' ? 700 : 400 }}>{kr(line.price)}</span>
          {line.kind === 'offer' && line.baselinePrice > line.price && (
            <span className="s" style={{ fontSize: 10 }}>
              spar {kr(line.baselinePrice - line.price)}
            </span>
          )}
          <button type="button" className="s more" aria-expanded={open} aria-label={`Flyt eller markér ${line.name} udsolgt`} onClick={onToggleMenu}>
            {open ? 'luk' : 'flyt · udsolgt'}
          </button>
        </span>
      </div>
      {open && <MovePicker line={line} planId={planId} onDone={onToggleMenu} />}
    </div>
  );
}

/**
 * Store header blocks (Rema = magenta, Lidl = blue, Netto = yellow), item rows
 * with a checkbox, price and price origin, per-line "flyt · udsolgt", and a
 * sold-out section at the bottom. Groups in the strategy's store order. On
 * desktop the groups become columns.
 */
export function ShoppingList({ plan, columns = false }: { plan: MealPlan; columns?: boolean }) {
  const { state, weekStart, setLineOverride, clearLineOverrides } = useStore();
  const { active: result, lineOverrides } = usePricing(plan);
  const total = result.lineCount;
  const done = result.groups.reduce((a, g) => a + g.lines.filter((l) => state.checked.includes(`${plan.id}|${l.ingredientId}`)).length, 0);
  const [copied, setCopied] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [soldOutPick, setSoldOutPick] = useState<string | null>(null);
  const overrideCount = Object.keys(lineOverrides).length;

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
      ...(result.soldOut.length ? [`Udsolgt (find et andet sted):\n${result.soldOut.map((l) => `- ${l.name}, ${l.qtyLabel}`).join('\n')}`] : []),
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
        estimeret normalpris. Tryk "flyt · udsolgt" på en vare for at flytte den til en af jeres butikker eller til UDSOLGT-listen.
        {overrideCount > 0 && (
          <>
            {' '}
            <button type="button" className="s" style={{ textDecoration: 'underline', opacity: 1 }} onClick={() => clearLineOverrides(plan.id, weekStart)}>
              Nulstil {overrideCount} {overrideCount === 1 ? 'ændring' : 'ændringer'}
            </button>
          </>
        )}
      </p>

      <div className={columns ? 'grid' : 'col'} style={columns ? { gridTemplateColumns: `repeat(${Math.max(1, result.groups.length)}, 1fr)`, alignItems: 'start' } : { gap: 6 }}>
        {result.groups.map((g) => {
          const store = storeById(g.store);
          return (
            <div key={g.store} className="col" style={{ gap: 0 }}>
              <div className={`blk ${store.tone}`}>
                <b>{store.name}</b>
                <span>
                  {g.offerLines} tilbud · {kr(g.total)}
                </span>
              </div>
              {g.lines.map((l) => (
                <Line key={l.ingredientId} line={l} planId={plan.id} open={menuFor === l.ingredientId} onToggleMenu={() => setMenuFor((cur) => (cur === l.ingredientId ? null : l.ingredientId))} />
              ))}
            </div>
          );
        })}
      </div>

      {/* General UDSOLGT list — always present; lines are moved here from the store groups. */}
      <div className="col" style={{ gap: 0, marginTop: 8 }} id="udsolgt">
        <div className="blk grey">
          <b>UDSOLGT-liste</b>
          <span>
            {result.soldOut.length === 0 ? 'tom' : `${result.soldOut.length} ${result.soldOut.length === 1 ? 'vare' : 'varer'} · find et andet sted`}
          </span>
        </div>
        {result.soldOut.length === 0 && (
          <p className="s" style={{ padding: '8px 0 0' }}>
            Varer, butikken ikke havde. Brug "flyt · udsolgt" på en vare og vælg "→ UDSOLGT-liste". Herfra kan de flyttes til en af jeres andre butikker.
          </p>
        )}
        {result.soldOut.map((l) => (
          <div key={l.ingredientId} className="col" style={{ gap: 0 }}>
            <div className="li line">
              <span className="col" style={{ gap: 2 }}>
                <span>
                  {l.name} {l.qtyLabel}
                </span>
                <span className="s offer-note">Udsolgt i {storeById(l.store).name} · var {kr(l.price)}</span>
              </span>
              <span className="row" style={{ gap: 6 }}>
                <button type="button" className="chip" aria-expanded={soldOutPick === l.ingredientId} onClick={() => setSoldOutPick((cur) => (cur === l.ingredientId ? null : l.ingredientId))}>
                  Flyt til …
                </button>
                <button type="button" className="chip outline" onClick={() => setLineOverride(plan.id, weekStart, l.ingredientId, null)}>
                  Tilbage
                </button>
              </span>
            </div>
            {soldOutPick === l.ingredientId && <MovePicker line={l} planId={plan.id} excludeCurrent onDone={() => setSoldOutPick(null)} />}
          </div>
        ))}
      </div>
      <PriceSource weekStart={weekStart} compact />
    </>
  );
}
