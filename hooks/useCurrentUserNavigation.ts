"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { routes } from "../lib/navigation";
import { supabase } from "../lib/supabase";

type Profile = {
  first_name: string | null;
  last_name: string | null;
  avatar_path: string | null;
  account_status: string | null;
};

export type CurrentUserNavigationState = {
  profile: Profile | null;
  authEmail: string;
  isAuthenticated: boolean;
  isAdmin: boolean;
  canViewCoachDashboard: boolean;
  canViewProjectDashboard: boolean;
  displayName: string;
  initials: string;
  isLoading: boolean;
  reload: () => Promise<void>;
};

export function useCurrentUserNavigation(): CurrentUserNavigationState {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canViewCoachDashboard, setCanViewCoachDashboard] = useState(false);
  const [canViewProjectDashboard, setCanViewProjectDashboard] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async function loadProfile() {
    const [
      {
        data: { user },
      },
      {
        data: { session },
      },
    ] = await Promise.all([supabase.auth.getUser(), supabase.auth.getSession()]);

    if (!user) {
      resetNavigationState();
      setIsLoading(false);
      return;
    }

    setIsAuthenticated(true);
    setAuthEmail(user.email || "");

    const { data, error } = await supabase
      .from("profiles")
      .select("first_name, last_name, avatar_path")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Current user profile could not be loaded.", error);
      setProfile(null);
      setIsAdmin(false);
      setCanViewCoachDashboard(false);
      setCanViewProjectDashboard(false);
      setIsLoading(false);
      return;
    }

    const accountStatus = await loadAccountStatus(user.id);

    if (accountStatus !== "active") {
      await supabase.auth.signOut();
      resetNavigationState();
      router.replace(routes.login);
      setIsLoading(false);
      return;
    }

    setProfile(data ? { ...data, account_status: accountStatus } : null);

    if (!session?.access_token) {
      setIsAdmin(false);
      setCanViewCoachDashboard(false);
      setCanViewProjectDashboard(false);
      setIsLoading(false);
      return;
    }

    const headers = {
      Authorization: `Bearer ${session.access_token}`,
    };

    const [adminResponse, coachResponse, projectResponse] = await Promise.all([
      fetch("/api/admin/me", { cache: "no-store", headers }),
      fetch("/api/coach/me", { cache: "no-store", headers }),
      fetch("/api/project/me", { cache: "no-store", headers }),
    ]);
    const coachResult = (await coachResponse.json().catch(() => null)) as
      | { isAdmin?: boolean; isCoach?: boolean }
      | null;
    const projectResult = (await projectResponse.json().catch(() => null)) as
      | { isProjectManager?: boolean }
      | null;

    setIsAdmin(adminResponse.ok);
    setCanViewCoachDashboard(
      Boolean(coachResult?.isCoach || (coachResponse.ok && coachResult?.isAdmin))
    );
    setCanViewProjectDashboard(Boolean(projectResult?.isProjectManager));
    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    void Promise.resolve().then(() => loadProfile());

    function handleProfileUpdated() {
      void loadProfile();
    }

    window.addEventListener("peaceworks-profile-updated", handleProfileUpdated);

    return () => {
      window.removeEventListener(
        "peaceworks-profile-updated",
        handleProfileUpdated
      );
    };
  }, [loadProfile]);

  const profileName = getProfileName(profile);
  const displayName = profileName || authEmail || "Account";

  const initials = useMemo(() => {
    const firstInitial = profile?.first_name?.trim().charAt(0) || "";
    const lastInitial = profile?.last_name?.trim().charAt(0) || "";

    if (firstInitial || lastInitial) {
      return `${firstInitial}${lastInitial}`.toUpperCase();
    }

    const emailInitial = authEmail.trim().charAt(0);

    if (emailInitial) return emailInitial.toUpperCase();

    return "PW";
  }, [authEmail, profile]);

  return {
    profile,
    authEmail,
    isAuthenticated,
    isAdmin,
    canViewCoachDashboard,
    canViewProjectDashboard,
    displayName,
    initials,
    isLoading,
    reload: loadProfile,
  };

  function resetNavigationState() {
    setProfile(null);
    setAuthEmail("");
    setIsAuthenticated(false);
    setIsAdmin(false);
    setCanViewCoachDashboard(false);
    setCanViewProjectDashboard(false);
  }
}

async function loadAccountStatus(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("account_status")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (isMissingLifecycleColumnError(error)) {
      console.warn(
        "Profile lifecycle columns are not available yet; treating account as active."
      );
      return "active";
    }

    console.error("Current user account status could not be loaded.", error);
    return "active";
  }

  if (data?.account_status === "deactivated" || data?.account_status === "archived") {
    return data.account_status;
  }

  return "active";
}

function getProfileName(profile: Profile | null) {
  return [profile?.first_name, profile?.last_name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
}

function isMissingLifecycleColumnError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const values = Object.values(error as Record<string, unknown>)
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  return values.includes("account_status") && values.includes("column");
}
