import { createAdminSupabaseClient } from "../../../../../lib/admin/authorization";
import {
  CIRCLE_REPORT_BUCKET,
  NOVEMBER_2026_REPORT_KEY,
  requireFoundersCircleReportAccess,
} from "../../../../../lib/circle/reportAccess";
import { circleErrorResponse } from "../../../../../lib/circle/authorization";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireFoundersCircleReportAccess(request);
  if (!auth.ok) return circleErrorResponse(auth);

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.storage
    .from(CIRCLE_REPORT_BUCKET)
    .download(NOVEMBER_2026_REPORT_KEY);

  if (error || !data) {
    // No public fallback: a missing protected file is never made accessible anonymously.
    return Response.json(
      {
        ok: false,
        code: "report_not_published",
        message: "The November Circle report has not been published yet.",
      },
      { status: 404, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  return new Response(await data.text(), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
