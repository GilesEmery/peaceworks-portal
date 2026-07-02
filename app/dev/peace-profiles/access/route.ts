import { NextResponse } from "next/server";

import {
  createDevPeaceProfilesCookieValue,
  DEV_PEACE_PROFILES_COOKIE_MAX_AGE_SECONDS,
  DEV_PEACE_PROFILES_COOKIE_NAME,
  DEV_PEACE_PROFILES_COOKIE_PATH,
  getDevPeaceProfilesAuthConfig,
} from "../auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const config = getDevPeaceProfilesAuthConfig();
  const redirectUrl = new URL("/dev/peace-profiles", request.url);

  if (!config.isConfigured) {
    redirectUrl.searchParams.set("error", "server-config");
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const formData = await request.formData();
  const password = formData.get("password");

  if (password !== config.password) {
    redirectUrl.searchParams.set("error", "invalid-password");
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const response = NextResponse.redirect(redirectUrl, { status: 303 });

  response.cookies.set({
    name: DEV_PEACE_PROFILES_COOKIE_NAME,
    value: createDevPeaceProfilesCookieValue(config.secret),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: DEV_PEACE_PROFILES_COOKIE_PATH,
    maxAge: DEV_PEACE_PROFILES_COOKIE_MAX_AGE_SECONDS,
  });

  return response;
}
