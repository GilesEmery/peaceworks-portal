import { uploadAdminResourceFile } from "../../../../../../lib/admin/contentStudio";
import {
  adminErrorResponse,
  requireAdminFromRequest,
} from "../../../../../../lib/admin/authorization";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);

  if (!auth.ok) return adminErrorResponse(auth);

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const resourceType = String(formData.get("resourceType") || "");
    const uploadKind =
      String(formData.get("uploadKind") || "primary") === "cover"
        ? "cover"
        : "primary";

    if (!(file instanceof File)) {
      return Response.json(
        { ok: false, message: "Choose a file to upload." },
        { status: 400 }
      );
    }

    const upload = await uploadAdminResourceFile(file, resourceType, uploadKind);

    return Response.json({ ok: true, upload });
  } catch (error) {
    console.error("Admin resource upload failed", error);

    return Response.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Resource file could not be uploaded.",
      },
      { status: 400 }
    );
  }
}
