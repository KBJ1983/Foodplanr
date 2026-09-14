'use client';

import Link from 'next/link';
import { STRATEGY_LABEL, type Strategy } from '@/lib/engine';
import { kr, n } from '@/lib/format';
import type { MealPlan } from '@/lib/mock-data';
import { storeById } from '@/lib/mock-data';
import { useStore } from '@/lib/store';
import { usePricing } from '@/lib/use-pricing';
import { isoWeekNumber, weekRangeLabel } from '@/lib/week';
import { Placeholder } from './PlanCard';
import { PriceSource } from './PriceSource';

/**
 * Blue strategy panel: big total, offers used and savings, breakdown per
 * store, map placeholder, the two alternatives as rows.
 */
export function StrategyPanel({ plan, ctaHref = '/indkob', compact = false }: { plan: MealPlan; ctaHref?: string; compact?: boolean }) {
  const { state, update, weekStart } = useStore();
  const { results, active } = usePricing(plan);
  const others = (Object.keys(results) as Strategy[]).filter((k) => k !== state.strategy);
  const cheapestTotal = results.cheapest.total;
  const single = results.fewestStops.total;
  const vsSingle = single - active.total;

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
        <b>
          {active.offerLines} af {active.lineCount} varer på tilbud
        </b>{' '}
        ({weekRangeLabel(weekStart)}). Du sparer {kr(active.saved)} mod normalpris
        {vsSingle > 0.5 ? ` og ${kr(vsSingle)} mod ét stop` : active.total - cheapestTotal > 0.5 ? `; ${kr(active.total - cheapestTotal)} mere end billigst` : ''}. {breakdown}.
      </p>
      <Placeholder tone="white" height={compact ? 120 : 90} label="kort: rute" style={{ ['--img-bg' as string]: 'rgb(255 255 255 / 0.5)' }} />
      {others.map((s) => (
        <button key={s} type="button" className="li strong" onClick={() => update({ strategy: s })} aria-label={`Skift til ${STRATEGY_LABEL[s]}`}>
          <span>
            <b>{STRATEGY_LABEL[s]}</b> · {storesLabel(s) || 'ingen butikker valgt'}
            <span className="s"> · {results[s].offerLines} tilbud</span>
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
