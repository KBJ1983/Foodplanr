import { getSource } from '@madplan/legal';
import { isoWeekNumber, weekRangeLabel } from '@/lib/week';

/**
 * Where the prices come from. Offers: today our own fixtures in the pipeline's
 * format (Tjek is `pending` in the rights registry, so no real offers). Normal
 * prices: our estimates until price_history exists. When Tjek is approved this
 * line names the source and the offer period, as the agreement will require.
 */
export function PriceSource({ weekStart, compact = false }: { weekStart: string; compact?: boolean }) {
  const tjek = getSource('tjek');
  const live = tjek.legal_status === 'approved';
  return (
    <p className="s" style={{ fontSize: compact ? 10 : 11, opacity: 0.6, margin: 0 }}>
      Tilbud: {live ? `${tjek.display_name}` : 'egne testdata i tilbudsavis-format (ingen rigtige tilbud endnu)'}, gyldige uge {isoWeekNumber(weekStart)} (
      {weekRangeLabel(weekStart)}). Normalpriser: egne estimater. {live ? '' : 'Rigtige tilbud kræver aftale med kilderne (Tjek, Salling), status: afventer.'}
    </p>
  );
}
