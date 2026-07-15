import {
  deleteAdminResource,
  setAdminResourceStatus,
  updateAdminResource,
  type AdminContentStatus,
} from "../../../../../../lib/admin/contentStudio";
import {
  adminErrorResponse,
  requireAdminFromRequest,
} from "../../../../../../lib/admin/authorization";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ resourceId: string }> }
) {
  const auth = await requireAdminFromRequest(request);

  if (!auth.ok) return adminErrorResponse(auth);

  try {
    const { resourceId } = await context.params;
    const body = await request.json();
    const resource =
      typeof body.status === "string"
        ? await setAdminResourceStatus(
            auth.user.id,
            resourceId,
            body.status as AdminContentStatus
          )
        : await updateAdminResource(auth.user.id, resourceId, body);

    return Response.json({ ok: true, resource });
  } catch (error) {
    console.error("Admin resource update failed", error);

    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : "Resource could not be updated." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ resourceId: string }> }
) {
  const auth = await requireAdminFromRequest(request);

  if (!auth.ok) return adminErrorResponse(auth);

  try {
    const { resourceId } = await context.params;
    await deleteAdminResource(resourceId);

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Admin resource delete failed", error);

    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : "Resource could not be deleted." },
      { status: 400 }
    );
  }
}
