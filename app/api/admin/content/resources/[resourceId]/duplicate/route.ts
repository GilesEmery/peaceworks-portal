import { duplicateAdminResource } from "../../../../../../../lib/admin/contentStudio";
import {
  adminErrorResponse,
  requireAdminFromRequest,
} from "../../../../../../../lib/admin/authorization";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ resourceId: string }> }
) {
  const auth = await requireAdminFromRequest(request);

  if (!auth.ok) return adminErrorResponse(auth);

  try {
    const { resourceId } = await context.params;
    const resource = await duplicateAdminResource(auth.user.id, resourceId);

    return Response.json({ ok: true, resource });
  } catch (error) {
    console.error("Admin resource duplicate failed", error);

    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : "Resource could not be duplicated." },
      { status: 400 }
    );
  }
}
