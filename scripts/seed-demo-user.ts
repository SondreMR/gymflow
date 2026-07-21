import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";

import { PrismaClient, WeightUnit } from "../src/generated/prisma/client";
import { getWeeklyGoalStreaksFromDates } from "../src/features/dashboard/dashboard-utils";
import {
  calculateBaseXp,
  calculateEarnedXp,
  getEligibleTrophies,
  getLevelProgress,
  getStreakMultiplier,
  totalXpRequiredForLevel,
  WEEKLY_GOAL_BONUS_XP,
} from "../src/features/progression/progression";

const DEMO_PREFIX = "gymflow-demo:";
const DEMO_DESCRIPTION = "GymFlow showcase demo data — safe to regenerate";
const DEMO_LEVEL = 55;
const DEMO_XP_TARGET = totalXpRequiredForLevel(DEMO_LEVEL) + 350;
const WEEKLY_GOAL = 5;

type Arguments = {
  authUserId?: string;
  confirm: boolean;
  dryRun: boolean;
  email?: string;
  reset: boolean;
};

type DayDefinition = {
  exercises: Array<{ key: string; repRange: [number, number]; sets: number }>;
  name: string;
  program: "Push Pull Legs" | "Upper Lower";
};

type SessionPlan = {
  completedAt: Date;
  day: DayDefinition;
  index: number;
  setCount: number;
};

const days: DayDefinition[] = [
  {
    program: "Push Pull Legs",
    name: "Push",
    exercises: [
      { key: "barbell-bench-press", sets: 4, repRange: [5, 8] },
      { key: "incline-dumbbell-press", sets: 3, repRange: [8, 12] },
      { key: "overhead-press", sets: 3, repRange: [6, 10] },
    ],
  },
  {
    program: "Push Pull Legs",
    name: "Pull",
    exercises: [
      { key: "weighted-pull-up", sets: 4, repRange: [5, 8] },
      { key: "barbell-row", sets: 4, repRange: [6, 10] },
      { key: "lat-pulldown", sets: 3, repRange: [8, 12] },
    ],
  },
  {
    program: "Push Pull Legs",
    name: "Legs",
    exercises: [
      { key: "back-squat", sets: 4, repRange: [5, 8] },
      { key: "romanian-deadlift", sets: 3, repRange: [6, 10] },
      { key: "leg-press", sets: 3, repRange: [10, 15] },
    ],
  },
  {
    program: "Upper Lower",
    name: "Upper",
    exercises: [
      { key: "barbell-bench-press", sets: 3, repRange: [6, 10] },
      { key: "weighted-pull-up", sets: 3, repRange: [6, 10] },
      { key: "overhead-press", sets: 3, repRange: [8, 10] },
      { key: "barbell-row", sets: 3, repRange: [8, 12] },
    ],
  },
  {
    program: "Upper Lower",
    name: "Lower",
    exercises: [
      { key: "conventional-deadlift", sets: 3, repRange: [3, 6] },
      { key: "back-squat", sets: 3, repRange: [6, 10] },
      { key: "leg-curl", sets: 3, repRange: [10, 15] },
    ],
  },
];

const prTargets: Record<string, number> = {
  "barbell-bench-press": 120,
  "back-squat": 170,
  "barbell-row": 110,
  "conventional-deadlift": 210,
  "overhead-press": 75,
  "weighted-pull-up": 35,
};

function usage() {
  return [
    "Usage: npm run seed:demo -- --auth-user-id <supabase-auth-user-id> --confirm [--dry-run] [--reset]",
    "   or: npm run seed:demo -- --email <email> --confirm [--dry-run] [--reset]",
    "Environment alternatives: DEMO_AUTH_USER_ID or DEMO_USER_EMAIL.",
  ].join("\n");
}

