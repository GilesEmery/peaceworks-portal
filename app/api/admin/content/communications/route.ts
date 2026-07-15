import {
  createAdminCommunication,
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
    console.error("Admin communications load failed", error);

    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : "Communications are unavailable." },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);

  if (!auth.ok) return adminErrorResponse(auth);

  try {
    const communication = await createAdminCommunication(
      auth.user.id,
      await request.json()
    );

    return Response.json({ ok: true, communication });
  } catch (error) {
    console.error("Admin communication create failed", error);

    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : "Communication could not be saved." },
      { status: 400 }
    );
  }
}
