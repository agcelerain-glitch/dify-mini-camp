import { use } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPhase } from '@/lib/phases-data';
import { PhaseContent } from './PhaseContent';

export async function generateMetadata(
  props: PageProps<'/camp/[phase]'>,
): Promise<Metadata> {
  const { phase: phaseParam } = await props.params;
  const phaseId = parseInt(phaseParam, 10);
  const phase = getPhase(phaseId);
  if (!phase) return {};

  const title = `Phase ${phaseId}: ${phase.title}`;
  const description = `${phase.description} — Dify mini Campの${phase.difficultyLabel}コース。${phase.duration}で学べる実践ハンズオン。`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    twitter: {
      title,
      description,
    },
  };
}

export default function PhasePage(props: PageProps<'/camp/[phase]'>) {
  const { phase: phaseParam } = use(props.params);
  const searchParams = use(props.searchParams);
  const phaseId = parseInt(phaseParam, 10);

  if (isNaN(phaseId) || phaseId < 1 || phaseId > 5) {
    notFound();
  }

  const phase = getPhase(phaseId);
  if (!phase) notFound();

  const levelParam = searchParams?.level;
  const parsedLevel = parseInt(typeof levelParam === 'string' ? levelParam : '1', 10);
  const initialLevel = phase.levels.find((l) => l.id === parsedLevel) ? parsedLevel : 1;

  const pageParam = searchParams?.page;
  const initialPageId = parseInt(typeof pageParam === 'string' ? pageParam : '0', 10);

  return <PhaseContent phase={phase} initialLevel={initialLevel} initialPageId={initialPageId} />;
}
