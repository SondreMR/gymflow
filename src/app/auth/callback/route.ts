import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next");
  const safeNext = next?.startsWith("/") ? next : "/";
  const code = request.nextUrl.searchParams.get("code");
  if (!code)
    return NextResponse.redirect(new URL("/auth/sign-in?error=cancelled", request.url));
  let response = NextResponse.redirect(new URL(safeNext, request.url));
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (items) =>
          items.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          ),
      },
    },
  );
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error)
    response = NextResponse.redirect(new URL("/auth/sign-in?error=oauth", request.url));
  return response;
}
