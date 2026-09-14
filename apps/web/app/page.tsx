'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useStore } from '@/lib/store';

/** Entry: new households go through the 5 questions, returning ones land in the archive. */
export default function Home() {
  const { state, ready } = useStore();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    router.replace(state.onboarded ? '/arkiv' : '/onboarding/1');
  }, [ready, state.onboarded, router]);
  return (
    <main className="screen" style={{ ['--bg' as string]: 'var(--a)' }} data-ink="white">
      <div className="pad">
        <span className="logo">foodplanr</span>
      </div>
    </main>
  );
}
