'use client';

import { useOffersMeta } from '@/lib/use-pricing';
import { isoWeekNumber, weekRangeLabel } from '@/lib/week';

/**
 * Where the prices come from — read from the offers provenance so the line is
 * always true: fixtures today; source name, fetch time and match rate once a
 * live snapshot exists. Normal prices are our estimates until price_history.
 */
export function PriceSource({ weekStart, compact = false }: { weekStart: string; compact?: boolean }) {
  const meta = useOffersMeta();
  const when = meta.fetchedAt ? new Date(meta.fetchedAt).toLocaleString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : null;
  return (
    <p className="s" style={{ fontSize: compact ? 10 : 11, opacity: 0.6, margin: 0 }}>
      Tilbud: {meta.sourceLabel}
      {when ? `, hentet ${when}` : ''}, gyldige uge {isoWeekNumber(weekStart)} ({weekRangeLabel(weekStart)}).
      {meta.kind === 'snapshot' ? ` ${meta.matched} af ${meta.total} tilbud matchet til råvarer.` : ''} Normalpriser: egne estimater.
      {meta.legalStatus !== 'approved' ? ' Rigtige tilbud kræver aftale med kilderne (Tjek, Salling), status: afventer.' : ''}
    </p>
  );
}
