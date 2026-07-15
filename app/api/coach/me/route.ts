import {
  coachErrorResponse,
  requireCoachFromRequest,
} from "../../../../lib/coach/dashboard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireCoachFromRequest(request);

  if (!auth.ok) {
    return coachErrorResponse(auth);
  }

  return Response.json({
    ok: true,
    isAdmin: auth.isAdmin,
    isCoach: auth.isCoach,
  });
}
