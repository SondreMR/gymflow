import { AppShell } from "@/components/app-shell/app-shell";
import { ProfileScreen } from "@/features/profile/components/profile-screen";
import { getProfileData } from "@/features/profile/data";

export default async function ProfilePage() {
  const profile = await getProfileData();

  return (
    <AppShell eyebrow="Your training identity" title="Profile">
      <ProfileScreen profile={profile} />
    </AppShell>
  );
}
