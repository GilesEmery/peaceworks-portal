import { requireMemberFromRequest, memberErrorResponse } from "../../../../../../lib/member/authorization";
import { fetchMemberDashboard } from "../../../../../../lib/member/dashboard";
import { createAdminSupabaseClient } from "../../../../../../lib/admin/authorization";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ resourceId: string }> }
) {
  const auth = await requireMemberFromRequest(request);
  if (!auth.ok) return memberErrorResponse(auth);

  const { resourceId } = await context.params;
  if (!/^[a-f0-9-]{36}$/i.test(resourceId)) {
    return Response.json({ ok: false, message: "Resource not found." }, { status: 404 });
  }

  try {
    const dashboard = await fetchMemberDashboard(auth);
    const assigned = dashboard.sections.resources.some(
      (resource) =>
        resource.id === resourceId &&
        resource.resourceType === "pdf" &&
        resource.displayAsFlipbook
    );

    if (!assigned) {
      return Response.json(
        { ok: false, message: "This publication is not assigned to your account." },
        { status: 403, headers: { "Cache-Control": "no-store" } }
      );
    }

    const supabase = createAdminSupabaseClient();
    const { data: row, error: resourceError } = await supabase
      .from("resources")
      .select("storage_path,resource_type,display_as_flipbook,status")
      .eq("id", resourceId)
      .maybeSingle();

    if (
      resourceError ||
      !row ||
      row.status !== "published" ||
      row.resource_type !== "pdf" ||
      row.display_as_flipbook !== true ||
      !row.storage_path
    ) {
      return Response.json(
        { ok: false, message: "Publication is unavailable." },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    const { data: file, error: storageError } = await supabase.storage
      .from("peaceworks-resources")
      .download(row.storage_path);

    if (storageError || !file) {
      return Response.json(
        { ok: false, message: "Publication file is unavailable." },
        { status: 503, headers: { "Cache-Control": "no-store" } }
      );
    }
    return new Response(await file.arrayBuffer(), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  } catch (error) {
    console.error("Flipbook access failed", error);
    return Response.json(
      { ok: false, message: "Unable to verify your resource access." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
