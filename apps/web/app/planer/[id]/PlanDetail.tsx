'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Attribution } from '@/components/Attribution';
import { Nav } from '@/components/Nav';
import { Placeholder } from '@/components/PlanCard';
import { PriceSource } from '@/components/PriceSource';
import { Screen, ToneBox } from '@/components/Screen';
import { StrategyPanel } from '@/components/StrategyPanel';
import { WeekPicker } from '@/components/WeekPicker';
import { kr, n } from '@/lib/format';
import type { MealPlan } from '@/lib/mock-data';
import { FREE_TIER, persons, useStore } from '@/lib/store';
import { planPrice } from '@/lib/strategy';
import { isoWeekNumber, weekLabel } from '@/lib/week';

/**
 * Week detail. Mobile: full-width photo block, white panel pulled 30px up with
 * 24px radius, week label, title, three key numbers, day list, magenta CTA.
 * Desktop: 7-day grid left, blue strategy panel right.
 */
export function PlanDetail({ plan }: { plan: MealPlan }) {
  const { state, update, weekStart, toggleSaved, isSaved } = useStore();
  const search = useSearchParams();
  const price = planPrice(plan, state.stores);
  const pers = persons(state);
  const saved = isSaved(plan.id, weekStart);
  const [limitHit, setLimitHit] = useState(false);

  // Opening a plan makes it the household's current plan; `?uge=` selects the week (from saved plans).
  useEffect(() => {
    const patch: Partial<typeof state> = {};
    if (state.selectedPlanId !== plan.id) patch.selectedPlanId = plan.id;
    const uge = search.get('uge');
    if (uge && /^\d{4}-\d{2}-\d{2}$/.test(uge) && uge !== state.weekStart) patch.weekStart = uge;
    if (Object.keys(patch).length) update(patch);
  }, [plan.id, search, state.selectedPlanId, state.weekStart, update, state]);

  function onSave() {
    const ok = toggleSaved(plan.id, weekStart);
    setLimitHit(!ok);
  }

  // Day price: share of the week's total weighted by the dish's kcal.
  const kcalSum = plan.days.reduce((a, d) => a + d.kcal, 0);
  const dayPrice = (kcal: number) => Math.round((price * kcal) / kcalSum);

  const saveButton = (
    <div className="col" style={{ gap: 4 }}>
      <button type="button" className={`chip ${saved ? 'on' : ''}`} onClick={onSave} aria-pressed={saved}>
        {saved ? `Gemt til uge ${isoWeekNumber(weekStart)} ✓` : `Gem til uge ${isoWeekNumber(weekStart)}`}
      </button>
      {limitHit && !saved && (
        <span className="s" style={{ fontSize: 11 }}>
          Gratis giver {FREE_TIER.maxSavedPlans} gemte planer. Fjern en under Planer, eller opgrader til Pro.
        </span>
      )}
    </div>
  );

  const dayList = (
    <>
      {plan.days.map((d, i) => (
        <Link key={d.day} href={`/planer/${plan.id}#${d.day}`} className={`li ${i === plan.days.length - 1 ? 'last' : ''}`} id={d.day} title="Tryk for at bytte ret (fase 1)">
          <span>
            <b>{d.day}</b> {d.dish}
          </span>
          <span className="s">{kr(dayPrice(d.kcal))}</span>
        </Link>
      ))}
    </>
  );

  const stats = (size: number) => (
    <div className="row wrap" style={{ gap: 24 }}>
      <div>
        <p className="num" style={{ fontSize: size }}>
          {n(price)}
        </p>
        <p className="mono">kr / uge</p>
      </div>
      <div>
        <p className="num" style={{ fontSize: size }}>
          {n(plan.kcalPerDay)}
        </p>
        <p className="mono">kcal / dag</p>
      </div>
      <div>
        <p className="num" style={{ fontSize: size }}>
          {pers}
        </p>
        <p className="mono">pers</p>
      </div>
      <div>
        <p className="num" style={{ fontSize: size }}>
          {isoWeekNumber(weekStart)}
        </p>
        <p className="mono">uge</p>
      </div>
    </div>
  );

  return (
    <Screen tone="white">
      {/* Mobile */}
      <div className="mob-only col" style={{ gap: 0, flex: 1 }}>
        <Placeholder tone={plan.tone} height={190} label="foto: ugens ret, fuld bredde" style={{ borderRadius: 0, alignItems: 'flex-start', paddingTop: 40 }} />
        <div className="pad" style={{ gap: 6, marginTop: -30, background: '#fff', borderRadius: '24px 24px 0 0', position: 'relative' }}>
          <Nav />
          <p className="mono" style={{ marginTop: 6 }}>
            {weekLabel(weekStart)}
          </p>
          <p className="h1" style={{ fontSize: 24 }}>
            {plan.title}
          </p>
          {stats(26)}
          <div className="row wrap ac" style={{ gap: 8, marginTop: 4 }}>
            <WeekPicker />
          </div>
          {saveButton}
          {dayList}
          <Link href="/indkob/strategi" className="btn accent mt-auto">
            Handl ind →
          </Link>
          <PriceSource weekStart={weekStart} compact />
          <Attribution sources={['frida']} />
        </div>
      </div>

      {/* Desktop */}
      <div className="split desk-only">
        <div className="main">
          <Nav />
          <p className="mono">{weekLabel(weekStart)}</p>
          <p className="h1" style={{ fontSize: 36 }}>
            {plan.title}
          </p>
          {stats(40)}
          <div className="row wrap ae" style={{ gap: 20 }}>
            <WeekPicker />
            {saveButton}
          </div>
          <div className="grid" style={{ gridTemplateColumns: `repeat(${plan.days.length}, 1fr)` }}>
            {plan.days.map((d, i) => (
              <Link key={d.day} href={`/planer/${plan.id}#${d.day}`} className="col" style={{ gap: 0 }} title="Tryk for at bytte ret (fase 1)">
                <Placeholder tone={i % 2 === 0 ? 'c' : 'b'} height={80} />
                <p className="mono" style={{ marginTop: 6 }}>
                  {d.day} · {kr(dayPrice(d.kcal))}
                </p>
                <p className="s">{d.dish}</p>
              </Link>
            ))}
          </div>
          <div className="mt-auto col" style={{ gap: 4 }}>
            <PriceSource weekStart={weekStart} />
            <Attribution sources={['frida']} />
          </div>
        </div>
        <ToneBox tone="b" className="panel">
          <StrategyPanel plan={plan} compact />
        </ToneBox>
      </div>
    </Screen>
  );
}
