import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const jsonFetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed for ${url}`);
  return res.json();
};

export function usePlannerList() {
  return useQuery({
    queryKey: ['planner', 'plans'],
    queryFn: () => jsonFetcher('/api/planner'),
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; description?: string; color?: string; userId?: string }) => {
      const res = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? 'create plan failed');
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['planner', 'plans'] });
    },
  });
}

export function usePlan(planId?: string) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['planner', 'plan', planId],
    queryFn: () => {
      if (!planId) throw new Error('planId required');
      return jsonFetcher(`/api/planner/${planId}`);
    },
    enabled: Boolean(planId),
  });

  const patchTask = useMutation({
    mutationFn: async (payload: { taskId: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/planner/tasks/${payload.taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload.data),
      });
      if (!res.ok) throw new Error('patch task failed');
      return res.json();
    },
    onSuccess: () => {
      if (planId) {
        qc.invalidateQueries({ queryKey: ['planner', 'plan', planId] });
        qc.invalidateQueries({ queryKey: ['planner', 'plan', planId, 'activity'] });
      }
    },
  });

  const moveTask = useMutation({
    mutationFn: async (payload: { taskId: string; toBucketId: string; beforeTaskId?: string | null; userId?: string }) => {
      const res = await fetch(`/api/planner/tasks/${payload.taskId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toBucketId: payload.toBucketId,
          beforeTaskId: payload.beforeTaskId ?? undefined,
          userId: payload.userId ?? 'system',
        }),
      });
      if (!res.ok) throw new Error('move task failed');
      return res.json();
    },
    onSuccess: () => {
      if (planId) {
        qc.invalidateQueries({ queryKey: ['planner', 'plan', planId] });
        qc.invalidateQueries({ queryKey: ['planner', 'plan', planId, 'activity'] });
      }
    },
  });

  const toggleLabel = useMutation({
    mutationFn: async (payload: { taskId: string; labelId: string; userId?: string }) => {
      const res = await fetch(`/api/planner/tasks/${payload.taskId}/labels/${payload.labelId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: payload.userId ?? 'system' }),
      });
      if (!res.ok) throw new Error('toggle label failed');
      return res.json();
    },
    onSuccess: () => {
      if (planId) {
        qc.invalidateQueries({ queryKey: ['planner', 'plan', planId] });
        qc.invalidateQueries({ queryKey: ['planner', 'plan', planId, 'activity'] });
      }
    },
  });

  const toggleAssign = useMutation({
    mutationFn: async (payload: { taskId: string; userId: string; actorId?: string }) => {
      const res = await fetch(`/api/planner/tasks/${payload.taskId}/assign/${payload.userId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorId: payload.actorId ?? 'system' }),
      });
      if (!res.ok) throw new Error('toggle assignee failed');
      return res.json();
    },
    onSuccess: () => {
      if (planId) {
        qc.invalidateQueries({ queryKey: ['planner', 'plan', planId] });
        qc.invalidateQueries({ queryKey: ['planner', 'plan', planId, 'activity'] });
      }
    },
  });

  const createTask = useMutation({
    mutationFn: async (payload: { bucketId: string; title: string; userId?: string }) => {
      if (!planId) throw new Error('planId required');
      const res = await fetch(`/api/planner/${planId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucketId: payload.bucketId,
          title: payload.title,
          userId: payload.userId ?? 'system',
        }),
      });
      if (!res.ok) throw new Error('create task failed');
      return res.json();
    },
    onSuccess: () => {
      if (planId) {
        qc.invalidateQueries({ queryKey: ['planner', 'plan', planId] });
        qc.invalidateQueries({ queryKey: ['planner', 'plan', planId, 'activity'] });
      }
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (payload: { taskId: string; userId?: string }) => {
      const res = await fetch(`/api/planner/tasks/${payload.taskId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: payload.userId ?? 'system' }),
      });
      if (!res.ok) throw new Error('delete task failed');
      return res.json();
    },
    onSuccess: () => {
      if (planId) {
        qc.invalidateQueries({ queryKey: ['planner', 'plan', planId] });
        qc.invalidateQueries({ queryKey: ['planner', 'plan', planId, 'activity'] });
      }
    },
  });

  const refresh = () => {
    if (planId) qc.invalidateQueries({ queryKey: ['planner', 'plan', planId] });
  };

  const createBucket = useMutation({
    mutationFn: async (payload: { name: string; order?: number; userId?: string }) => {
      if (!planId) throw new Error('planId required');
      const { userId = 'system', ...data } = payload;
      const res = await fetch(`/api/planner/${planId}/buckets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, userId }),
      });
      if (!res.ok) throw new Error('create bucket failed');
      return res.json();
    },
    onSuccess: () => {
      if (planId) {
        qc.invalidateQueries({ queryKey: ['planner', 'plan', planId] });
        qc.invalidateQueries({ queryKey: ['planner', 'plan', planId, 'activity'] });
      }
    },
  });

  const renameBucket = useMutation({
    mutationFn: async (payload: { bucketId: string; name?: string; order?: number; userId?: string }) => {
      const { bucketId, userId = 'system', ...data } = payload;
      if (!bucketId) throw new Error('bucketId required');
      if (Object.keys(data).length === 0) throw new Error('bucket update requires fields');
      const res = await fetch(`/api/planner/buckets/${bucketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, userId }),
      });
      if (!res.ok) throw new Error('update bucket failed');
      return res.json();
    },
    onSuccess: () => {
      if (planId) {
        qc.invalidateQueries({ queryKey: ['planner', 'plan', planId] });
        qc.invalidateQueries({ queryKey: ['planner', 'plan', planId, 'activity'] });
      }
    },
  });

  const deleteBucket = useMutation({
    mutationFn: async (payload: { bucketId: string; userId?: string }) => {
      const res = await fetch(`/api/planner/buckets/${payload.bucketId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: payload.userId ?? 'system' }),
      });
      if (!res.ok) throw new Error('delete bucket failed');
      return res.json();
    },
    onSuccess: () => {
      if (planId) {
        qc.invalidateQueries({ queryKey: ['planner', 'plan', planId] });
        qc.invalidateQueries({ queryKey: ['planner', 'plan', planId, 'activity'] });
      }
    },
  });

  const updatePlan = useMutation({
    mutationFn: async (payload: { name?: string; description?: string; color?: string; userId?: string }) => {
      if (!planId) throw new Error('planId required');
      const { userId = 'system', ...data } = payload;
      if (Object.keys(data).length === 0) throw new Error('update requires fields');
      const res = await fetch(`/api/planner/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, userId }),
      });
      if (!res.ok) throw new Error('update plan failed');
      return res.json();
    },
    onSuccess: () => {
      if (planId) {
        qc.invalidateQueries({ queryKey: ['planner', 'plan', planId] });
        qc.invalidateQueries({ queryKey: ['planner', 'plans'] });
      }
    },
  });

  return {
    q,
    patchTask,
    moveTask,
    toggleLabel,
    toggleAssign,
    createTask,
    updatePlan,
    refresh,
    createBucket,
    renameBucket,
    deleteBucket,
    deleteTask,
  };
}

