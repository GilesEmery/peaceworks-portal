import {
  adminErrorResponse,
  createAdminSupabaseClient,
  requireAdminFromRequest,
} from "../../../../lib/admin/authorization";
import {
  CIRCLE_REPORT_BUCKET,
  NOVEMBER_2026_REPORT_KEY,
} from "../../../../lib/circle/reportAccess";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return adminErrorResponse(auth);

  const data = await request.formData().catch(() => null);
  const file = data?.get("report");

  if (!(file instanceof File)) {
    return Response.json({ ok: false, message: "Choose a complete HTML flipbook file." }, { status: 400 });
  }
  if (file.size < 1000 || file.size > 14 * 1024 * 1024 || !file.name.toLowerCase().endsWith(".html")) {
    return Response.json({ ok: false, message: "Upload an HTML flipbook under 14 MB." }, { status: 400 });
  }

  const content = await file.text();
  if (!content.toLowerCase().includes("<!doctype html>") ||
      !content.includes("The Restoration Report") ||
      !content.includes("PAGE_DATA")) {
    return Response.json({ ok: false, message: "This does not look like a Restoration Report flipbook." }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();
  const uploadFile = new File([content], "November-2026.html", { type: "text/html" });
  const { error } = await supabase.storage
    .from(CIRCLE_REPORT_BUCKET)
    .upload(NOVEMBER_2026_REPORT_KEY, uploadFile, {
      upsert: true,
      contentType: "text/html; charset=utf-8",
      cacheControl: "0",
    });

  if (error) {
    console.error("Private Circle publication upload failed", error);
    return Response.json({ ok: false, message: "Unable to publish this report." }, { status: 503 });
  }

  return Response.json(
    { ok: true, message: "The November report is available to Founders Circle members.", url: "/circle/reports/november-2026" },
    { headers: { "Cache-Control": "no-store" } }
  );
}
