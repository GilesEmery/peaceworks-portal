import {
  coachErrorResponse,
  requireCoachFromRequest,
} from "../../../../../lib/coach/dashboard";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const auth = await requireCoachFromRequest(request);

  if (!auth.ok) return coachErrorResponse(auth);

  return sourceMutationDisabled();
}

export async function DELETE(request: Request) {
  const auth = await requireCoachFromRequest(request);

  if (!auth.ok) return coachErrorResponse(auth);

  return sourceMutationDisabled();
}

function sourceMutationDisabled() {
  return Response.json(
    {
      ok: false,
      error: "monthly_question_source_mutation_disabled",
      code: "monthly_question_source_mutation_disabled",
      message:
        "Monthly Questions are managed from the Admin Dashboard library. Coaches can assign published questions to Circles.",
    },
    { status: 405 }
  );
}
