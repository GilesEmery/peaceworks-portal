import {
  markConversationRead,
  messagingActionResponse,
  messagingErrorResponse,
  requireMessagingContext,
} from "../../../../../../lib/messaging/service";

export async function POST(
  request: Request,
  context: { params: Promise<{ conversationId: string }> }
) {
  const auth = await requireMessagingContext(request);
  if (!auth.ok) return messagingErrorResponse(auth);
  try {
    const { conversationId } = await context.params;
    return Response.json(await markConversationRead(auth.context, conversationId));
  } catch (error) {
    return messagingActionResponse(error);
  }
}
