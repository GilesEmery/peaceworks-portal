import { createAdminContentAssignments } from "../../../../../lib/admin/contentStudio";
import {
  adminErrorResponse,
  requireAdminFromRequest,
} from "../../../../../lib/admin/authorization";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);

  if (!auth.ok) return adminErrorResponse(auth);

  try {
    const assignments = await createAdminContentAssignments(
      auth.user.id,
      await request.json()
    );

    return Response.json({ ok: true, assignments });
  } catch (error) {
    console.error("Admin content assignment create failed", error);

    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : "Content could not be assigned." },
      { status: 400 }
    );
  }
}
