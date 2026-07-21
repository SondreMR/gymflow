import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";

import { PrismaClient, WeightUnit } from "../src/generated/prisma/client";
import { getWeeklyGoalStreaksFromDates } from "../src/features/dashboard/dashboard-utils";
import {
  DEMO_SYSTEM_EXERCISE_KEYS,
  resolveDemoSystemExercises,
} from "../src/lib/system-exercises";
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
const MAX_SETS_PER_SESSION = 24;

function redactSensitiveText(value: string) {
  return value
    .replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, "[REDACTED_DATABASE_URL]")
    .replace(/(SUPABASE_SERVICE_ROLE_KEY\s*[=:]\s*)\S+/gi, "$1[REDACTED]")
    .replace(
      /\b(?:sb_(?:secret|publishable)_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9._-]+)\b/g,
      "[REDACTED_TOKEN]",
    )
    .replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]");
}

function diagnosticError(message: string) {
  return new Error(message);
}

type Arguments = {
  authUserId?: string;
  authUserIdFromArgument: boolean;
  confirm: boolean;
  dryRun: boolean;
  email?: string;
  replaceExistingTarget: boolean;
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
      { key: "lying-leg-curl", sets: 3, repRange: [10, 15] },
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
    "Takeover: npm run seed:demo -- --auth-user-id <supabase-auth-user-id> --replace-existing-target --confirm",
    "Environment alternatives: DEMO_AUTH_USER_ID or DEMO_USER_EMAIL.",
  ].join("\n");
}

