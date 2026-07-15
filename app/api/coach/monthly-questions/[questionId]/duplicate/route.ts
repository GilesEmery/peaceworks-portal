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
        "Monthly Question duplication belongs in the Admin Dashboard library.",
    },
    { status: 405 }
  );
}
