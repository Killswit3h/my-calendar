/* eslint-disable no-console */
import { PrismaClient, PlannerTaskPriority, PlannerTaskProgress } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Clean only planner namespace
  await prisma.plannerActivity.deleteMany({});
  await prisma.plannerComment.deleteMany({});
  await prisma.plannerAttachment.deleteMany({});
  await prisma.plannerChecklistItem.deleteMany({});
  await prisma.plannerTaskAssignment.deleteMany({});
  await prisma.plannerTaskLabelOnTask.deleteMany({});
  await prisma.plannerLabel.deleteMany({});
  await prisma.plannerTask.deleteMany({});
  await prisma.plannerBucket.deleteMany({});
  await prisma.plannerPlan.deleteMany({});

  const seedDemo = process.env.PLANNER_SEED_DEMO === 'true';
  if (!seedDemo) {
    console.log('Planner demo seed skipped. Database left empty for production use.');
    return;
  }

  const plan = await prisma.plannerPlan.create({
    data: { name: 'Planner Demo', description: 'Isolated Planner module', color: '#1f9d55' },
  });

  const [todo, doing, done] = await Promise.all([
    prisma.plannerBucket.create({ data: { planId: plan.id, name: 'To do', order: 1000 } }),
    prisma.plannerBucket.create({ data: { planId: plan.id, name: 'In progress', order: 2000 } }),
    prisma.plannerBucket.create({ data: { planId: plan.id, name: 'Done', order: 3000 } }),
  ]);

  const make = (i: number, b: string, title: string, priority: PlannerTaskPriority, progress: PlannerTaskProgress, dueInDays: number) => ({
    planId: plan.id,
    bucketId: b,
    title,
    description: 'Seed task',
    priority,
    progress,
    startAt: new Date(),
    dueAt: new Date(Date.now() + dueInDays * 86400000),
    order: i * 10,
  });

  await prisma.plannerTask.createMany({
    data: [
      make(1, todo.id, 'Spec features', PlannerTaskPriority.IMPORTANT, PlannerTaskProgress.NOT_STARTED, 5),
      make(2, todo.id, 'Define labels', PlannerTaskPriority.MEDIUM, PlannerTaskProgress.NOT_STARTED, 7),
      make(3, todo.id, 'Draft docs', PlannerTaskPriority.LOW, PlannerTaskProgress.NOT_STARTED, 9),
      make(1, doing.id, 'Implement API', PlannerTaskPriority.URGENT, PlannerTaskProgress.IN_PROGRESS, 3),
      make(2, doing.id, 'Build UI', PlannerTaskPriority.IMPORTANT, PlannerTaskProgress.IN_PROGRESS, 4),
      make(1, done.id, 'Review layout', PlannerTaskPriority.MEDIUM, PlannerTaskProgress.COMPLETED, -1),
    ],
  });

  // Default Planner label set
  const colors = ['#d13438','#faa937','#c3cc1a','#2db7a3','#3b78ff','#8f60ff'];
  await Promise.all(colors.map((c, idx) =>
    prisma.plannerLabel.create({ data: { planId: plan.id, name: `Label ${idx+1}`, color: c } })
  ));

  console.log(`Seeded Planner plan ${plan.id}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
