'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Attribution } from '@/components/Attribution';
import { Nav } from '@/components/Nav';
import { Placeholder } from '@/components/PlanCard';
import { Screen, ToneBox } from '@/components/Screen';
import { StrategyPanel } from '@/components/StrategyPanel';
import { n } from '@/lib/format';
import type { MealPlan } from '@/lib/mock-data';
import { persons, useStore } from '@/lib/store';
import { planPrice } from '@/lib/strategy';

/**
 * Week detail. Mobile: full-width photo block, white panel pulled 30px up with
 * 24px radius, title, three key numbers, day list, magenta CTA. Desktop: 7-day
 * grid left, blue strategy panel right.
 */
export function PlanDetail({ plan }: { plan: MealPlan }) {
  const { state, update } = useStore();
  const price = planPrice(plan, state.stores);
  const pers = persons(state);
  const weekNo = isoWeek(new Date());

  // Opening a plan makes it the household's current plan.
  useEffect(() => {
    if (state.selectedPlanId !== plan.id) update({ selectedPlanId: plan.id });
  }, [plan.id, state.selectedPlanId, update]);

  const dayList = (
    <>
      {plan.days.map((d, i) => (
        <Link key={d.day} href={`/planer/${plan.id}#${d.day}`} className={`li ${i === plan.days.length - 1 ? 'last' : ''}`} id={d.day} title="Tryk for at bytte ret (fase 1)">
          <span>
            <b>{d.day}</b> {d.dish}
          </span>
          <span className="s">{Math.round(price / plan.days.length)}</span>
        </Link>
      ))}
    </>
  );

  const stats = (size: number) => (
    <div className="row" style={{ gap: 24 }}>
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
      <div className="desk-only" style={{ flexDirection: 'column' }}>
        <p className="num" style={{ fontSize: size }}>
          {weekNo}
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
          <p className="h1" style={{ fontSize: 24, marginTop: 6 }}>
            {plan.title}
          </p>
          {stats(26)}
          {dayList}
          <Link href="/indkob/strategi" className="btn accent mt-auto">
            Handl ind →
          </Link>
          <Attribution sources={['frida']} />
        </div>
      </div>

      {/* Desktop */}
      <div className="split desk-only">
        <div className="main">
          <Nav />
          <p className="h1" style={{ fontSize: 36 }}>
            {plan.title}
          </p>
          {stats(40)}
          <div className="grid" style={{ gridTemplateColumns: `repeat(${plan.days.length}, 1fr)` }}>
            {plan.days.map((d, i) => (
              <Link key={d.day} href={`/planer/${plan.id}#${d.day}`} className="col" style={{ gap: 0 }} title="Tryk for at bytte ret (fase 1)">
                <Placeholder tone={i % 2 === 0 ? 'c' : 'b'} height={80} />
                <p className="mono" style={{ marginTop: 6 }}>
                  {d.day}
                </p>
                <p className="s">{d.dish}</p>
              </Link>
            ))}
          </div>
          <Attribution sources={['frida']} />
        </div>
        <ToneBox tone="b" className="panel">
          <StrategyPanel plan={plan} compact />
        </ToneBox>
      </div>
    </Screen>
  );
}

function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
