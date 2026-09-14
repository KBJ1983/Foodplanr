'use client';

import { Nav } from '@/components/Nav';
import { ProfilePanel } from '@/components/ProfilePanel';
import { Screen } from '@/components/Screen';

export default function ProfilPage() {
  return (
    <Screen tone="a">
      <div className="pad" style={{ maxWidth: 720 }}>
        <Nav />
        <ProfilePanel />
      </div>
    </Screen>
  );
}
