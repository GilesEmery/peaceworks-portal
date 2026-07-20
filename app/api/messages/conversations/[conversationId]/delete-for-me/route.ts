import {
  deleteConversationForMe,
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
    const body = (await request.json()) as { confirmed?: boolean };
    return Response.json(
      await deleteConversationForMe(auth.context, conversationId, body.confirmed === true)
    );
  } catch (error) {
    return messagingActionResponse(error);
  }
}