function parseArguments(argv: string[]): Arguments {
  const values: Arguments = { confirm: false, dryRun: false, reset: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") {
      console.log(usage());
      process.exit(0);
    }
    if (argument === "--confirm") values.confirm = true;
    else if (argument === "--dry-run") values.dryRun = true;
    else if (argument === "--reset") values.reset = true;
    else if (argument === "--email") values.email = argv[++index];
    else if (argument === "--auth-user-id") values.authUserId = argv[++index];
    else throw new Error(`Unknown argument: ${argument}`);
  }
  values.email ??= process.env.DEMO_USER_EMAIL;
  values.authUserId ??= process.env.DEMO_AUTH_USER_ID;
  if (Boolean(values.email) === Boolean(values.authUserId)) {
    throw new Error("Provide exactly one target: --email or --auth-user-id.");
  }
  if (!values.confirm && !values.dryRun) {
    throw new Error(
      "Refusing to write demo data without --confirm. Use --dry-run first.",
    );
  }
  return values;
}

function startOfUtcWeek(value: Date) {
  const date = new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date;
}

function atUtc(weekStart: Date, dayOffset: number, hour: number) {
  const date = new Date(weekStart);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  date.setUTCHours(hour, 15, 0, 0);
  return date;
}

function buildPlans(now = new Date()) {
  const currentWeek = startOfUtcWeek(now);
  const plans: SessionPlan[] = [];
  let index = 0;
  const addWeek = (weekOffset: number, dayOffsets: number[]) => {
    const week = new Date(currentWeek);
    week.setUTCDate(week.getUTCDate() + weekOffset * 7);
    dayOffsets.forEach((dayOffset, sessionInWeek) => {
      plans.push({
        completedAt: atUtc(week, dayOffset, 6 + ((index + sessionInWeek) % 3)),
        day: days[index % days.length],
        index,
        setCount: 10 + (index % 4),
      });
      index += 1;
    });
  };

  // Earlier work builds credible total XP. A deliberately incomplete week resets
  // the visible streak before the final ten successful weeks.
  for (let week = -24; week <= -13; week += 1) addWeek(week, [0, 1, 3, 4, 5]);
  addWeek(-12, [2]);
  for (let week = -11; week <= -2; week += 1) addWeek(week, [0, 1, 3, 4, 5]);

  const weekday = Math.max(
    0,
    Math.min(6, now.getUTCDay() === 0 ? 6 : now.getUTCDay() - 1),
  );
  const currentOffsets =
    weekday >= 2 ? [0, Math.floor(weekday / 2), weekday] : [0, 0, weekday];
  addWeek(0, currentOffsets);
  return plans.sort(
    (first, second) => first.completedAt.getTime() - second.completedAt.getTime(),
  );
}

function calculatePlansXp(plans: SessionPlan[]) {
  const completedDates: Date[] = [];
  let totalXp = 0;
  for (const plan of plans) {
    const priorInWeek = completedDates.filter(
      (date) =>
        startOfUtcWeek(date).getTime() === startOfUtcWeek(plan.completedAt).getTime(),
    ).length;
    const streak = getWeeklyGoalStreaksFromDates(
      [...completedDates, plan.completedAt],
      WEEKLY_GOAL,
      plan.completedAt,
    ).current;
    const bonus =
      priorInWeek < WEEKLY_GOAL && priorInWeek + 1 >= WEEKLY_GOAL
        ? WEEKLY_GOAL_BONUS_XP
        : 0;
    totalXp += calculateEarnedXp(
      calculateBaseXp(plan.setCount),
      getStreakMultiplier(streak),
      bonus,
    );
    completedDates.push(plan.completedAt);
  }
  return totalXp;
}

function tunePlans(plans: SessionPlan[], existingXp: number) {
  let totalXp = calculatePlansXp(plans) + existingXp;
  let cursor = plans.length - 1;
  while (totalXp < DEMO_XP_TARGET && cursor >= 0) {
    if (plans[cursor].setCount < 16) {
      plans[cursor].setCount += 1;
      totalXp = calculatePlansXp(plans) + existingXp;
    }
    cursor -= 1;
    if (cursor < 0 && totalXp < DEMO_XP_TARGET) cursor = plans.length - 1;
  }
  if (totalXp >= totalXpRequiredForLevel(DEMO_LEVEL + 1)) {
    throw new Error(
      "Existing data prevents an approximately Level 55 demo. Use a dedicated showcase account.",
    );
  }
  return totalXp;
}

