import {
  adminErrorResponse,
  requireAdminFromRequest,
} from "../../../../../../../lib/admin/authorization";
import { restoreAdminContentAssignment } from "../../../../../../../lib/admin/contentStudio";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ assignmentId: string }> }
) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return adminErrorResponse(auth);

  try {
    const { assignmentId } = await context.params;
    const assignment = await restoreAdminContentAssignment(assignmentId);
    return Response.json({ ok: true, assignment });
  } catch (error) {
    console.error("Admin content assignment restore failed", error);
    return Response.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Assignment could not be restored.",
      },
      { status: 400 }
    );
  }
}
