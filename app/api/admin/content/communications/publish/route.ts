import {
  createAdminCommunication,
  assertCommunicationPortalAudience,
  setAdminCommunicationStatus,
  updateAdminCommunication,
} from "../../../../../../lib/admin/contentStudio";
import {
  adminErrorResponse,
  requireAdminFromRequest,
} from "../../../../../../lib/admin/authorization";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return adminErrorResponse(auth);

  try {
    const body = await request.json();
    assertCommunicationPortalAudience(body);
    const saved = typeof body.id === "string" && body.id
      ? await updateAdminCommunication(auth.user.id, body.id, body)
      : await createAdminCommunication(auth.user.id, body);
    if (!saved.channels.includes("my_dashboard")) {
      throw new Error("Select PeaceWorks Site Message before publishing.");
    }
    const communication = await setAdminCommunicationStatus(auth.user.id, saved.id, "published");
    return Response.json({ ok: true, communication, message: "Published to the PeaceWorks portal." });
  } catch (error) {
    console.error("Admin communication portal publish failed", error);
    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : "Site Message could not be published." },
      { status: 400 }
    );
  }
}
