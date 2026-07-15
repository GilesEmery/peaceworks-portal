import {
  coachErrorResponse,
  requireCoachFromRequest,
} from "../../../../../../lib/coach/dashboard";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireCoachFromRequest(request);

  if (!auth.ok) return coachErrorResponse(auth);

  return Response.json(
    {
      ok: false,
      error: "monthly_question_source_mutation_disabled",
      code: "monthly_question_source_mutation_disabled",
      message:
        "Monthly Questions are published from the Admin Dashboard library, not the Coach Dashboard.",
    },
    { status: 405 }
  );
}
