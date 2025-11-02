'use client';

import { useParams } from 'next/navigation';
import Board from '@/components/planner/Board';
import { usePlan } from '@/src/hooks/usePlannerApi';

export const dynamic = 'force-dynamic';

export default function PlannerBoardPage() {
  const params = useParams();
  const planId = typeof params?.planId === 'string' ? params.planId : undefined;
  const { q, createTask, createBucket, renameBucket, deleteBucket } = usePlan(planId);

  if (!planId) return <div className="p-6 text-red-400">Missing plan reference</div>;
  if (q.isLoading) return <div className="p-6 text-slate-300">Loading…</div>;
  if (q.error || !q.data?.plan) return <div className="p-6 text-red-400">Failed to load plan</div>;

  return (
    <Board
      plan={q.data.plan}
      onCreateTask={(bucketId, title) => createTask.mutate({ bucketId, title })}
      creatingTask={createTask.isPending}
      onCreateBucket={(name) => createBucket.mutateAsync({ name })}
      creatingBucket={createBucket.isPending}
      onRenameBucket={(bucketId, name) => renameBucket.mutateAsync({ bucketId, name })}
      renamingBucket={renameBucket.isPending}
      onDeleteBucket={(bucketId) => deleteBucket.mutateAsync({ bucketId })}
      deletingBucket={deleteBucket.isPending}
    />
  );
}
