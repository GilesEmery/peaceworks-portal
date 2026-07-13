import {
  fetchAdminUsersData,
} from "../../../../lib/admin/userManagement";
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
    const payload = await fetchAdminUsersData(auth.user.id);

    return Response.json(payload, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Admin user data load failed", error);

    return Response.json(
      {
        ok: false,
        message: "Admin user data is unavailable.",
      },
      { status: 503 }
    );
  }
}
