import { buildAdminAnalytics } from "../../../../lib/admin/assessmentAnalytics";
import { fetchAdminAssessmentData } from "../../../../lib/admin/assessmentQueries";
import {
  adminErrorResponse,
  requireAdminFromRequest,
} from "../../../../lib/admin/authorization";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);

  if (!auth.ok) {
    return adminErrorResponse(auth);
  }

  try {
    const data = await fetchAdminAssessmentData();
    const analytics = buildAdminAnalytics(data);

    return Response.json(analytics, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json(
      {
        ok: false,
        message: "Admin assessment data is unavailable.",
      },
      { status: 503 }
    );
  }
}