function parseArguments(argv: string[]): Arguments {
  const values: Arguments = {
    authUserIdFromArgument: false,
    confirm: false,
    dryRun: false,
    replaceExistingTarget: false,
    reset: false,
  };
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
    else if (argument === "--auth-user-id") {
      values.authUserId = argv[++index];
      values.authUserIdFromArgument = true;
    } else if (argument === "--replace-existing-target") {
      values.replaceExistingTarget = true;
    } else throw new Error(`Unknown argument: ${argument}`);
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
  if (values.replaceExistingTarget) {
    if (values.email || !values.authUserIdFromArgument || !values.authUserId) {
      throw new Error(
        "Takeover requires exactly one explicit --auth-user-id and cannot use --email.",
      );
    }
    if (values.reset) {
      throw new Error("Use either --reset or --replace-existing-target, not both.");
    }
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

export function buildPlans(now = new Date()) {
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
  for (let week = -24; week <= -14; week += 1) addWeek(week, [0, 1, 3, 4, 5]);
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

export function calculatePlansXp(plans: SessionPlan[]) {
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

export function getSeedStartingXp({
  existingXp,
  replaceExistingTarget,
}: {
  existingXp: number;
  replaceExistingTarget: boolean;
}) {
  // Takeover deletes all target-owned workout history in the same transaction
  // that creates the showcase data, so its projection starts from zero XP.
  return replaceExistingTarget ? 0 : existingXp;
}

export function tunePlans(plans: SessionPlan[], startingXp: number) {
  let totalXp = calculatePlansXp(plans) + startingXp;
  let cursor = plans.length - 1;
  while (totalXp < DEMO_XP_TARGET && cursor >= 0) {
    if (plans[cursor].setCount < MAX_SETS_PER_SESSION) {
      plans[cursor].setCount += 1;
      totalXp = calculatePlansXp(plans) + startingXp;
    }
    cursor -= 1;
    if (cursor < 0 && totalXp < DEMO_XP_TARGET) cursor = plans.length - 1;
  }
  if (totalXp < DEMO_XP_TARGET) {
    throw new Error(
      "The planned showcase history cannot reach the Level 55 XP target within its configured session limit.",
    );
  }
  if (totalXp >= totalXpRequiredForLevel(DEMO_LEVEL + 1)) {
    throw new Error(
      "The planned showcase history exceeds the Level 55 range. Adjust the demo plan before seeding.",
    );
  }
  return totalXp;
}

export function createDemoProjection({
  existingXp = 0,
  now,
  replaceExistingTarget = false,
}: {
  existingXp?: number;
  now?: Date;
  replaceExistingTarget?: boolean;
} = {}) {
  const plans = buildPlans(now);
  const projectedXp = tunePlans(
    plans,
    getSeedStartingXp({ existingXp, replaceExistingTarget }),
  );
  const projectedLevel = getLevelProgress(projectedXp).current;
  const completedDates = plans.map((plan) => plan.completedAt);
  const streakWeeks = getWeeklyGoalStreaksFromDates(
    completedDates,
    WEEKLY_GOAL,
    now ?? new Date(),
  ).current;
  return {
    plans,
    projectedLevel,
    projectedXp,
    streakMultiplier: getStreakMultiplier(streakWeeks),
    streakWeeks,
    targetTrophies: getEligibleTrophies(projectedLevel),
  };
}

export function assertSafeDefaultSeedTarget({
  customExercises,
  nonDemoPrograms,
  nonDemoRecords,
  nonDemoSessions,
}: {
  customExercises: number;
  nonDemoPrograms: number;
  nonDemoRecords: number;
  nonDemoSessions: number;
}) {
  if (!nonDemoSessions && !nonDemoPrograms && !customExercises && !nonDemoRecords) {
    return;
  }
  throw diagnosticError(
    [
      "Target validation failed: non-demo data exists; safe default seeding is refusing takeover.",
      `Non-demo workout sessions: ${nonDemoSessions}`,
      `Non-demo programs: ${nonDemoPrograms}`,
      `Private custom exercises: ${customExercises}`,
      `Personal records not linked to managed demo sessions: ${nonDemoRecords}`,
      "To intentionally replace this exact test account, use --replace-existing-target with an explicit --auth-user-id and --confirm.",
    ].join("\n"),
  );
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
  if (!authUserId) {
    throw diagnosticError(
      "Target validation failed: no Supabase Auth user ID was resolved.",
    );
  }
  const [users, supabaseIdentity] = await Promise.all([
    prisma.user.findMany({ where: { authUserId } }),
    inspectSupabaseIdentity(authUserId),
  ]);
  if (users.length !== 1) {
    throw diagnosticError(
      [
        "Target validation failed: Prisma user mapping.",
        `Auth user ID received: ${authUserId}`,
        `Supabase identity: ${supabaseIdentity}`,
        `Prisma user mapping count: ${users.length}`,
      ].join("\n"),
    );
  }
  return users[0];
}

async function inspectSupabaseIdentity(authUserId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return "not checked (SUPABASE_SERVICE_ROLE_KEY is not configured)";
  }
  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase.auth.admin.getUserById(authUserId);
  if (data.user) return "found";
  if (error?.status === 404) return "not found";
  return `lookup unavailable${error?.status ? ` (HTTP ${error.status})` : ""}`;
}

async function getTargetDataSummary(prisma: PrismaClient, userId: string) {
  const [
    personalRecords,
    programs,
    sessionExercises,
    sessions,
    sets,
    trophies,
    workoutDayExercises,
    workoutDays,
    customExercises,
  ] = await Promise.all([
    prisma.personalRecord.count({ where: { userId } }),
    prisma.workoutProgram.count({ where: { userId } }),
    prisma.workoutSessionExercise.count({ where: { workoutSession: { userId } } }),
    prisma.workoutSession.count({ where: { userId } }),
    prisma.workoutSet.count({
      where: { workoutSessionExercise: { workoutSession: { userId } } },
    }),
    prisma.userTrophy.count({ where: { userId } }),
    prisma.workoutDayExercise.count({ where: { workoutDay: { program: { userId } } } }),
    prisma.workoutDay.count({ where: { program: { userId } } }),
    prisma.exercise.count({ where: { userId, isSystem: false } }),
  ]);
  return {
    customExercises,
    personalRecords,
    programs,
    sessionExercises,
    sessions,
    sets,
    trophies,
    workoutDayExercises,
    workoutDays,
  };
}

type TargetDataTransaction = Pick<
  PrismaClient,
  "exercise" | "personalRecord" | "userTrophy" | "workoutProgram" | "workoutSession"
>;

export async function removeTargetApplicationData(
  tx: TargetDataTransaction,
  userId: string,
) {
  // The schema's cascading relations remove nested sets, session exercises,
  // workout-day exercises, and workout days. Every predicate is pinned to the
  // selected GymFlow user; system exercises have no user ID and are untouched.
  await tx.personalRecord.deleteMany({ where: { userId } });
  await tx.userTrophy.deleteMany({ where: { userId } });
  await tx.workoutSession.deleteMany({ where: { userId } });
  await tx.workoutProgram.deleteMany({ where: { userId } });
  await tx.exercise.deleteMany({ where: { userId, isSystem: false } });
}

export async function runTakeoverCleanup({
  dryRun,
  tx,
  userId,
}: {
  dryRun: boolean;
  tx: TargetDataTransaction;
  userId: string;
}) {
  if (dryRun) return false;
  await removeTargetApplicationData(tx, userId);
  return true;
}

async function resolveRequiredSystemExercises(client: Pick<PrismaClient, "exercise">) {
  const exercises = await client.exercise.findMany({
    where: { systemKey: { in: [...DEMO_SYSTEM_EXERCISE_KEYS] } },
    select: {
      id: true,
      isSystem: true,
      muscleGroup: true,
      name: true,
      systemKey: true,
      userId: true,
    },
  });
  const resolution = resolveDemoSystemExercises(exercises);
  if (!resolution.isComplete) {
    const diagnosticList = resolution.diagnostics
      .filter(({ failedCriterion }) => failedCriterion)
      .map(
        ({ expectedIdentifier, matchingExerciseExists, failedCriterion }) =>
          `- expected exercise identifier: ${expectedIdentifier}; matching exercise exists: ${matchingExerciseExists}; failed criterion: ${failedCriterion}`,
      )
      .join("\n");
    throw new Error(
      `Required global system exercises could not be resolved.\n${diagnosticList}\nRun npm run prisma:seed and retry.`,
    );
  }
  return new Map(
    exercises
      .filter((exercise) => exercise.isSystem && exercise.userId === null)
      .map((exercise) => [exercise.systemKey!, exercise]),
  );
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
      "lying-leg-curl": 55,
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
    if (!args.reset && !args.replaceExistingTarget) {
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
      assertSafeDefaultSeedTarget({
        customExercises,
        nonDemoPrograms,
        nonDemoRecords,
        nonDemoSessions,
      });
    }
    let plans: SessionPlan[] = [];
    let projectedXp = 0;
    let projectedLevel = 0;
    let projectedStreakMultiplier = 1;
    let projectedStreakWeeks = 0;
    let targetTrophies: ReturnType<typeof getEligibleTrophies> = [];
    if (!args.reset) {
      const existingXp =
        (
          await prisma.workoutSession.aggregate({
            where: {
              userId: user.id,
              status: "COMPLETED",
              clientReference: { not: { startsWith: DEMO_PREFIX } },
            },
            _sum: { earnedXp: true },
          })
        )._sum.earnedXp ?? 0;
      const startingXp = getSeedStartingXp({
        existingXp,
        replaceExistingTarget: args.replaceExistingTarget,
      });
      if (startingXp >= totalXpRequiredForLevel(DEMO_LEVEL + 1)) {
        throw new Error(
          "Target already exceeds the Level 55 demo range. Use a dedicated showcase account.",
        );
      }
      const projection = createDemoProjection({
        existingXp,
        replaceExistingTarget: args.replaceExistingTarget,
      });
      plans = projection.plans;
      projectedXp = projection.projectedXp;
      projectedLevel = projection.projectedLevel;
      projectedStreakMultiplier = projection.streakMultiplier;
      projectedStreakWeeks = projection.streakWeeks;
      targetTrophies = projection.targetTrophies;
      // Resolve before the dry-run return and before any takeover cleanup so a
      // failed catalog reports only safe identifiers without writing data.
      await resolveRequiredSystemExercises(prisma);
    }
    const existingDemoSessions = await prisma.workoutSession.count({
      where: { userId: user.id, clientReference: { startsWith: DEMO_PREFIX } },
    });
    console.log(
      `Target: ${args.email ? "email-selected user" : "auth-user-id-selected user"}`,
    );
    console.log(
      `Mode: ${args.dryRun ? "dry run" : args.reset ? "reset" : args.replaceExistingTarget ? "replace existing target" : "seed"}`,
    );
    if (args.replaceExistingTarget) {
      const summary = await getTargetDataSummary(prisma, user.id);
      console.log(
        `Target-owned data to remove: ${summary.sessions} sessions, ${summary.sessionExercises} session exercises, ${summary.sets} sets, ${summary.programs} programs, ${summary.workoutDays} workout days, ${summary.workoutDayExercises} day exercises, ${summary.customExercises} custom exercises, ${summary.personalRecords} personal records, ${summary.trophies} trophies.`,
      );
      console.log(
        "Global system exercises and Supabase Auth identities are preserved.",
      );
    }
    if (!args.reset) {
      console.log(
        `Planned data: 2 programs, ${plans.length} sessions, ${Object.keys(prTargets).length} PRs, ${targetTrophies.length} trophies; projected level: ${projectedLevel}; projected XP: ${projectedXp}; streak: ${projectedStreakWeeks} weeks; multiplier: ${projectedStreakMultiplier}x.`,
      );
    }
    console.log(`Managed demo sessions currently present: ${existingDemoSessions}`);
    if (args.dryRun) return;

    await prisma.$transaction(async (tx) => {
      if (args.replaceExistingTarget) {
        await runTakeoverCleanup({ dryRun: false, tx, userId: user.id });
      } else {
        await tx.workoutSession.deleteMany({
          where: { userId: user.id, clientReference: { startsWith: DEMO_PREFIX } },
        });
        await tx.workoutProgram.deleteMany({
          where: { userId: user.id, description: DEMO_DESCRIPTION },
        });
      }
      if (args.reset) return;

      const exerciseByKey = await resolveRequiredSystemExercises(tx);

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

if (process.argv[1]?.endsWith("seed-demo-user.ts")) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown failure.";
    console.error(`Demo seed aborted:\n${redactSensitiveText(message)}`);
    if (
      process.env.NODE_ENV !== "production" &&
      error instanceof Error &&
      error.stack
    ) {
      console.error(`Stack trace:\n${redactSensitiveText(error.stack)}`);
    }
    process.exitCode = 1;
  });
}
