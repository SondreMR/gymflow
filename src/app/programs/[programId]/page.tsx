import { ProgramEditor } from "@/features/programs/components/program-editor";

type ProgramDetailPageProps = {
  params: Promise<{ programId: string }>;
};

export default async function ProgramDetailPage({ params }: ProgramDetailPageProps) {
  const { programId } = await params;
  return <ProgramEditor programId={programId} />;
}
