'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PLANS } from '@/lib/mock-data';
import { useStore } from '@/lib/store';

/** "Planer" tab = the household's current week. Falls back to the first plan until one is chosen. */
export default function PlanerIndex() {
  const { state, ready } = useStore();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    router.replace(`/planer/${state.selectedPlanId ?? PLANS[0]!.id}`);
  }, [ready, state.selectedPlanId, router]);
  return null;
}
