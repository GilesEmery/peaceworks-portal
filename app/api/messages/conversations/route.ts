import {
  createConversation,
  messagingActionResponse,
  messagingErrorResponse,
  requireMessagingContext,
  type CreateConversationPayload,
} from "../../../../lib/messaging/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireMessagingContext(request);
  if (!auth.ok) return messagingErrorResponse(auth);
  try {
    const payload = (await request.json()) as CreateConversationPayload;
    return Response.json(await createConversation(auth.context, payload), { status: 201 });
  } catch (error) {
    return messagingActionResponse(error);
  }
}