async function findTargetUser(prisma: PrismaClient, args: Arguments) {
  let authUserId = args.authUserId;
  if (args.email) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) {
      throw new Error(
        "Email targeting requires NEXT_PUBLIC_SUPABASE_URL and server-only SUPABASE_SERVICE_ROLE_KEY.",
      );
    }
    const supabase = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    let page = 1;
    while (!authUserId) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page,
        perPage: 1000,
      });
      if (error)
        throw new Error("Unable to look up the requested Supabase user by email.");
      authUserId = data.users.find(
        (user) => user.email?.toLowerCase() === args.email!.toLowerCase(),
      )?.id;
      if (!data.users.length || data.users.length < 1000) break;
      page += 1;
    }
    if (!authUserId)
      throw new Error("No Supabase Auth user matches the supplied email.");
  }
  const user = await prisma.user.findUnique({ where: { authUserId } });
  if (!user)
    throw new Error(
      "The target has no GymFlow User record. Sign in once before seeding.",
    );
  return user;
}

function distributeSets(day: DayDefinition, totalSets: number) {
  const counts = day.exercises.map((exercise) => exercise.sets);
  let remaining = Math.max(
    0,
    totalSets - counts.reduce((total, count) => total + count, 0),
  );
  for (let index = 0; remaining; index = (index + 1) % counts.length) {
    counts[index] += 1;
    remaining -= 1;
  }
  return counts;
}

