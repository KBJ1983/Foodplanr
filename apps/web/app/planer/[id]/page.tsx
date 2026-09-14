import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { PLANS, planById } from '@/lib/mock-data';
import { PlanDetail } from './PlanDetail';

export function generateStaticParams() {
  return PLANS.map((p) => ({ id: p.id }));
}

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plan = planById(id);
  if (!plan) notFound();
  // PlanDetail reads `?uge=` via useSearchParams, which needs a Suspense boundary for static rendering.
  return (
    <Suspense fallback={null}>
      <PlanDetail plan={plan} />
    </Suspense>
  );
}
