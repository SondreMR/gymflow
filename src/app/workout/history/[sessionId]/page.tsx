import { WorkoutHistoryDetail } from "@/features/workout/components/workout-history-detail";
import { getWorkoutHistoryDetail } from "@/features/workout/data";

type WorkoutHistoryPageProps = { params: Promise<{ sessionId: string }> };

export default async function WorkoutHistoryPage({ params }: WorkoutHistoryPageProps) {
  const { sessionId } = await params;
  return <WorkoutHistoryDetail workout={await getWorkoutHistoryDetail(sessionId)} />;
}
