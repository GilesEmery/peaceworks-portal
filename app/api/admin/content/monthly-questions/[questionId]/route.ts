import {
  deleteAdminMonthlyQuestion,
  setAdminMonthlyQuestionStatus,
  updateAdminMonthlyQuestion,
  type AdminContentStatus,
} from "../../../../../../lib/admin/contentStudio";
import {
  adminErrorResponse,
  requireAdminFromRequest,
} from "../../../../../../lib/admin/authorization";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ questionId: string }> }
) {
  const auth = await requireAdminFromRequest(request);

  if (!auth.ok) return adminErrorResponse(auth);

  try {
    const { questionId } = await context.params;
    const body = await request.json();
    const question =
      typeof body.status === "string"
        ? await setAdminMonthlyQuestionStatus(
            auth.user.id,
            questionId,
            body.status as AdminContentStatus
          )
        : await updateAdminMonthlyQuestion(auth.user.id, questionId, body);

    return Response.json({ ok: true, question });
  } catch (error) {
    console.error("Admin monthly question update failed", error);

    return Response.json(
      { ok: false, message: getErrorMessage(error, "Monthly question could not be updated.") },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ questionId: string }> }
) {
  const auth = await requireAdminFromRequest(request);

  if (!auth.ok) return adminErrorResponse(auth);

  try {
    const { questionId } = await context.params;
    await deleteAdminMonthlyQuestion(questionId);

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Admin monthly question delete failed", error);

    return Response.json(
      { ok: false, message: getErrorMessage(error, "Monthly question could not be deleted.") },
      { status: 400 }
    );
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
