'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AVOID_PREFS, LIKE_PREFS, STORES } from '@/lib/mock-data';
import { matchingCountDisplay } from '@/lib/matching';
import { n } from '@/lib/format';
import { persons, useStore } from '@/lib/store';
import { ChipToggle, Counter, Slider } from './Chips';
import { Screen, type Tone } from './Screen';

const STEPS = [
  { key: 'personer', label: 'Personer', tone: 'c' as Tone },
  { key: 'butikker', label: 'Butikker', tone: 'b' as Tone },
  { key: 'budget', label: 'Budget', tone: 'a' as Tone },
  { key: 'raavarer', label: 'Råvarer', tone: 'c' as Tone },
  { key: 'kalorier', label: 'Kalorier', tone: 'b' as Tone },
] as const;

export const ONBOARDING_STEPS = STEPS.length;

export function Onboarding({ step }: { step: number }) {
  const { state, update } = useStore();
  const router = useRouter();
  const idx = Math.min(Math.max(step, 1), STEPS.length) - 1;
  const current = STEPS[idx]!;
  const prev = STEPS[idx - 1];
  const next = STEPS[idx + 1];
  const matches = matchingCountDisplay(state);

  function finish() {
    update({ onboarded: true });
    router.push('/arkiv');
  }

  const toggleIn = (list: readonly string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const body = (() => {
    switch (current.key) {
      case 'personer': {
        const total = persons(state);
        return (
          <>
            <p className="mono">Hvor mange skal spise med?</p>
            <p className="num big">
              {total}
              <small> pers</small>
            </p>
            <div className="row wrap" style={{ gap: 28 }}>
              <div className="col" style={{ gap: 6 }}>
                <span className="mono">Voksne</span>
                <Counter label="voksne" value={state.household.adults} min={1} max={8} onChange={(v) => update({ household: { ...state.household, adults: v } })} />
              </div>
              <div className="col" style={{ gap: 6 }}>
                <span className="mono">Børn</span>
                <Counter label="børn" value={state.household.kids} min={0} max={8} onChange={(v) => update({ household: { ...state.household, kids: v } })} />
              </div>
            </div>
            <p className="p">Portioner og indkøbsliste skaleres efter husstanden.</p>
          </>
        );
      }
      case 'butikker':
        return (
          <>
            <p className="mono">Hvor handler I helst?</p>
            <p className="num big">
              {state.stores.length}
              <small> {state.stores.length === 1 ? 'butik' : 'butikker'}</small>
            </p>
            <p className="p">Vælg én eller flere. Vi finder ugens tilbud i netop de kæder.</p>
            <div className="row wrap">
              {STORES.map((s) => (
                <ChipToggle key={s.id} label={s.name} on={state.stores.includes(s.id)} onToggle={() => update({ stores: toggleIn(state.stores, s.id) as typeof state.stores })} />
              ))}
            </div>
          </>
        );
      case 'budget': {
        const perMeal = Math.round(state.weeklyBudget / 7 / Math.max(1, persons(state)));
        return (
          <>
            <p className="mono">Budget pr. uge</p>
            <p className="num big" style={{ marginTop: 'auto' }}>
              {n(state.weeklyBudget)}
              <small> kr</small>
            </p>
            <p className="p" style={{ fontSize: 14 }}>
              ≈ {perMeal} kr pr. måltid for {persons(state)} personer. Træk for at justere. {matches} madplaner passer til dette budget.
            </p>
            <Slider label="Budget pr. uge" value={state.weeklyBudget} min={500} max={1500} step={25} marks={['500', '1.000', '1.500 kr']} onChange={(v) => update({ weeklyBudget: v })} />
          </>
        );
      }
      case 'raavarer':
        return (
          <>
            <p className="mono">Råvarer</p>
            <p className="num big">
              {state.ingredientPrefs.length}
              <small> {state.ingredientPrefs.length === 1 ? 'ønske' : 'ønsker'}</small>
            </p>
            <p className="mono">Undgå</p>
            <div className="row wrap">
              {AVOID_PREFS.map((v) => (
                <ChipToggle key={v} label={v} on={state.ingredientPrefs.includes(v)} onToggle={() => update({ ingredientPrefs: toggleIn(state.ingredientPrefs, v) })} />
              ))}
            </div>
            <p className="mono" style={{ marginTop: 8 }}>
              Elsker
            </p>
            <div className="row wrap">
              {LIKE_PREFS.map((v) => (
                <ChipToggle key={v} label={v} on={state.ingredientPrefs.includes(v)} onToggle={() => update({ ingredientPrefs: toggleIn(state.ingredientPrefs, v) })} />
              ))}
            </div>
          </>
        );
      case 'kalorier':
        return (
          <>
            <p className="mono">Kalorier pr. person pr. dag</p>
            <p className="num big" style={{ marginTop: 'auto' }}>
              {n(state.kcalPerDay)}
              <small> kcal</small>
            </p>
            <p className="p" style={{ fontSize: 14 }}>
              Aftensmaden udgør ca. 35 % af dagens behov. {matches} madplaner passer til jer.
            </p>
            <Slider label="Kalorier pr. dag" value={state.kcalPerDay} min={1200} max={3000} step={50} marks={['1.200', '2.100', '3.000 kcal']} onChange={(v) => update({ kcalPerDay: v })} />
          </>
        );
    }
  })();

  const isA = current.tone === 'a';

  return (
    <Screen tone={current.tone}>
      <div className="split" style={{ flex: 1 }}>
        <div className="pad" style={{ gap: 14, maxWidth: 'none' }}>
          <div className="row sb ac" style={{ fontSize: 12, fontWeight: 600 }}>
            <span className="logo">foodplanr</span>
            <span>
              {idx + 1} / {STEPS.length}
              <span className="desk-only" style={{ display: 'inline' }}>
                {' '}
                · {current.label}
              </span>
            </span>
          </div>
          {body}
          <div className="row" style={{ marginTop: 'auto', gap: 12 }}>
            {prev ? (
              <Link href={`/onboarding/${idx}`} className="btn2 grow" style={{ flexGrow: 1 }}>
                ← {prev.label}
              </Link>
            ) : (
              <span className="grow" />
            )}
            {next ? (
              <Link href={`/onboarding/${idx + 2}`} className={`btn grow ${isA ? 'inverse' : ''}`}>
                {next.label} →
              </Link>
            ) : (
              <button type="button" className={`btn grow ${isA ? 'inverse' : ''}`} onClick={finish}>
                Se {matches} madplaner →
              </button>
            )}
          </div>
        </div>
        <aside className="desk-only col" style={{ width: 300, padding: '48px 40px 48px 0', justifyContent: 'center', gap: 10, fontWeight: 800, fontSize: 16 }} aria-label="Trin">
          {STEPS.map((s, i) => (
            <Link key={s.key} href={`/onboarding/${i + 1}`} style={{ opacity: i === idx ? 1 : 0.5, fontSize: i === idx ? 26 : 16 }}>
              {i + 1} · {s.label}
              {i < idx ? ' ✓' : ''}
            </Link>
          ))}
        </aside>
      </div>
      <style>{`.num.big{font-size:88px}@media(min-width:1024px){.num.big{font-size:120px}}`}</style>
    </Screen>
  );
}
