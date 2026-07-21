import { AuthForm } from "@/features/auth/components/auth-form";
import { getOptionalAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  if (await getOptionalAuthUser()) redirect("/");
  return <AuthForm mode="sign-in" />;
}
