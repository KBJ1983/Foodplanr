'use client';

import Link from 'next/link';
import { Screen } from '@/components/Screen';
import { PLANS } from '@/lib/mock-data';
import { useStore } from '@/lib/store';
import { weekLabel } from '@/lib/week';

/**
 * Front page, before any choices. Magenta poster: one big number (5 questions),
 * three short lines on how it works, and the way in. Returning households get
 * a direct route to their plans.
 */
export default function Home() {
  const { state, ready, weekStart } = useStore();
  const returning = ready && state.onboarded;

  return (
    <Screen tone="a">
      <div className="pad landing">
        <div className="row sb ac" style={{ fontSize: 12, fontWeight: 600 }}>
          <span className="logo" style={{ fontSize: 18 }}>
            foodplanr
          </span>
          <span className="desk-only" style={{ display: 'inline' }}>
            {weekLabel(weekStart)}
          </span>
        </div>

        <div className="landing-hero">
          <div>
            <p className="mono" style={{ color: '#fff' }}>
              Madplan efter dine butikker
            </p>
            <p className="num landing-num">
              5<small> spørgsmål</small>
            </p>
            <p className="h1" style={{ fontSize: 'clamp(22px, 2.6vw, 34px)', maxWidth: 560, marginTop: 8 }}>
              så har I ugens madplan og en indkøbsliste pr. butik.
            </p>
          </div>

          <ol className="landing-steps">
            <li>
              <b>Svar på 5 spørgsmål.</b> Personer, butikker, budget, råvarer, kalorier.
            </li>
            <li>
              <b>Vælg en madplan.</b> {PLANS.length} egne planer i puljen nu; puljen vokser.
            </li>
            <li>
              <b>Handl smart.</b> Billigst, færrest stop eller dine faste butikker. Listen er grupperet pr. butik.
            </li>
          </ol>
        </div>

        <div className="row wrap" style={{ gap: 12, marginTop: 'auto' }}>
          {returning ? (
            <>
              <Link href="/planer" className="btn inverse" style={{ padding: '16px 28px' }}>
                Mine planer →
              </Link>
              <Link href="/arkiv" className="btn2" style={{ padding: '14px 28px' }}>
                Se alle madplaner
              </Link>
              <Link href="/onboarding/1" className="btn2" style={{ padding: '14px 28px' }}>
                Ret svar
              </Link>
            </>
          ) : (
            <>
              <Link href="/onboarding/1" className="btn inverse" style={{ padding: '16px 28px' }}>
                Kom i gang →
              </Link>
              <Link href="/arkiv" className="btn2" style={{ padding: '14px 28px' }}>
                Se madplanerne først
              </Link>
            </>
          )}
        </div>
        <p className="s" style={{ opacity: 0.7 }}>
          Priserne i denne version er egne eksempelpriser. Aktuelle tilbud fra kæderne kobles på, når aftalerne med kilderne er på plads.
        </p>
      </div>
    </Screen>
  );
}
