import {
  projectErrorResponse,
  requireProjectManagerFromRequest,
} from "../../../../lib/project/authorization";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireProjectManagerFromRequest(request);

  if (!auth.ok) {
    return projectErrorResponse(auth);
  }

  return Response.json(
    {
      ok: true,
      isProjectManager: auth.isProjectManager,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