export function useChecklist(taskId: string, planId: string) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['planner', 'task', taskId, 'checklist'],
    queryFn: async () => {
      const r = await fetch(`/api/planner/tasks/${taskId}/checklist`);
      if (!r.ok) throw new Error('load checklist failed');
      return r.json();
    },
    enabled: Boolean(taskId),
  });

  const add = useMutation({
    mutationFn: async (title: string) => {
      const r = await fetch(`/api/planner/tasks/${taskId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!r.ok) throw new Error('add checklist failed');
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['planner', 'task', taskId, 'checklist'] });
      qc.invalidateQueries({ queryKey: ['planner', 'plan', planId] });
    },
  });

  const patch = useMutation({
    mutationFn: async (payload: { itemId: string; data: Record<string, unknown> }) => {
      const r = await fetch(`/api/planner/checklist/${payload.itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload.data),
      });
      if (!r.ok) throw new Error('patch checklist failed');
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['planner', 'task', taskId, 'checklist'] });
      qc.invalidateQueries({ queryKey: ['planner', 'plan', planId] });
    },
  });

  const remove = useMutation({
    mutationFn: async (itemId: string) => {
      const r = await fetch(`/api/planner/checklist/${itemId}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('delete checklist failed');
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['planner', 'task', taskId, 'checklist'] });
      qc.invalidateQueries({ queryKey: ['planner', 'plan', planId] });
    },
  });

  return { q, add, patch, remove };
}

export function useComments(taskId: string) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['planner', 'task', taskId, 'comments'],
    queryFn: async () => {
      const r = await fetch(`/api/planner/tasks/${taskId}/comments`);
      if (!r.ok) throw new Error('load comments failed');
      return r.json();
    },
    enabled: Boolean(taskId),
  });

  const add = useMutation({
    mutationFn: async (payload: { userId: string; body: string }) => {
      const r = await fetch(`/api/planner/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error('add comment failed');
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['planner', 'task', taskId, 'comments'] }),
  });

  return { q, add };
}

export function useAttachments(taskId: string) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['planner', 'task', taskId, 'attachments'],
    queryFn: async () => {
      const r = await fetch(`/api/planner/tasks/${taskId}/attachments`);
      if (!r.ok) throw new Error('load attachments failed');
      return r.json();
    },
    enabled: Boolean(taskId),
  });

  const add = useMutation({
    mutationFn: async (payload: { name: string; url: string; mimeType?: string; sizeBytes?: number }) => {
      const r = await fetch(`/api/planner/tasks/${taskId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error('add attachment failed');
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['planner', 'task', taskId, 'attachments'] }),
  });

  return { q, add };
}

export function usePlanLabels(planId: string) {
  return useQuery({
    queryKey: ['planner', 'plan', planId, 'labels'],
    queryFn: async () => {
      const r = await fetch(`/api/planner/${planId}/labels`);
      if (!r.ok) throw new Error('labels failed');
      return r.json();
    },
    enabled: Boolean(planId),
  });
}

export function useActivity(planId: string) {
  return useQuery({
    queryKey: ['planner', 'plan', planId, 'activity'],
    queryFn: async () => {
      const r = await fetch(`/api/planner/${planId}/activity`);
      if (!r.ok) throw new Error('activity failed');
      return r.json();
    },
    refetchInterval: 5000,
    enabled: Boolean(planId),
  });
}
