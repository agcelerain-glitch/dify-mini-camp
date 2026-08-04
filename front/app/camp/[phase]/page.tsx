import { use } from 'react';
import { notFound } from 'next/navigation';
import { getPhase } from '@/lib/phases-data';
import { PhaseContent } from './PhaseContent';

export default function PhasePage(props: PageProps<'/camp/[phase]'>) {
  const { phase: phaseParam } = use(props.params);
  const phaseId = parseInt(phaseParam, 10);

  if (isNaN(phaseId) || phaseId < 1 || phaseId > 5) {
    notFound();
  }

  const phase = getPhase(phaseId);
  if (!phase) notFound();

  return <PhaseContent phase={phase} />;
}
