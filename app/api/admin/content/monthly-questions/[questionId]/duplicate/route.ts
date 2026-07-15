import { duplicateAdminMonthlyQuestion } from "../../../../../../../lib/admin/contentStudio";
import {
  adminErrorResponse,
  requireAdminFromRequest,
} from "../../../../../../../lib/admin/authorization";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ questionId: string }> }
) {
  const auth = await requireAdminFromRequest(request);

  if (!auth.ok) return adminErrorResponse(auth);

  try {
    const { questionId } = await context.params;
    const question = await duplicateAdminMonthlyQuestion(auth.user.id, questionId);

    return Response.json({ ok: true, question });
  } catch (error) {
    console.error("Admin monthly question duplicate failed", error);

    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : "Monthly question could not be duplicated." },
      { status: 400 }
    );
  }
}
