'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Attribution } from '@/components/Attribution';
import { Nav } from '@/components/Nav';
import { Placeholder } from '@/components/PlanCard';
import { PriceSource } from '@/components/PriceSource';
import { RecipeCard } from '@/components/RecipeCard';
import { Screen, ToneBox } from '@/components/Screen';
import { StrategyPanel } from '@/components/StrategyPanel';
import { SwapPicker } from '@/components/SwapPicker';
import { WeekPicker } from '@/components/WeekPicker';
import { dinnerCost, planDinnerKcal, recipesForPlan } from '@/lib/engine';
import { kr, n } from '@/lib/format';
import { DAY_NAMES, type MealPlan } from '@/lib/mock-data';
import { FREE_TIER, useStore } from '@/lib/store';
import { usePricing } from '@/lib/use-pricing';
import { isoWeekNumber, weekLabel } from '@/lib/week';

/**
 * Week detail. Each day unfolds into its recipe (scaled to the household) and
 * can be swapped for another dish; prices follow. Mobile: photo block, white
 * panel pulled up, day list. Desktop: 7-day grid left, blue strategy panel right.
 */
export function PlanDetail({ plan }: { plan: MealPlan }) {
  const { state, update, weekStart, toggleSaved, isSaved, setSwap, clearSwaps } = useStore();
  const { input, results, swaps } = usePricing(plan);
  const search = useSearchParams();
  const price = results.preferred.total;
  const saved = isSaved(plan.id, weekStart);
  const [limitHit, setLimitHit] = useState(false);
  // `?dag=0..6` opens a day directly (deep link from Planer / shared list).
  const initialDay = Number(search.get('dag'));
  const [open, setOpen] = useState<number | null>(Number.isInteger(initialDay) && search.get('dag') !== null && initialDay >= 0 && initialDay < plan.recipeIds.length ? initialDay : null);
  const [picking, setPicking] = useState<number | null>(null);

  const recipes = recipesForPlan(plan, swaps);
  const swappedCount = Object.keys(swaps).length;

  // Opening a plan makes it the household's current plan; `?uge=` selects the week (from saved plans).
  useEffect(() => {
    const patch: Partial<typeof state> = {};
    if (state.selectedPlanId !== plan.id) patch.selectedPlanId = plan.id;
    const uge = search.get('uge');
    if (uge && /^\d{4}-\d{2}-\d{2}$/.test(uge) && uge !== state.weekStart) patch.weekStart = uge;
    if (Object.keys(patch).length) update(patch);
  }, [plan.id, search, state.selectedPlanId, state.weekStart, update, state]);

  function onSave() {
    setLimitHit(!toggleSaved(plan.id, weekStart));
  }

  function toggleDay(i: number) {
    setPicking(null);
    setOpen((cur) => (cur === i ? null : i));
  }

  const saveRow = (
    <div className="row wrap ac" style={{ gap: 8 }}>
      <button type="button" className={`chip ${saved ? 'on' : ''}`} onClick={onSave} aria-pressed={saved}>
        {saved ? `Gemt til uge ${isoWeekNumber(weekStart)} ✓` : `Gem til uge ${isoWeekNumber(weekStart)}`}
      </button>
      {swappedCount > 0 && (
        <button type="button" className="chip" onClick={() => clearSwaps(plan.id, weekStart)}>
          {swappedCount} {swappedCount === 1 ? 'ret byttet' : 'retter byttet'} · nulstil
        </button>
      )}
      {limitHit && !saved && (
        <span className="s" style={{ fontSize: 11 }}>
          Gratis giver {FREE_TIER.maxSavedPlans} gemte planer. Fjern en under Planer, eller opgrader til Pro.
        </span>
      )}
    </div>
  );

  const expanded = (i: number) =>
    picking === i ? (
      <SwapPicker
        input={input}
        dayIndex={i}
        currentRecipeId={recipes[i]!.id}
        onPick={(id) => {
          setSwap(plan.id, weekStart, i, id);
          setPicking(null);
        }}
        onClose={() => setPicking(null)}
      />
    ) : (
      <RecipeCard
        recipe={recipes[i]!}
        persons={input.persons}
        cost={dinnerCost(input, recipes[i]!.id)}
        swapped={swaps[i] !== undefined}
        onSwap={() => setPicking(i)}
        onReset={() => setSwap(plan.id, weekStart, i, null)}
      />
    );

  const dayList = (
    <div className="col" style={{ gap: 0 }}>
      {recipes.map((r, i) => (
        <div key={`${i}-${r.id}`}>
          <button type="button" className={`li ${i === recipes.length - 1 && open !== i ? 'last' : ''}`} onClick={() => toggleDay(i)} aria-expanded={open === i}>
            <span>
              <b>{DAY_NAMES[i]}</b> {r.title}
              {swaps[i] !== undefined && <span className="mono"> · byttet</span>}
            </span>
            <span className="s" style={{ whiteSpace: 'nowrap' }}>
              {kr(dinnerCost(input, r.id))} {open === i ? '▴' : '▾'}
            </span>
          </button>
          {open === i && expanded(i)}
        </div>
      ))}
    </div>
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
          {n(planDinnerKcal(plan, swaps))}
        </p>
        <p className="mono">kcal / aftensmad</p>
      </div>
      <div>
        <p className="num" style={{ fontSize: size }}>
          {input.persons}
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
          <WeekPicker />
          {saveRow}
          <p className="s" style={{ marginTop: 4 }}>
            Tryk på en dag for opskrift og for at bytte ret.
          </p>
          {dayList}
          <Link href="/indkob/strategi" className="btn accent mt-auto">
            Handl ind · {kr(results[state.strategy].total)} →
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
            {saveRow}
          </div>
          <div className="grid" style={{ gridTemplateColumns: `repeat(${recipes.length}, 1fr)` }}>
            {recipes.map((r, i) => (
              <button key={`${i}-${r.id}`} type="button" className="col day" style={{ gap: 0, textAlign: 'left' }} onClick={() => toggleDay(i)} aria-expanded={open === i}>
                <Placeholder tone={i % 2 === 0 ? 'c' : 'b'} height={80} style={open === i ? { outline: '3px solid var(--ink)' } : undefined} />
                <p className="mono" style={{ marginTop: 6 }}>
                  {DAY_NAMES[i]} · {kr(dinnerCost(input, r.id))}
                  {swaps[i] !== undefined ? ' · byttet' : ''}
                </p>
                <p className="s">{r.title}</p>
              </button>
            ))}
          </div>
          {open === null ? <p className="s">Tryk på en dag for opskrift og for at bytte ret.</p> : expanded(open)}
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
