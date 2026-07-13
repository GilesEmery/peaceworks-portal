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

  return Response.json({
    ok: true,
    isAdmin: true,
    email: auth.email,
  });
}
