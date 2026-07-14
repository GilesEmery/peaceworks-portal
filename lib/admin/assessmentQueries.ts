import type { User } from "@supabase/supabase-js";

import type { AdminAssessmentRow, AdminProfileRow } from "./authorization";
import { createAdminSupabaseClient } from "./authorization";

type AdminUserSummary = {
  id: string;
  email: string;
  name: string;
};

export async function fetchAdminAssessmentData() {
  const supabase = createAdminSupabaseClient();
  const [users, profilesResponse, assessmentsResponse] = await Promise.all([
    fetchAllAuthUsers(),
    supabase.from("profiles").select("id, first_name, last_name"),
    supabase
      .from("peace_assessment_results")
      .select(
        "id, user_id, created_at, peace_profile, base_pattern, identity_type, secondary_identity_type, response_type, processing_style, capacity_stage, scores, answers"
      )
      .order("created_at", { ascending: false })
      .order("id", { ascending: false }),
  ]);

  if (profilesResponse.error || assessmentsResponse.error) {
    throw new Error("Unable to load admin assessment data.");
  }

  return {
    users,
    profiles: (profilesResponse.data || []) as AdminProfileRow[],
    assessments: (assessmentsResponse.data || []) as AdminAssessmentRow[],
  };
}

export async function fetchAdminAssessmentById(assessmentId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("peace_assessment_results")
    .select(
      "id, user_id, created_at, peace_profile, base_pattern, identity_type, secondary_identity_type, response_type, processing_style, capacity_stage, scores, answers"
    )
    .eq("id", assessmentId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load admin assessment result.");
  }

  return (data || null) as AdminAssessmentRow | null;
}

async function fetchAllAuthUsers() {
  const supabase = createAdminSupabaseClient();
  const perPage = 1000;
  const users: AdminUserSummary[] = [];

  for (let page = 1; page < 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error("Unable to load registered users.");
    }

    const pageUsers = data.users.map(formatAuthUser);
    users.push(...pageUsers);

    if (data.users.length < perPage) break;
  }

  return users;
}

function formatAuthUser(user: User): AdminUserSummary {
  const email = user.email || "";
  const metadata = user.user_metadata || {};
  const name =
    typeof metadata.full_name === "string"
      ? metadata.full_name
      : typeof metadata.name === "string"
        ? metadata.name
        : email;

  return {
    id: user.id,
    email,
    name,
  };
}
