import { uploadAdminCommunicationImage } from "../../../../../../lib/admin/contentStudio";
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
    const uploadKind =
      String(formData.get("uploadKind") || "header") === "thumbnail"
        ? "thumbnail"
        : "header";

    if (!(file instanceof File)) {
      return Response.json(
        { ok: false, message: "Choose an image to upload." },
        { status: 400 }
      );
    }

    const upload = await uploadAdminCommunicationImage(file, uploadKind);

    return Response.json({ ok: true, upload });
  } catch (error) {
    console.error("Admin communication image upload failed", error);

    return Response.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Communication image could not be uploaded.",
      },
      { status: 400 }
    );
  }
}