function workingWeight(key: string, sessionIndex: number, setIndex: number) {
  const target =
    prTargets[key] ??
    {
      "incline-dumbbell-press": 36,
      "lat-pulldown": 75,
      "leg-curl": 55,
      "leg-press": 220,
      "romanian-deadlift": 135,
    }[key] ??
    40;
  const variation = ((sessionIndex * 7 + setIndex * 3) % 9) / 100;
  return Math.round(target * (0.72 + variation) * 2) / 2;
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL must be configured.");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const user = await findTargetUser(prisma, args);
    if (!args.reset) {
      const [nonDemoSessions, nonDemoPrograms, customExercises, nonDemoRecords] =
        await Promise.all([
          prisma.workoutSession.count({
            where: {
              userId: user.id,
              OR: [
                { clientReference: null },
                { clientReference: { not: { startsWith: DEMO_PREFIX } } },
              ],
            },
          }),
          prisma.workoutProgram.count({
            where: { userId: user.id, NOT: { description: DEMO_DESCRIPTION } },
          }),
          prisma.exercise.count({ where: { userId: user.id, isSystem: false } }),
          prisma.personalRecord.count({
            where: {
              userId: user.id,
              NOT: { workoutSession: { clientReference: { startsWith: DEMO_PREFIX } } },
            },
          }),
        ]);
      if (nonDemoSessions || nonDemoPrograms || customExercises || nonDemoRecords) {
        throw new Error(
          "Target contains non-demo training data. Use a dedicated showcase account to avoid altering it.",
        );
      }
    }
    const plans = args.reset ? [] : buildPlans();
    let projectedXp = 0;
    let projectedLevel = 0;
    let targetTrophies: ReturnType<typeof getEligibleTrophies> = [];
    if (!args.reset) {
      const existing = await prisma.workoutSession.aggregate({
        where: {
          userId: user.id,
          status: "COMPLETED",
          clientReference: { not: { startsWith: DEMO_PREFIX } },
        },
        _sum: { earnedXp: true },
      });
      const existingXp = existing._sum.earnedXp ?? 0;
      if (existingXp >= totalXpRequiredForLevel(DEMO_LEVEL + 1)) {
        throw new Error(
          "Target already exceeds the Level 55 demo range. Use a dedicated showcase account.",
        );
      }
      projectedXp = tunePlans(plans, existingXp);
      projectedLevel = getLevelProgress(projectedXp).current;
      targetTrophies = getEligibleTrophies(projectedLevel);
    }
    const existingDemoSessions = await prisma.workoutSession.count({
      where: { userId: user.id, clientReference: { startsWith: DEMO_PREFIX } },
    });
    console.log(
      `Target: ${args.email ? "email-selected user" : "auth-user-id-selected user"}`,
    );
    console.log(`Mode: ${args.dryRun ? "dry run" : args.reset ? "reset" : "seed"}`);
    if (!args.reset) {
      console.log(
        `Planned sessions: ${plans.length}; projected level: ${projectedLevel}; projected XP: ${projectedXp}`,
      );
    }
    console.log(`Managed demo sessions currently present: ${existingDemoSessions}`);
    if (args.dryRun) return;

    await prisma.$transaction(async (tx) => {
      await tx.workoutSession.deleteMany({
        where: { userId: user.id, clientReference: { startsWith: DEMO_PREFIX } },
      });
      await tx.workoutProgram.deleteMany({
        where: { userId: user.id, description: DEMO_DESCRIPTION },
      });
      if (args.reset) return;

      const exerciseKeys = [
        ...new Set(
          days.flatMap((day) => day.exercises.map((exercise) => exercise.key)),
        ),
      ];
      const exercises = await tx.exercise.findMany({
        where: { isSystem: true, systemKey: { in: exerciseKeys } },
        select: { id: true, name: true, muscleGroup: true, systemKey: true },
      });
      const exerciseByKey = new Map(
        exercises.map((exercise) => [exercise.systemKey!, exercise]),
      );
      if (exerciseByKey.size !== exerciseKeys.length) {
        throw new Error(
          "Required system exercises are missing. Run npm run prisma:seed first.",
        );
      }

      await tx.user.update({
        where: { id: user.id },
        data: {
          displayName: "GymFlow Demo",
          weeklyWorkoutGoal: WEEKLY_GOAL,
          preferredWeightUnit: WeightUnit.KG,
        },
      });
      const programs = new Map<
        string,
        {
          id: string;
          days: Map<string, { id: string; exercises: Map<string, string> }>;
        }
      >();
      for (const programName of ["Push Pull Legs", "Upper Lower"] as const) {
        const programDays = days.filter((day) => day.program === programName);
        const program = await tx.workoutProgram.create({
          data: {
            userId: user.id,
            name: programName,
            description: DEMO_DESCRIPTION,
            days: {
              create: programDays.map((day, position) => ({
                name: day.name,
                position,
                exercises: {
                  create: day.exercises.map((exercise, exercisePosition) => ({
                    exerciseId: exerciseByKey.get(exercise.key)!.id,
                    position: exercisePosition,
                    targetSets: exercise.sets,
                    targetRepMin: exercise.repRange[0],
                    targetRepMax: exercise.repRange[1],
                  })),
                },
              })),
            },
          },
          include: { days: { include: { exercises: true } } },
        });
        programs.set(programName, {
          id: program.id,
          days: new Map(
            program.days.map((day) => [
              day.name,
              {
                id: day.id,
                exercises: new Map(
                  day.exercises.map((link) => [link.exerciseId, link.id]),
                ),
              },
            ]),
          ),
        });
      }

      const prSessions = new Map<
        string,
        { sessionId: string; sessionExerciseId: string; achievedAt: Date }
      >();
      for (const plan of plans) {
        const program = programs.get(plan.day.program)!;
        const day = program.days.get(plan.day.name)!;
        const completedBefore = plans
          .filter((other) => other.completedAt < plan.completedAt)
          .map((other) => other.completedAt);
        const priorInWeek = completedBefore.filter(
          (date) =>
            startOfUtcWeek(date).getTime() ===
            startOfUtcWeek(plan.completedAt).getTime(),
        ).length;
        const multiplier = getStreakMultiplier(
          getWeeklyGoalStreaksFromDates(
            [...completedBefore, plan.completedAt],
            WEEKLY_GOAL,
            plan.completedAt,
          ).current,
        );
        const goalBonusXp =
          priorInWeek < WEEKLY_GOAL && priorInWeek + 1 >= WEEKLY_GOAL
            ? WEEKLY_GOAL_BONUS_XP
            : 0;
        const durationSeconds = 3300 + ((plan.index * 293) % 2100);
        const setCounts = distributeSets(plan.day, plan.setCount);
        const session = await tx.workoutSession.create({
          data: {
            clientReference: `${DEMO_PREFIX}${plan.index}`,
            userId: user.id,
            sourceProgramId: program.id,
            sourceWorkoutDayId: day.id,
            programName: plan.day.program,
            workoutDayName: plan.day.name,
            status: "COMPLETED",
            startedAt: new Date(plan.completedAt.getTime() - durationSeconds * 1000),
            completedAt: plan.completedAt,
            durationSeconds,
            baseXp: calculateBaseXp(plan.setCount),
            streakMultiplier: multiplier,
            goalBonusXp,
            earnedXp: calculateEarnedXp(
              calculateBaseXp(plan.setCount),
              multiplier,
              goalBonusXp,
            ),
            exercises: {
              create: plan.day.exercises.map((exercise, exercisePosition) => {
                const sourceExercise = exerciseByKey.get(exercise.key)!;
                return {
                  sourceDayExerciseId: day.exercises.get(sourceExercise.id),
                  sourceExerciseId: sourceExercise.id,
                  exerciseName: sourceExercise.name,
                  targetSets: exercise.sets,
                  targetRepMin: exercise.repRange[0],
                  targetRepMax: exercise.repRange[1],
                  position: exercisePosition,
                  sets: {
                    create: Array.from(
                      { length: setCounts[exercisePosition] },
                      (_, setIndex) => ({
                        position: setIndex,
                        weightKg: workingWeight(exercise.key, plan.index, setIndex),
                        reps:
                          exercise.repRange[0] +
                          ((plan.index + setIndex) %
                            (exercise.repRange[1] - exercise.repRange[0] + 1)),
                        isCompleted: true,
                      }),
                    ),
                  },
                };
              }),
            },
          },
          include: { exercises: true },
        });
        for (const exercise of session.exercises) {
          const key = [...exerciseByKey.entries()].find(
            ([, value]) => value.id === exercise.sourceExerciseId,
          )?.[0];
          if (key && key in prTargets)
            prSessions.set(key, {
              sessionId: session.id,
              sessionExerciseId: exercise.id,
              achievedAt: plan.completedAt,
            });
        }
      }

      for (const [key, targetWeight] of Object.entries(prTargets)) {
        const record = prSessions.get(key);
        const exercise = exerciseByKey.get(key)!;
        if (!record) continue;
        const topSet = await tx.workoutSet.findFirstOrThrow({
          where: { workoutSessionExerciseId: record.sessionExerciseId },
          orderBy: { position: "desc" },
        });
        await tx.workoutSet.update({
          where: { id: topSet.id },
          data: {
            weightKg: targetWeight,
            reps: key === "conventional-deadlift" ? 3 : 5,
          },
        });
        await tx.personalRecord.upsert({
          where: { userId_exerciseId: { userId: user.id, exerciseId: exercise.id } },
          update: {
            currentWeight: targetWeight,
            previousWeight: Math.round((targetWeight - 5) * 2) / 2,
            workoutSessionId: record.sessionId,
            achievedAt: record.achievedAt,
          },
          create: {
            userId: user.id,
            exerciseId: exercise.id,
            currentWeight: targetWeight,
            previousWeight: Math.round((targetWeight - 5) * 2) / 2,
            workoutSessionId: record.sessionId,
            achievedAt: record.achievedAt,
          },
        });
      }
      await tx.userTrophy.createMany({
        data: targetTrophies.map((trophy) => ({
          userId: user.id,
          trophyKey: trophy.key,
        })),
        skipDuplicates: true,
      });
    });
    console.log(
      args.reset
        ? "Demo-managed programs and sessions removed."
        : `Demo data created: ${plans.length} sessions, 2 programs, 5 workout days, ${targetTrophies.length} trophies, and ${Object.keys(prTargets).length} personal records.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(() => {
  console.error("Demo seed failed safely. Check target selection and configuration.");
  process.exitCode = 1;
});
