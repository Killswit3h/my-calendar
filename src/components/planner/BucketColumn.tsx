import TaskCard from './TaskCard';

type Task = {
  id: string; title: string;
  priority: 'URGENT'|'IMPORTANT'|'MEDIUM'|'LOW';
  progress: 'NOT_STARTED'|'IN_PROGRESS'|'COMPLETED';
  dueAt: string | null; order: number;
};
type Bucket = { id: string; name: string; order: number; tasks: Task[]; };

export default function BucketColumn({ bucket }: { bucket: Bucket }) {
  return (
    <div className="w-80 shrink-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{bucket.name}</h3>
      </div>
      <div className="space-y-3">
        {bucket.tasks.map(t => <TaskCard key={t.id} task={t} />)}
      </div>
    </div>
  );
}
