'use client';

import { Nav } from '@/components/Nav';
import { ProfilePanel } from '@/components/ProfilePanel';
import { Screen, ToneBox } from '@/components/Screen';
import { ShoppingList } from '@/components/ShoppingList';
import { PLANS, planById } from '@/lib/mock-data';
import { useStore } from '@/lib/store';

/** White shopping list. Desktop: store columns left, magenta profile panel right. */
export default function IndkobPage() {
  const { state } = useStore();
  const plan = planById(state.selectedPlanId ?? '') ?? PLANS[0]!;
  return (
    <Screen tone="white">
      <div className="mob-only pad" style={{ gap: 8 }}>
        <Nav />
        <ShoppingList plan={plan} />
      </div>
      <div className="split desk-only">
        <div className="main">
          <Nav />
          <ShoppingList plan={plan} columns />
        </div>
        <ToneBox tone="a" className="panel" style={{ width: 360 }}>
          <ProfilePanel compact />
        </ToneBox>
      </div>
    </Screen>
  );
}
