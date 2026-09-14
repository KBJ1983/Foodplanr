import Link from 'next/link';
import type { MealPlan } from '@/lib/mock-data';
import { kr, n } from '@/lib/format';

const TONE_BG = { a: 'var(--a)', b: 'var(--b)', c: 'var(--c)' } as const;

export function Placeholder({ tone, height, label = 'foto', style }: { tone: 'a' | 'b' | 'c' | 'white'; height: number | string; label?: string; style?: React.CSSProperties }) {
  return (
    <div className="img" aria-hidden="true" style={{ height, ['--img-bg' as string]: tone === 'white' ? '#fff' : TONE_BG[tone], ...style }}>
      {label}
    </div>
  );
}

/** Archive row (mobile): title, meta, 54px photo thumb, 30 % black dividers. */
export function PlanRow({ plan, price, storesLabel }: { plan: MealPlan; price: number; storesLabel: string }) {
  return (
    <Link href={`/planer/${plan.id}`} className="li strong">
      <div>
        <p className="h2">{plan.title}</p>
        <p className="s">
          {kr(price)} · {n(plan.kcalPerDay)} kcal · {plan.recipeIds.length < 7 ? `${plan.recipeIds.length} dage · ` : ''}
          {storesLabel}
        </p>
      </div>
      <Placeholder tone="white" height={54} style={{ width: 54, flex: 'none' }} />
    </Link>
  );
}

/** Archive card (desktop grid). */
export function PlanTile({ plan, price }: { plan: MealPlan; price: number }) {
  return (
    <Link href={`/planer/${plan.id}`} className="col" style={{ gap: 0 }}>
      <Placeholder tone="white" height={130} />
      <p className="h2" style={{ marginTop: 8 }}>
        {plan.title}
      </p>
      <p className="s">
        {kr(price)} · {n(plan.kcalPerDay)} kcal · {plan.recipeIds.length} retter
      </p>
    </Link>
  );
}
