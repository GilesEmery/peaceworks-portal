import type { Metadata } from "next";
import { cookies } from "next/headers";

import PeaceProfilesPreview from "./PeaceProfilesPreview";
import {
  DEV_PEACE_PROFILES_COOKIE_NAME,
  getDevPeaceProfilesAuthConfig,
  isValidDevPeaceProfilesCookie,
} from "./auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Development Access | PeaceWorks",
  robots: {
    index: false,
    follow: false,
  },
};

type DevPeaceProfilesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DevPeaceProfilesPage({
  searchParams,
}: DevPeaceProfilesPageProps) {
  const config = getDevPeaceProfilesAuthConfig();
  const resolvedSearchParams = searchParams ? await searchParams : {};

  if (!config.isConfigured) {
    return <DevelopmentAccessScreen configMissing />;
  }

  const cookieStore = await cookies();
  const accessCookie = cookieStore.get(DEV_PEACE_PROFILES_COOKIE_NAME)?.value;
  const hasAccess = accessCookie
    ? isValidDevPeaceProfilesCookie(accessCookie, config.secret)
    : false;

  if (hasAccess) {
    return <PeaceProfilesPreview />;
  }

  return (
    <DevelopmentAccessScreen
      showError={resolvedSearchParams.error === "invalid-password"}
    />
  );
}

function DevelopmentAccessScreen({
  showError = false,
  configMissing = false,
}: {
  showError?: boolean;
  configMissing?: boolean;
}) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background:
          "radial-gradient(circle at 12% 0%, rgba(184,204,183,0.22), transparent 26%), linear-gradient(180deg, #f8f5f0 0%, #f4f1eb 100%)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <section
        style={{
          width: "min(520px, 100%)",
          padding: 32,
          borderRadius: 24,
          background: "rgba(255, 255, 255, 0.82)",
          border: "1px solid rgba(255, 255, 255, 0.88)",
          boxShadow: "0 24px 80px rgba(17,17,17,0.12)",
        }}
      >
        <p
          style={{
            margin: "0 0 14px",
            color: "#5a7a5c",
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          PeaceWorks
        </p>

        <h1
          style={{
            margin: "0 0 10px",
            color: "#141414",
            fontSize: "clamp(2.3rem, 7vw, 4rem)",
            lineHeight: 0.96,
          }}
        >
          Development Access
        </h1>

        <p style={{ margin: "0 0 24px", color: "#5f625f", lineHeight: 1.55 }}>
          Enter the password to view the Peace Profiles development page.
        </p>

        {configMissing ? (
          <p
            role="alert"
            style={{
              margin: 0,
              padding: "14px 16px",
              borderRadius: 14,
              background: "rgba(120, 38, 38, 0.08)",
              color: "#782626",
              lineHeight: 1.45,
            }}
          >
            Development access is unavailable because the server is missing the
            required environment configuration.
          </p>
        ) : (
          <form
            action="/dev/peace-profiles/access"
            method="post"
            style={{ display: "grid", gap: 14 }}
          >
            <label
              style={{
                display: "grid",
                gap: 8,
                color: "#141414",
                fontWeight: 700,
              }}
            >
              Password
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                style={{
                  width: "100%",
                  minHeight: 52,
                  padding: "0 14px",
                  borderRadius: 14,
                  border: "1px solid rgba(20,20,20,0.16)",
                  background: "#fff",
                  color: "#141414",
                  font: "inherit",
                }}
              />
            </label>

            {showError && (
              <p
                role="alert"
                style={{
                  margin: 0,
                  color: "#9b2f2f",
                  fontWeight: 700,
                }}
              >
                Incorrect password. Please try again.
              </p>
            )}

            <button
              type="submit"
              style={{
                minHeight: 52,
                border: "none",
                borderRadius: 999,
                background: "#111",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 800,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Enter
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
