import {
  getMessagingInbox,
  messagingActionResponse,
  messagingErrorResponse,
  requireMessagingContext,
} from "../../../lib/messaging/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireMessagingContext(request);
  if (!auth.ok) return messagingErrorResponse(auth);
  try {
    return Response.json(await getMessagingInbox(auth.context), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Messaging inbox failed", error);
    return messagingActionResponse(error);
  }
}
