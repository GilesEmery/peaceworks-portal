import { redirect } from "next/navigation";

import { routes } from "../../lib/navigation";

type DashboardRedirectPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardRedirectPage({
  searchParams,
}: DashboardRedirectPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const params = new URLSearchParams();

  Object.entries(resolvedSearchParams).forEach(([key, value]) => {
    if (typeof value === "string") params.set(key, value);
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    }
  });

  const query = params.toString();
  redirect(query ? `${routes.myDashboard}?${query}` : routes.myDashboard);
}
