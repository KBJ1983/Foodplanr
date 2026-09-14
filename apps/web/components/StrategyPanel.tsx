'use client';

import Link from 'next/link';
import type { MealPlan } from '@/lib/mock-data';
import { storeById } from '@/lib/mock-data';
import { kr, n } from '@/lib/format';
import { useStore } from '@/lib/store';
import { STRATEGY_LABEL, allStrategies, type Strategy } from '@/lib/strategy';
import { isoWeekNumber } from '@/lib/week';
import { Placeholder } from './PlanCard';
import { PriceSource } from './PriceSource';

/**
 * Blue strategy panel: big total, breakdown per store, map placeholder, the two
 * alternatives as rows. Used full-screen on mobile and as the right panel on
 * desktop next to the week view.
 */
export function StrategyPanel({ plan, ctaHref = '/indkob', compact = false }: { plan: MealPlan; ctaHref?: string; compact?: boolean }) {
  const { state, update, weekStart } = useStore();
  const results = allStrategies(plan, state.stores);
  const active = results[state.strategy];
  const others = (Object.keys(results) as Strategy[]).filter((k) => k !== state.strategy);
  const cheapestTotal = results.cheapest.total;
  const single = results.fewestStops.total;
  const saving = single - active.total;

  const breakdown = active.groups.map((g) => `${storeById(g.store).name} ${kr(g.total)}`).join(' · ');
  const storesLabel = (s: Strategy) => results[s].groups.map((g) => storeById(g.store).name).join(', ');

  return (
    <>
      <p className="mono" style={{ opacity: 0.7 }}>
        {STRATEGY_LABEL[state.strategy]} · {active.groups.length} {active.groups.length === 1 ? 'butik' : 'butikker'} · uge {isoWeekNumber(weekStart)}
      </p>
      <p className="num" style={{ fontSize: compact ? 96 : 64 }}>
        {n(active.total)}
        <small> kr</small>
      </p>
      <p className="p" style={{ fontSize: 13, opacity: 0.85, marginTop: -6 }}>
        {saving > 0 ? `Du sparer ${kr(saving)} mod ét stop. ` : active.total > cheapestTotal ? `${kr(active.total - cheapestTotal)} mere end billigst. ` : ''}
        {breakdown}.
        {active.missing.length > 0 ? ` ${active.missing.length} varer findes ikke i de valgte butikker.` : ''}
      </p>
      <Placeholder tone="white" height={compact ? 120 : 90} label="kort: rute" style={{ ['--img-bg' as string]: 'rgb(255 255 255 / 0.5)' }} />
      {others.map((s) => (
        <button key={s} type="button" className="li strong" onClick={() => update({ strategy: s })} aria-label={`Skift til ${STRATEGY_LABEL[s]}`}>
          <span>
            <b>{STRATEGY_LABEL[s]}</b> · {storesLabel(s) || 'ingen butikker valgt'}
          </span>
          <b>{kr(results[s].total)}</b>
        </button>
      ))}
      {!compact && <p className="s">Tryk på en strategi for at skifte</p>}
      <div className="mt-auto col" style={{ gap: 10 }}>
        <Link href={ctaHref} className="btn">
          {compact ? 'Lav indkøbsliste →' : `Lav liste · ${kr(active.total)}`}
        </Link>
        <PriceSource weekStart={weekStart} compact />
      </div>
    </>
  );
}
