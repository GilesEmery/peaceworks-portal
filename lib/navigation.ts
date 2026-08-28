export type NavigationItem = {
  label: string;
  href: string;
};

export type RoleNavigationItem = NavigationItem & {
  role: "coach" | "project_manager" | "admin";
};

export const routes = {
  home: "/",
  about: "/about",
  howItWorks: "/how-it-works",
  organizations: "/organizations",
  roiCalculator: "/roi-calculator",
  join: "/join",
  joinCreditCard: "/join/credit-card",
  joinAch: "/join/ach",
  assessments: "/assessments",
  peaceAssessment: "/peace-assessment",
  login: "/login",
  auth: "/auth",
  myDashboard: "/my-dashboard",
  messages: "/messages",
  legacyDashboard: "/dashboard",
  account: "/account",
  settings: "/settings",
  circle: "/circle",
  coach: "/coach",
  project: "/project",
  admin: "/admin",
} as const;

export const publicPrimaryNavigation: NavigationItem[] = [
  { label: "How It Works", href: routes.howItWorks },
  { label: "For Organizations", href: routes.organizations },
  { label: "Join a Circle", href: routes.join },
  { label: "Assessments", href: routes.assessments },
  { label: "About", href: routes.about },
];

export const assessmentNavigation: NavigationItem[] = [
  { label: "Peace Assessment", href: routes.peaceAssessment },
];

export const roleAccountNavigation: RoleNavigationItem[] = [
  { label: "Coach Dashboard", href: routes.coach, role: "coach" },
  { label: "Project Dashboard", href: routes.project, role: "project_manager" },
  { label: "Admin Dashboard", href: routes.admin, role: "admin" },
];

export const footerNavigation: NavigationItem[] = [
  { label: "Join", href: routes.join },
  { label: "About", href: routes.about },
  { label: "Assessments", href: routes.assessments },
  { label: "ROI Calculator", href: routes.roiCalculator },
];

export function dashboardLoginHref(nextPath: string = routes.myDashboard) {
  return `${routes.login}?next=${encodeURIComponent(nextPath)}`;
}

export function isSafeInternalPath(value: string | null | undefined) {
  if (!value) return false;
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  if (value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value)) return false;

  try {
    const decodedValue = decodeURIComponent(value);
    if (!decodedValue.startsWith("/") || decodedValue.startsWith("//")) return false;
    if (
      decodedValue.includes("\\") ||
      /[\u0000-\u001f\u007f]/.test(decodedValue)
    ) {
      return false;
    }

    const destination = new URL(decodedValue, "https://peaceworks.local");
    return (
      destination.origin === "https://peaceworks.local" &&
      destination.pathname.startsWith("/")
    );
  } catch {
    return false;
  }
}

export function safeNextPath(value: string | null | undefined): string {
  if (isSafeInternalPath(value) && value) return value;
  return routes.myDashboard;
}

export function isActivePath(pathname: string, basePath: string) {
  if (basePath === routes.myDashboard) {
    return pathname === routes.myDashboard || pathname.startsWith(`${routes.myDashboard}/`);
  }

  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

export function isAssessmentPath(pathname: string) {
  return (
    isActivePath(pathname, routes.assessments) ||
    isActivePath(pathname, routes.peaceAssessment)
  );
}

export function isPwaPortalPath(pathname: string) {
  return [
    routes.myDashboard,
    routes.messages,
    routes.circle,
    routes.account,
    routes.settings,
    routes.assessments,
    routes.peaceAssessment,
    routes.legacyDashboard,
    routes.coach,
    routes.project,
    routes.admin,
  ].some((route) => isActivePath(pathname, route));
}
