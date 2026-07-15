import { duplicateAdminTraining } from "../../../../../../../lib/admin/contentStudio";
import {
  adminErrorResponse,
  requireAdminFromRequest,
} from "../../../../../../../lib/admin/authorization";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ trainingId: string }> }
) {
  const auth = await requireAdminFromRequest(request);

  if (!auth.ok) return adminErrorResponse(auth);

  try {
    const { trainingId } = await context.params;
    const training = await duplicateAdminTraining(auth.user.id, trainingId);

    return Response.json({ ok: true, training });
  } catch (error) {
    console.error("Admin training duplicate failed", error);

    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : "Training could not be duplicated." },
      { status: 400 }
    );
  }
}
