import {
  createAdminMonthlyQuestion,
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
    const payload = await fetchAdminContentStudio();

    return Response.json(payload, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Admin content library load failed", error);

    return Response.json(
      { ok: false, message: getErrorMessage(error, "Content library is unavailable.") },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);

  if (!auth.ok) return adminErrorResponse(auth);

  try {
    const values = await request.json();
    const question = await createAdminMonthlyQuestion(auth.user.id, values);

    return Response.json({ ok: true, question });
  } catch (error) {
    console.error("Admin monthly question create failed", error);

    return Response.json(
      { ok: false, message: getErrorMessage(error, "Monthly question could not be saved.") },
      { status: 400 }
    );
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
