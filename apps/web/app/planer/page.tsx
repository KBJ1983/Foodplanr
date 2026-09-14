'use client';

import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Placeholder } from '@/components/PlanCard';
import { PriceSource } from '@/components/PriceSource';
import { Screen } from '@/components/Screen';
import { kr, n } from '@/lib/format';
import { planById } from '@/lib/mock-data';
import { FREE_TIER, useStore } from '@/lib/store';
import { planPrice } from '@/lib/strategy';
import { relativeWeekLabel, weekLabel } from '@/lib/week';

/**
 * "Planer": the household's plan for the week being planned, plus saved plans.
 * White screen; the plan detail keeps its own colours.
 */
export default function PlanerPage() {
  const { state, ready, weekStart, isSaved } = useStore();
  const current = state.selectedPlanId ? planById(state.selectedPlanId) : undefined;
  const saved = [...state.saved].sort((a, b) => a.weekStart.localeCompare(b.weekStart));

  return (
    <Screen tone="white">
      <div className="pad">
        <Nav />
        <p className="mono">{weekLabel(weekStart)}</p>
        <p className="h1">Jeres madplan</p>

        {!ready ? null : current ? (
          <Link href={`/planer/${current.id}`} className="li strong" style={{ padding: '14px 0' }}>
            <div>
              <p className="h2">{current.title}</p>
              <p className="s">
                {kr(planPrice(current, state.stores))} · {n(current.kcalPerDay)} kcal · {relativeWeekLabel(weekStart).toLowerCase()}
                {isSaved(current.id, weekStart) ? ' · gemt' : ''}
              </p>
            </div>
            <Placeholder tone={current.tone} height={54} style={{ width: 54, flex: 'none' }} />
          </Link>
        ) : (
          <div className="col" style={{ gap: 10 }}>
            <p className="p">I har ikke valgt en madplan til {weekLabel(weekStart).toLowerCase()} endnu.</p>
            <Link href="/arkiv" className="btn accent" style={{ alignSelf: 'flex-start' }}>
              Vælg i arkivet →
            </Link>
          </div>
        )}

        <p className="mono" style={{ marginTop: 16 }}>
          Gemte planer · {saved.length}/{FREE_TIER.maxSavedPlans} (gratis)
        </p>
        {saved.length === 0 ? (
          <p className="p">Ingen gemte planer. Tryk "Gem" på en madplan for at holde den til en uge.</p>
        ) : (
          <div className="col" style={{ gap: 0 }}>
            {saved.map((s) => {
              const plan = planById(s.planId);
              if (!plan) return null;
              return (
                <Link key={`${s.planId}|${s.weekStart}`} href={`/planer/${plan.id}?uge=${s.weekStart}`} className="li">
                  <span>
                    <b>{relativeWeekLabel(s.weekStart)}</b> · {plan.title}
                  </span>
                  <span className="s">{kr(planPrice(plan, state.stores))}</span>
                </Link>
              );
            })}
          </div>
        )}
        {saved.length >= FREE_TIER.maxSavedPlans && (
          <p className="s">Gratis giver {FREE_TIER.maxSavedPlans} gemte planer og én uge frem. Pro giver flere uger og flere gemte planer.</p>
        )}

        <div className="mt-auto col" style={{ gap: 8 }}>
          <Link href="/arkiv" className="btn2" style={{ alignSelf: 'flex-start' }}>
            Alle madplaner i arkivet →
          </Link>
          <PriceSource weekStart={weekStart} compact />
        </div>
      </div>
    </Screen>
  );
}
