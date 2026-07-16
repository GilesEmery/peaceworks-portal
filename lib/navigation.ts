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
  roiCalculator: "/roi-calculator",
  join: "/join",
  assessments: "/assessments",
  peaceAssessment: "/peace-assessment",
  login: "/login",
  auth: "/auth",
  myDashboard: "/my-dashboard",
  legacyDashboard: "/dashboard",
  account: "/account",
  settings: "/settings",
  circle: "/circle",
  coach: "/coach",
  project: "/project",
  admin: "/admin",
} as const;

export const publicPrimaryNavigation: NavigationItem[] = [
  { label: "About", href: routes.about },
  { label: "ROI Calculator", href: routes.roiCalculator },
  { label: "Join a Circle", href: routes.join },
  { label: "Assessments", href: routes.assessments },
  { label: "My Dashboard", href: routes.myDashboard },
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
  { label: "My Dashboard", href: routes.myDashboard },
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
  if (value.includes("://")) return false;
  return true;
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
