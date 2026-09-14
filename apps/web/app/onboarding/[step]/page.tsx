import { notFound } from 'next/navigation';
import { ONBOARDING_STEPS, Onboarding } from '@/components/Onboarding';

export function generateStaticParams() {
  return Array.from({ length: ONBOARDING_STEPS }, (_, i) => ({ step: String(i + 1) }));
}

export default async function OnboardingPage({ params }: { params: Promise<{ step: string }> }) {
  const { step } = await params;
  const n = Number(step);
  if (!Number.isInteger(n) || n < 1 || n > ONBOARDING_STEPS) notFound();
  return <Onboarding step={n} />;
}
