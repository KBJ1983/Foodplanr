'use client';

import { useState } from 'react';
import { Nav } from '@/components/Nav';
import { PlanRow, PlanTile } from '@/components/PlanCard';
import { Screen } from '@/components/Screen';
import { planPrice, priceStrategies, type PricingInput } from '@/lib/engine';
import { kr } from '@/lib/format';
import { matchingCountDisplay, matchingPlans } from '@/lib/matching';
import { PLANS, storeById, type MealPlan, type PlanTag } from '@/lib/mock-data';
import { persons, useStore } from '@/lib/store';
import { useOffers } from '@/lib/use-pricing';
import { weekLabel } from '@/lib/week';

type Filter = 'alle' | 'budget' | PlanTag;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'alle', label: 'Alle' },
  { key: 'budget', label: 'Under budget' },
  { key: 'børn', label: 'Børnevenlig' },
  { key: 'hurtig', label: 'Under 30 min' },
  { key: 'grøn', label: 'Grøn' },
  { key: 'fisk', label: 'Fisk' },
  { key: 'rester', label: 'Rester' },
  { key: 'madpakke', label: 'Madpakker' },
];

/** Yellow archive: headline number, filter chips, list (mobile) / 4-column grid (desktop). */
export default function ArkivPage() {
  const { state, weekStart } = useStore();
  const offers = useOffers();
  const [filter, setFilter] = useState<Filter>('alle');
  const pers = persons(state);
  const criteria = { ...state, persons: pers, weekStart, offers };
  const count = matchingCountDisplay(criteria);
  const matching = matchingPlans(criteria);
  const pool = matching.length > 0 ? matching : PLANS;

  const inputFor = (plan: MealPlan): PricingInput => ({ plan, persons: pers, weekStart, offers, fixedStores: state.stores });
  const priceOf = (plan: MealPlan) => planPrice(inputFor(plan));

  const visible = pool.filter((p) => {
    if (filter === 'alle') return true;
    if (filter === 'budget') return priceOf(p) <= state.weeklyBudget;
    return p.tags.includes(filter);
  });

  const storesLabel = (plan: MealPlan) => {
    const r = priceStrategies(inputFor(plan)).preferred;
    const names = r.groups.map((g) => storeById(g.store).name.replace(' 1000', ''));
    return `${names.length === 1 ? '1 butik' : names.join(' + ')} · ${r.offerLines} tilbud`;
  };

  return (
    <Screen tone="c">
      <div className="pad">
        <div className="row sb ac">
          <Nav />
          <span className="chip on desk-only">Sortér: Billigst</span>
        </div>
        <p className="mono">Madplaner til {weekLabel(weekStart).toLowerCase()} · priser med ugens tilbud i jeres butikker</p>
        <div className="row ae wrap" style={{ gap: 16 }}>
          <p className="num" style={{ fontSize: 'clamp(56px, 10vw, 110px)' }}>
            {count}
          </p>
          <p className="h1" style={{ fontSize: 'clamp(18px, 2.2vw, 26px)', paddingBottom: 8, maxWidth: 320, marginTop: -8 }}>
            madplaner passer til {pers} personer under {kr(state.weeklyBudget)}
          </p>
        </div>
        <div className="row wrap" role="tablist" aria-label="Filtre">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" role="tab" className="chip" aria-pressed={filter === f.key} aria-selected={filter === f.key} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="col mob-only" style={{ gap: 0 }}>
          {visible.map((p) => (
            <PlanRow key={p.id} plan={p} price={priceOf(p)} storesLabel={storesLabel(p)} />
          ))}
        </div>
        <div className="grid desk-only" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 6, display: undefined }}>
          {visible.map((p) => (
            <PlanTile key={p.id} plan={p} price={priceOf(p)} />
          ))}
        </div>
        {visible.length === 0 && <p className="p">Ingen planer matcher det filter. Prøv et andet.</p>}
        <p className="s" style={{ marginTop: 'auto' }}>
          Eksempeldata: {PLANS.length} egne planer i puljen. Tallet {count} er skaleret til den planlagte katalogstørrelse.
        </p>
      </div>
      <style>{`@media(min-width:1024px){.grid.desk-only{display:grid}}`}</style>
    </Screen>
  );
}
