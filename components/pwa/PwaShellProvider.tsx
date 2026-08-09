"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  useCurrentUserNavigation,
  type CurrentUserNavigationState,
} from "../../hooks/useCurrentUserNavigation";
import { useCompactPwaViewport } from "../../hooks/useCompactPwaViewport";
import { useStandalonePwa } from "../../hooks/useStandalonePwa";
import { isPwaPortalPath, routes } from "../../lib/navigation";
import { supabase } from "../../lib/supabase";
import PwaAppShell from "./PwaAppShell";

export type PwaShellMode = "unknown" | "standard" | "compact";

type PwaShellContextValue = {
  mode: PwaShellMode;
  navigation: CurrentUserNavigationState;
  signOut: () => Promise<void>;
};

const PwaShellContext = createContext<PwaShellContextValue | null>(null);

export default function PwaShellProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const navigation = useCurrentUserNavigation();
  const standaloneMode = useStandalonePwa();
  const viewportMode = useCompactPwaViewport();

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push(routes.login);
  }, [router]);

  const mode = resolveShellMode({
    pathname,
    isAuthenticated: navigation.isAuthenticated,
    authIsLoading: navigation.isLoading,
    standaloneMode,
    viewportMode,
  });
  const contextValue = useMemo(
    () => ({ mode, navigation, signOut }),
    [mode, navigation, signOut]
  );

  return (
    <PwaShellContext.Provider value={contextValue}>
      {mode === "compact" && (
        <PwaAppShell
          displayName={navigation.displayName}
          isAdmin={navigation.isAdmin}
          canViewCoachDashboard={navigation.canViewCoachDashboard}
          canViewProjectDashboard={navigation.canViewProjectDashboard}
          onSignOut={signOut}
        />
      )}
      {children}
    </PwaShellContext.Provider>
  );
}

export function usePwaShell() {
  const context = useContext(PwaShellContext);
  if (!context) {
    throw new Error("usePwaShell must be used within PwaShellProvider.");
  }
  return context;
}

function resolveShellMode({
  pathname,
  isAuthenticated,
  authIsLoading,
  standaloneMode,
  viewportMode,
}: {
  pathname: string;
  isAuthenticated: boolean;
  authIsLoading: boolean;
  standaloneMode: "unknown" | "browser" | "standalone";
  viewportMode: "unknown" | "compact" | "wide";
}): PwaShellMode {
  if (!isPwaPortalPath(pathname)) return "standard";
  if (standaloneMode === "unknown" || viewportMode === "unknown") return "unknown";
  if (standaloneMode === "browser" || viewportMode === "wide") return "standard";
  if (isAuthenticated) return "compact";
  return authIsLoading ? "unknown" : "standard";
}
