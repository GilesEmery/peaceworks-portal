import {
  archiveAdminContentAssignment,
  deleteAdminContentAssignment,
} from "../../../../../../lib/admin/contentStudio";
import {
  adminErrorResponse,
  requireAdminFromRequest,
} from "../../../../../../lib/admin/authorization";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ assignmentId: string }> }
) {
  const auth = await requireAdminFromRequest(request);

  if (!auth.ok) return adminErrorResponse(auth);

  try {
    const { assignmentId } = await context.params;
    const assignment = await archiveAdminContentAssignment(assignmentId);

    return Response.json({ ok: true, assignment });
  } catch (error) {
    console.error("Admin content assignment unassign failed", error);

    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : "Assignment could not be unassigned." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ assignmentId: string }> }
) {
  const auth = await requireAdminFromRequest(request);

  if (!auth.ok) return adminErrorResponse(auth);

  try {
    const { assignmentId } = await context.params;
    await deleteAdminContentAssignment(assignmentId);

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Admin content assignment unassign failed", error);

    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : "Assignment could not be unassigned." },
      { status: 400 }
    );
  }
}
