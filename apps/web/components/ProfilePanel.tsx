'use client';

import Link from 'next/link';
import { AVOID_PREFS, LIKE_PREFS, STORES } from '@/lib/mock-data';
import { n } from '@/lib/format';
import { useStore } from '@/lib/store';
import { ChipToggle } from './Chips';

/** Magenta profile: household, two key numbers, fixed stores, preferences, toggles. */
export function ProfilePanel({ compact = false }: { compact?: boolean }) {
  const { state, update, reset } = useStore();
  const kidsLabel = state.household.kids === 0 ? '' : ` · ${state.household.kids} ${state.household.kids === 1 ? 'barn' : 'børn'}`;
  const toggle = (list: readonly string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <>
      <p className="h1" style={{ fontSize: compact ? 28 : 32 }}>
        Husstanden
      </p>
      <p className="p" style={{ opacity: 0.8 }}>
        {state.household.adults} {state.household.adults === 1 ? 'voksen' : 'voksne'}
        {kidsLabel}
        {' · '}
        <Link href="/onboarding/1" style={{ textDecoration: 'underline' }}>
          ret
        </Link>
      </p>
      <div className="row" style={{ gap: 20 }}>
        <div>
          <p className="num" style={{ fontSize: compact ? 36 : 40 }}>
            {n(state.kcalPerDay)}
          </p>
          <p className="mono" style={{ color: '#fff' }}>
            kcal / dag
          </p>
        </div>
        <div>
          <p className="num" style={{ fontSize: compact ? 36 : 40 }}>
            {n(state.weeklyBudget)}
          </p>
          <p className="mono" style={{ color: '#fff' }}>
            kr / uge
          </p>
        </div>
      </div>
      <p className="mono" style={{ color: '#fff', marginTop: 8 }}>
        Faste butikker
      </p>
      <div className="row wrap">
        {STORES.filter((s) => compact ? state.stores.includes(s.id) : true).map((s) => (
          <ChipToggle key={s.id} label={s.name} on={state.stores.includes(s.id)} variant="inverse" onToggle={() => update({ stores: toggle(state.stores, s.id) as typeof state.stores })} />
        ))}
      </div>
      <p className="mono" style={{ color: '#fff', marginTop: 8 }}>
        Råvarer
      </p>
      <div className="row wrap">
        {[...AVOID_PREFS, ...LIKE_PREFS]
          .filter((v) => (compact ? state.ingredientPrefs.includes(v) : true))
          .map((v) => (
            <ChipToggle key={v} label={v} on={state.ingredientPrefs.includes(v)} onToggle={() => update({ ingredientPrefs: toggle(state.ingredientPrefs, v) })} />
          ))}
      </div>
      {!compact && (
        <>
          <button type="button" className="li mt-auto" style={{ borderColor: 'rgb(255 255 255 / 0.35)' }} role="switch" aria-checked={state.shareWithHousehold} onClick={() => update({ shareWithHousehold: !state.shareWithHousehold })}>
            <span>Del med husstanden</span>
            <i className="toggle" aria-checked={state.shareWithHousehold} aria-hidden="true" style={state.shareWithHousehold ? { background: '#fff' } : undefined} />
          </button>
          <button type="button" className="li last" role="switch" aria-checked={state.sundayReminder} onClick={() => update({ sundayReminder: !state.sundayReminder })}>
            <span>Påmindelse søndag kl. 17</span>
            <i className="toggle" aria-checked={state.sundayReminder} aria-hidden="true" style={state.sundayReminder ? { background: '#fff' } : undefined} />
          </button>
          <button type="button" className="s" style={{ textAlign: 'left', textDecoration: 'underline', marginTop: 12 }} onClick={reset}>
            Nulstil og start forfra
          </button>
        </>
      )}
    </>
  );
}
