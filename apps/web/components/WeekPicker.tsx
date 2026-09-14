'use client';

import { FREE_TIER, useStore } from '@/lib/store';
import { addWeeks, isoWeekNumber, mondayOf } from '@/lib/week';

/** Chips for the week being planned: this week + `maxWeeksAhead` (free: one). */
export function WeekPicker() {
  const { weekStart, update } = useStore();
  const current = mondayOf();
  const options = Array.from({ length: FREE_TIER.maxWeeksAhead + 1 }, (_, i) => addWeeks(current, i));
  return (
    <div className="col" style={{ gap: 6 }}>
      <div className="row wrap" role="group" aria-label="Vælg uge">
        {options.map((ws, i) => (
          <button key={ws} type="button" className="chip" aria-pressed={ws === weekStart} onClick={() => update({ weekStart: ws })}>
            {i === 0 ? 'Denne uge' : i === 1 ? 'Næste uge' : `Uge ${isoWeekNumber(ws)}`} · {isoWeekNumber(ws)}
          </button>
        ))}
        <span className="chip outline" title="Flere uger frem er en Pro-funktion" style={{ opacity: 0.6 }}>
          + uger · Pro
        </span>
      </div>
    </div>
  );
}
