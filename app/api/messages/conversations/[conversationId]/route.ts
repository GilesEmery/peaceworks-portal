import {
  getConversationDetail,
  messagingActionResponse,
  messagingErrorResponse,
  requireMessagingContext,
} from "../../../../../lib/messaging/service";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ conversationId: string }> }
) {
  const auth = await requireMessagingContext(request);
  if (!auth.ok) return messagingErrorResponse(auth);
  try {
    const { conversationId } = await context.params;
    return Response.json(await getConversationDetail(auth.context, conversationId), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return messagingActionResponse(error);
  }
}
