import type {
  DashboardWorkoutRecord,
  DashboardWorkoutSet,
  WeeklyActivityDay,
} from "@/features/dashboard/types";

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const XP_PER_LEVEL = 500;

export const DASHBOARD_TIME_ZONE = "UTC";

function asDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function startOfUtcDay(value: Date | string) {
  const date = asDate(value);
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function getUtcDayKey(value: Date | string) {
  return startOfUtcDay(value).toISOString().slice(0, 10);
}

export function getStartOfUtcWeek(value: Date | string) {
  const date = startOfUtcDay(value);
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - mondayOffset);
  return date;
}

export function getCompletedSets(sets: DashboardWorkoutSet[]) {
  return sets.filter((set) => set.isCompleted);
}

export function getWorkoutVolume(sets: DashboardWorkoutSet[]) {
  const volume = getCompletedSets(sets).reduce(
    (total, set) => total + (set.weightKg ?? 0) * (set.reps ?? 0),
    0,
  );
  return Math.round(volume * 100) / 100;
}

export function getWeeklyActivity(
  workouts: DashboardWorkoutRecord[],
  now: Date,
): WeeklyActivityDay[] {
  const weekStart = getStartOfUtcWeek(now);
  const activityByDay = new Map<string, WeeklyActivityDay>();

  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(weekStart.getTime() + offset * DAY_IN_MILLISECONDS);
    const key = getUtcDayKey(date);
    activityByDay.set(key, {
      date: key,
      dayLabel: new Intl.DateTimeFormat("en", {
        timeZone: DASHBOARD_TIME_ZONE,
        weekday: "short",
      }).format(date),
      completedWorkouts: 0,
      totalVolume: 0,
    });
  }

  for (const workout of workouts) {
    const activity = activityByDay.get(getUtcDayKey(workout.completedAt));
    if (!activity) continue;
    activity.completedWorkouts += 1;
    activity.totalVolume += getWorkoutVolume(workout.sets);
  }

  return [...activityByDay.values()].map((activity) => ({
    ...activity,
    totalVolume: Math.round(activity.totalVolume * 100) / 100,
  }));
}

export function getDailyStreaks(workouts: DashboardWorkoutRecord[], now: Date) {
  const today = startOfUtcDay(now);
  const uniqueDays = [
    ...new Set(workouts.map((workout) => getUtcDayKey(workout.completedAt))),
  ]
    .map((day) => new Date(`${day}T00:00:00.000Z`))
    .filter((day) => day <= today)
    .sort((first, second) => second.getTime() - first.getTime());

  let personalBest = 0;
  let run = 0;
  let previousDay: Date | undefined;
  for (const day of uniqueDays) {
    run =
      previousDay && previousDay.getTime() - day.getTime() === DAY_IN_MILLISECONDS
        ? run + 1
        : 1;
    personalBest = Math.max(personalBest, run);
    previousDay = day;
  }

  const todayKey = getUtcDayKey(today);
  const yesterdayKey = getUtcDayKey(new Date(today.getTime() - DAY_IN_MILLISECONDS));
  const currentStart = uniqueDays.find(
    (day) => getUtcDayKey(day) === todayKey || getUtcDayKey(day) === yesterdayKey,
  );
  let current = 0;
  let expectedDay = currentStart;
  const uniqueDayKeys = new Set(uniqueDays.map(getUtcDayKey));
  while (expectedDay && uniqueDayKeys.has(getUtcDayKey(expectedDay))) {
    current += 1;
    expectedDay = new Date(expectedDay.getTime() - DAY_IN_MILLISECONDS);
  }

  return { current, personalBest };
}

export function getWeeklyGoalStreaks(
  workouts: DashboardWorkoutRecord[],
  weeklyWorkoutGoal: number,
  now: Date,
) {
  const currentWeek = getStartOfUtcWeek(now);
  const completedWorkoutsByWeek = new Map<string, number>();

  for (const workout of workouts) {
    const week = getStartOfUtcWeek(workout.completedAt);
    if (week > currentWeek) continue;
    const key = week.toISOString();
    completedWorkoutsByWeek.set(key, (completedWorkoutsByWeek.get(key) ?? 0) + 1);
  }

  function isSuccessfulWeek(week: Date) {
    return (completedWorkoutsByWeek.get(week.toISOString()) ?? 0) >= weeklyWorkoutGoal;
  }

  let completedWeekStreak = 0;
  let previousWeek = new Date(currentWeek.getTime() - 7 * DAY_IN_MILLISECONDS);
  while (isSuccessfulWeek(previousWeek)) {
    completedWeekStreak += 1;
    previousWeek = new Date(previousWeek.getTime() - 7 * DAY_IN_MILLISECONDS);
  }

  const currentWeekSuccessful = isSuccessfulWeek(currentWeek);
  const current = currentWeekSuccessful ? completedWeekStreak + 1 : completedWeekStreak;

  const completedWeeks = [...completedWorkoutsByWeek.keys()]
    .map((key) => new Date(key))
    .sort((first, second) => first.getTime() - second.getTime());
  if (!completedWeeks.length) return { current, personalBest: 0 };

  let personalBest = 0;
  let run = 0;
  let week = completedWeeks[0];
  while (week <= currentWeek) {
    run = isSuccessfulWeek(week) ? run + 1 : 0;
    personalBest = Math.max(personalBest, run);
    week = new Date(week.getTime() + 7 * DAY_IN_MILLISECONDS);
  }

  return { current, personalBest };
}

export function getWeeklyGoalStreaksFromDates(
  completedAt: Date[],
  weeklyWorkoutGoal: number,
  now: Date,
) {
  return getWeeklyGoalStreaks(
    completedAt.map((date, index) => ({
      completedAt: date,
      durationSeconds: 0,
      earnedXp: 0,
      id: String(index),
      programName: "",
      sets: [],
      workoutDayName: "",
    })),
    weeklyWorkoutGoal,
    now,
  );
}

export function getXpProgress(
  workouts: DashboardWorkoutRecord[],
  personalBestStreak: number,
) {
  const completedSets = workouts.reduce(
    (total, workout) => total + getCompletedSets(workout.sets).length,
    0,
  );
  const totalVolume = workouts.reduce(
    (total, workout) => total + getWorkoutVolume(workout.sets),
    0,
  );
  const totalXp =
    workouts.length * 100 +
    completedSets * 15 +
    Math.floor(totalVolume / 1000) * 5 +
    Math.floor(personalBestStreak / 7) * 50;
  const progressXp = totalXp % XP_PER_LEVEL;

  return {
    current: Math.floor(totalXp / XP_PER_LEVEL) + 1,
    progressPercent: (progressXp / XP_PER_LEVEL) * 100,
    progressXp,
    totalXp,
    xpToNextLevel: XP_PER_LEVEL,
  };
}
