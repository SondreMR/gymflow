import { AppShell } from "@/components/app-shell/app-shell";
import { getPersonalRecords } from "@/features/progress/data";

export default async function ProgressPage() {
  const records = await getPersonalRecords();
  return (
    <AppShell eyebrow="Selected compound lifts" title="Progress">
      <div className="space-y-6">
        <section className="rounded-2xl border border-white/[0.08] bg-[#111217] p-6">
          <p className="text-3xl font-bold text-white">{records.length}</p>
          <p className="mt-1 text-sm text-zinc-500">
            Tracked compound-lift personal records
          </p>
          <p className="mt-4 text-sm leading-6 text-zinc-400">
            GymFlow currently tracks highest-weight PRs for selected compound lifts
            only.
          </p>
        </section>
        {records.length ? (
          <section className="grid gap-3 sm:grid-cols-2">
            {records.map((record) => (
              <article
                className="rounded-2xl border border-white/[0.08] bg-[#111217] p-5"
                key={record.id}
              >
                <p className="font-bold text-white">{record.exercise.name}</p>
                <p className="mt-2 text-2xl font-bold text-lime-300">
                  {record.currentWeight.toString()} kg
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  Achieved{" "}
                  {record.achievedAt.toLocaleDateString("en", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </article>
            ))}
          </section>
        ) : (
          <p className="rounded-2xl border border-dashed border-white/[0.12] p-8 text-center text-sm text-zinc-500">
            Complete a selected compound lift with a loaded set to establish a PR.
          </p>
        )}
      </div>
    </AppShell>
  );
}
