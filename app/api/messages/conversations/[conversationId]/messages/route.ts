import {
  messagingActionResponse,
  messagingErrorResponse,
  requireMessagingContext,
  sendMessage,
  type SendMessagePayload,
} from "../../../../../../lib/messaging/service";

export async function POST(
  request: Request,
  context: { params: Promise<{ conversationId: string }> }
) {
  const auth = await requireMessagingContext(request);
  if (!auth.ok) return messagingErrorResponse(auth);
  try {
    const { conversationId } = await context.params;
    return Response.json(
      await sendMessage(
        auth.context,
        conversationId,
        (await request.json()) as SendMessagePayload
      )
    );
  } catch (error) {
    return messagingActionResponse(error);
  }
}
