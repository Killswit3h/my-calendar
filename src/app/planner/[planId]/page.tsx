'use client';
import useSWR from 'swr';
import { useParams } from 'next/navigation';
import Board from '@/components/planner/Board';

const fetcher = (u: string) => fetch(u).then(r => r.json());

export default function PlannerBoardPage() {
  const params = useParams();
  const planId = typeof params?.planId === 'string' ? params.planId : undefined;
  const { data, error, isLoading } = useSWR<{plan: any}>(planId ? `/api/planner/${planId}` : null, fetcher);

  if (!planId) return <div className="p-6 text-red-400">Missing plan reference</div>;
  if (isLoading) return <div className="p-6 text-slate-300">Loading…</div>;
  if (error || !data?.plan) return <div className="p-6 text-red-400">Failed to load plan</div>;

  return <Board plan={data.plan} />;
}
