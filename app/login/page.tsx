import AuthPageClient from "../../components/auth/AuthPageClient";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const next = resolvedSearchParams.next;

  return <AuthPageClient nextPath={typeof next === "string" ? next : undefined} />;
}
