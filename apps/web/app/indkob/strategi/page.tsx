'use client';

import Link from 'next/link';
import { Screen } from '@/components/Screen';
import { StrategyPanel } from '@/components/StrategyPanel';
import { PLANS, planById } from '@/lib/mock-data';
import { useStore } from '@/lib/store';

/** Blue strategy screen (mobile). On desktop the same panel sits next to the week view. */
export default function StrategiPage() {
  const { state } = useStore();
  const plan = planById(state.selectedPlanId ?? '') ?? PLANS[0]!;
  return (
    <Screen tone="b">
      <div className="pad" style={{ maxWidth: 640 }}>
        <div className="row sb ac" style={{ fontSize: 12, fontWeight: 600 }}>
          <Link href={`/planer/${plan.id}`}>← Madplan</Link>
          <span className="logo">Handl ind</span>
        </div>
        <StrategyPanel plan={plan} />
      </div>
    </Screen>
  );
}
