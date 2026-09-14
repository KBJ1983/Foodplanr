import { NextResponse } from 'next/server';
import { loadOffers } from '@/lib/offers-source';

export const dynamic = 'force-dynamic';

/** Offers + provenance for the client. Whitelisted fields only. */
export function GET() {
  return NextResponse.json(loadOffers(), { headers: { 'Cache-Control': 'no-store' } });
}
