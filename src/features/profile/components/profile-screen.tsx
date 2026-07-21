"use client";

import { CheckCircle2, Pencil, Save, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { updateProfileAction } from "@/features/profile/actions";
import { getInitials } from "@/features/profile/profile-utils";
import type { ProfileData } from "@/features/profile/types";
import { TrophyArt } from "@/features/profile/components/trophy-art";

type ProfileScreenProps = {
  profile: ProfileData;
};

export function ProfileScreen({ profile }: ProfileScreenProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [weeklyWorkoutGoal, setWeeklyWorkoutGoal] = useState(
    String(profile.weeklyWorkoutGoal),
  );
  const [preferredWeightUnit, setPreferredWeightUnit] = useState(
    profile.preferredWeightUnit,
  );
  const [feedback, setFeedback] = useState<{
    message: string;
    type: "error" | "success";
  }>();
  const [isSaving, setIsSaving] = useState(false);
  const initials = getInitials(displayName);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(undefined);
    setIsSaving(true);
    try {
      await updateProfileAction({
        displayName,
        preferredWeightUnit,
        weeklyWorkoutGoal: Number(weeklyWorkoutGoal),
      });
      setFeedback({ message: "Profile settings saved.", type: "success" });
      router.refresh();
    } catch (error) {
      setFeedback({
        message:
          error instanceof Error ? error.message : "Unable to save profile settings.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const statCards = [
    { label: "Goal streak", value: `${profile.currentStreak} weeks` },
    { label: "XP multiplier", value: `${profile.streakMultiplier.toFixed(2)}x` },
    { label: "Total workouts", value: String(profile.totalWorkouts) },
    {
      label: "Completed volume",
      value: `${profile.totalCompletedSetVolume.toLocaleString("en-US", { maximumFractionDigits: 2 })} kg`,
    },
    { label: "Personal records", value: String(profile.totalPersonalRecords) },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="rounded-2xl border border-white/[0.08] bg-[#111217] p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span
              aria-label={`${displayName || "GymFlow Athlete"} avatar`}
              className="grid size-16 shrink-0 place-items-center rounded-full bg-zinc-700 text-lg font-bold text-zinc-100"
            >
              {initials}
            </span>
            <div>
              <p className="text-xs font-bold tracking-[0.13em] text-zinc-500 uppercase">
                Training profile
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-white">
                {profile.displayName}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Level {profile.level.current} ·{" "}
                {profile.level.totalXp.toLocaleString("en-US")} XP
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-white/[0.04] px-4 py-3 text-sm text-zinc-300">
            <span className="font-semibold text-lime-300">
              {profile.currentWeekWorkouts}
            </span>{" "}
            of {profile.weeklyWorkoutGoal} workouts this week
          </div>
        </div>
        {profile.activeTrophy ? (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-lime-300/20 bg-lime-300/[0.05] p-3">
            <TrophyArt compact trophyKey={profile.activeTrophy.key} unlocked />
            <div>
              <p className="text-xs font-bold tracking-[0.13em] text-lime-300 uppercase">
                Active trophy · {profile.activeTrophy.rarity}
              </p>
              <p className="mt-1 font-bold text-white">{profile.activeTrophy.name}</p>
              {profile.nextTrophy ? (
                <p className="mt-1 text-xs text-zinc-500">
                  Next: {profile.nextTrophy.name} at Level {profile.nextTrophy.level}
                </p>
              ) : null}
            </div>
          </div>
        ) : profile.nextTrophy ? (
          <p className="mt-6 text-sm text-zinc-500">
            Reach Level {profile.nextTrophy.level} to earn {profile.nextTrophy.name}.
          </p>
        ) : null}
        <div
          aria-label={`${profile.level.progressXp} of ${profile.level.xpToNextLevel} XP toward the next level`}
          aria-valuemax={profile.level.xpToNextLevel}
          aria-valuemin={0}
          aria-valuenow={profile.level.progressXp}
          className="mt-7 h-1.5 overflow-hidden rounded-full bg-white/[0.08]"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-lime-300"
            style={{ width: `${profile.level.progressPercent}%` }}
          />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map((stat) => (
          <article
            className="rounded-2xl border border-white/[0.08] bg-[#111217] p-5"
            key={stat.label}
          >
            <p className="text-sm text-zinc-500">{stat.label}</p>
            <p className="mt-2 text-xl font-bold tracking-[-0.035em] text-white">
              {stat.value}
            </p>
          </article>
        ))}
      </section>
      <Link
        className="inline-flex text-sm font-semibold text-lime-300"
        href="/profile/achievements"
      >
        View achievements and trophies
      </Link>

      <section className="rounded-2xl border border-white/[0.08] bg-[#111217] p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-white/[0.05] text-lime-300">
            <Pencil aria-hidden="true" size={18} />
          </span>
          <div>
            <h2 className="text-lg font-bold tracking-[-0.03em] text-white">
              Settings
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Your current goal is applied consistently when calculating weekly goal
              streaks.
            </p>
          </div>
        </div>
        <form className="mt-7 grid gap-5 sm:grid-cols-2" onSubmit={saveProfile}>
          <label className="block text-sm font-semibold text-zinc-200">
            Display name
            <input
              className="mt-2 w-full rounded-xl border border-white/[0.1] bg-[#0d0e12] px-3.5 py-3 font-normal text-white outline-none focus:border-lime-300"
              maxLength={80}
              onChange={(event) => setDisplayName(event.target.value)}
              value={displayName}
            />
          </label>
          <label className="block text-sm font-semibold text-zinc-200">
            Weekly workout goal
            <input
              className="mt-2 w-full rounded-xl border border-white/[0.1] bg-[#0d0e12] px-3.5 py-3 font-normal text-white outline-none focus:border-lime-300"
              max={14}
              min={1}
              onChange={(event) => setWeeklyWorkoutGoal(event.target.value)}
              type="number"
              value={weeklyWorkoutGoal}
            />
          </label>
          <label className="block text-sm font-semibold text-zinc-200">
            Preferred weight unit
            <select
              className="mt-2 w-full rounded-xl border border-white/[0.1] bg-[#0d0e12] px-3.5 py-3 font-normal text-white outline-none focus:border-lime-300"
              onChange={(event) =>
                setPreferredWeightUnit(event.target.value as "KG" | "LB")
              }
              value={preferredWeightUnit}
            >
              <option value="KG">Kilograms (kg)</option>
              <option value="LB">Pounds (lb)</option>
            </select>
          </label>
          <div className="sm:col-span-2">
            {feedback ? (
              <p
                className={`mb-4 flex items-center gap-2 text-sm ${feedback.type === "success" ? "text-lime-300" : "text-red-300"}`}
                role="status"
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <Trophy size={16} />
                )}
                {feedback.message}
              </p>
            ) : null}
            <Button disabled={isSaving} type="submit">
              <Save aria-hidden="true" size={16} />
              {isSaving ? "Saving…" : "Save settings"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
