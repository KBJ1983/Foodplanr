import { isoWeekNumber, weekRangeLabel } from '@/lib/week';

/**
 * Where the prices come from. Today: our own example prices. When a source
 * becomes `approved` in the rights registry this line names it and the offer
 * period, as the agreement requires (brief §11).
 */
export function PriceSource({ weekStart, compact = false }: { weekStart: string; compact?: boolean }) {
  return (
    <p className="s" style={{ fontSize: compact ? 10 : 11, opacity: 0.6, margin: 0 }}>
      Prisgrundlag: egne eksempelpriser, uge {isoWeekNumber(weekStart)} ({weekRangeLabel(weekStart)}). Aktuelle tilbud fra
      kæderne kommer, når aftalerne med kilderne er på plads.
    </p>
  );
}
