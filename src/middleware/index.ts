import { defineMiddleware } from "astro:middleware";
import { supabase } from "../lib/supabase";
import micromatch from "micromatch";
import 'dotenv/config';

const protectedRoutes = ["/dashboard(|/)"];
const redirectRoutes = ["/login(|/)", "/register(|/)"];
const protectedAPIRoutes = ["/api/guestbook(|/)"];

export const onRequest = defineMiddleware(async ({ url, cookies, redirect }, next) => {
  const accessToken = cookies.get("sb-access-token")?.value;
  const refreshToken = cookies.get("sb-refresh-token")?.value;

  if (micromatch.isMatch(url.pathname, protectedRoutes)) {
    if (!accessToken || !refreshToken) {
      return redirect("/login");
    }

    const { data, error } = await supabase.auth.setSession({
      refresh_token: refreshToken,
      access_token: accessToken,
    });

    if (error || !data?.user?.email) {
      cookies.delete("sb-access-token", { path: "/" });
      cookies.delete("sb-refresh-token", { path: "/" });
      return redirect("/login");
    }

    cookies.set("sb-access-token", data.session?.access_token || "", {
      sameSite: "strict",
      path: "/",
      secure: true,
    });

    cookies.set("sb-refresh-token", data.session?.refresh_token || "", {
      sameSite: "strict",
      path: "/",
      secure: true,
    });
  }

  if (micromatch.isMatch(url.pathname, redirectRoutes) && accessToken && refreshToken) {
    return redirect("/dashboard");
  }

  if (micromatch.isMatch(url.pathname, protectedAPIRoutes)) {
    if (!accessToken || !refreshToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
  }

  return next();
});
