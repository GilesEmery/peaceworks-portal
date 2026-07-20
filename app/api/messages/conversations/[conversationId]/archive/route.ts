import {
  messagingActionResponse,
  messagingErrorResponse,
  requireMessagingContext,
  setConversationArchived,
} from "../../../../../../lib/messaging/service";

export async function POST(
  request: Request,
  context: { params: Promise<{ conversationId: string }> }
) {
  const auth = await requireMessagingContext(request);
  if (!auth.ok) return messagingErrorResponse(auth);
  try {
    const { conversationId } = await context.params;
    return Response.json(await setConversationArchived(auth.context, conversationId, true));
  } catch (error) {
    return messagingActionResponse(error);
  }
}
