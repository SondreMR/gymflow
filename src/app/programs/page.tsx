import { AppShell } from "@/components/app-shell/app-shell";
import {
  NewProgramButton,
  ProgramsScreen,
} from "@/features/programs/components/programs-screen";

export default function ProgramsPage() {
  return (
    <AppShell
      actions={<NewProgramButton />}
      eyebrow="Your training plans"
      title="Programs"
    >
      <ProgramsScreen />
    </AppShell>
  );
}
