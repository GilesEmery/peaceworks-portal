import { createAdminResourceSignedUrl } from "../../../../../../../lib/admin/contentStudio";
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
    const url = await createAdminResourceSignedUrl(resourceId);

    return Response.json({ ok: true, url });
  } catch (error) {
    console.error("Admin resource signed URL failed", error);

    return Response.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Resource file could not be opened.",
      },
      { status: 400 }
    );
  }
}
