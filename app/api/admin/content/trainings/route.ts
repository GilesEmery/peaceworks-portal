import {
  createAdminTraining,
  fetchAdminContentStudio,
} from "../../../../../lib/admin/contentStudio";
import {
  adminErrorResponse,
  requireAdminFromRequest,
} from "../../../../../lib/admin/authorization";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);

  if (!auth.ok) return adminErrorResponse(auth);

  try {
    return Response.json(await fetchAdminContentStudio(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Admin trainings load failed", error);

    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : "Training library is unavailable." },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);

  if (!auth.ok) return adminErrorResponse(auth);

  try {
    const training = await createAdminTraining(auth.user.id, await request.json());

    return Response.json({ ok: true, training });
  } catch (error) {
    console.error("Admin training create failed", error);

    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : "Training could not be saved." },
      { status: 400 }
    );
  }
}
