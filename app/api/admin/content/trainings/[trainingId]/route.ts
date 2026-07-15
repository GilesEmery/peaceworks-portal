import {
  deleteAdminTraining,
  setAdminTrainingStatus,
  updateAdminTraining,
  type AdminContentStatus,
} from "../../../../../../lib/admin/contentStudio";
import {
  adminErrorResponse,
  requireAdminFromRequest,
} from "../../../../../../lib/admin/authorization";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ trainingId: string }> }
) {
  const auth = await requireAdminFromRequest(request);

  if (!auth.ok) return adminErrorResponse(auth);

  try {
    const { trainingId } = await context.params;
    const body = await request.json();
    const training =
      typeof body.status === "string"
        ? await setAdminTrainingStatus(
            auth.user.id,
            trainingId,
            body.status as AdminContentStatus
          )
        : await updateAdminTraining(auth.user.id, trainingId, body);

    return Response.json({ ok: true, training });
  } catch (error) {
    console.error("Admin training update failed", error);

    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : "Training could not be updated." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ trainingId: string }> }
) {
  const auth = await requireAdminFromRequest(request);

  if (!auth.ok) return adminErrorResponse(auth);

  try {
    const { trainingId } = await context.params;
    await deleteAdminTraining(trainingId);

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Admin training delete failed", error);

    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : "Training could not be deleted." },
      { status: 400 }
    );
  }
}
