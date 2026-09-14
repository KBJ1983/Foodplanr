'use client';

import { useState } from 'react';
import { Nav } from '@/components/Nav';
import { PlanRow, PlanTile } from '@/components/PlanCard';
import { Screen } from '@/components/Screen';
import { kr } from '@/lib/format';
import { matchingCountDisplay, matchingPlans } from '@/lib/matching';
import { PLANS, storeById, type PlanTag } from '@/lib/mock-data';
import { persons, useStore } from '@/lib/store';
import { planPrice, preferred } from '@/lib/strategy';

type Filter = 'alle' | 'budget' | PlanTag;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'alle', label: 'Alle' },
  { key: 'budget', label: 'Under budget' },
  { key: 'børn', label: 'Børnevenlig' },
  { key: 'hurtig', label: 'Under 30 min' },
  { key: 'grøn', label: 'Grøn' },
  { key: 'rester', label: 'Rester' },
  { key: 'madpakke', label: 'Madpakker' },
];

/** Yellow archive: headline number, filter chips, list (mobile) / 4-column grid (desktop). */
export default function ArkivPage() {
  const { state } = useStore();
  const [filter, setFilter] = useState<Filter>('alle');
  const count = matchingCountDisplay(state);
  const matching = matchingPlans(state);
  const pool = matching.length > 0 ? matching : PLANS;

  const visible = pool.filter((p) => {
    if (filter === 'alle') return true;
    if (filter === 'budget') return planPrice(p, state.stores) <= state.weeklyBudget;
    return p.tags.includes(filter);
  });

  const storesLabel = (planId: string) => {
    const plan = PLANS.find((p) => p.id === planId)!;
    const groups = preferred(plan, state.stores).groups;
    return groups.length === 1 ? '1 butik' : groups.map((g) => storeById(g.store).name.replace(' 1000', '')).join(' + ');
  };

  return (
    <Screen tone="c">
      <div className="pad">
        <div className="row sb ac">
          <Nav />
          <span className="chip on desk-only">Sortér: Billigst</span>
        </div>
        <div className="row ae wrap" style={{ gap: 16 }}>
          <p className="num" style={{ fontSize: 'clamp(56px, 10vw, 110px)' }}>
            {count}
          </p>
          <p className="h1" style={{ fontSize: 'clamp(18px, 2.2vw, 26px)', paddingBottom: 8, maxWidth: 320, marginTop: -8 }}>
            madplaner passer til {persons(state)} personer under {kr(state.weeklyBudget)}
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
            <PlanRow key={p.id} plan={p} price={planPrice(p, state.stores)} storesLabel={storesLabel(p.id)} />
          ))}
        </div>
        <div className="grid desk-only" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 6, display: undefined }}>
          {visible.map((p) => (
            <PlanTile key={p.id} plan={p} price={planPrice(p, state.stores)} />
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
