import {
  circleErrorResponse,
  requireCircleAccessFromRequest,
} from "../../../../lib/circle/authorization";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireCircleAccessFromRequest(request);

  if (!auth.ok) return circleErrorResponse(auth);

  return Response.json(
    {
      ok: true,
      isAdmin: auth.isAdmin,
      isCircleMember: auth.isCircleMember,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
