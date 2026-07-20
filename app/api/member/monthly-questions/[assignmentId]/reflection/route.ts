import {
  memberErrorResponse,
  requireMemberFromRequest,
} from "../../../../../../lib/member/authorization";
import {
  readMemberMonthlyQuestionReflection,
  saveMemberMonthlyQuestionReflection,
} from "../../../../../../lib/member/monthlyQuestionReflections";
import type { MonthlyQuestionReflectionSavePayload } from "../../../../../../lib/monthlyQuestionReflections";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ assignmentId: string }> }
) {
  const auth = await requireMemberFromRequest(request);
  if (!auth.ok) return memberErrorResponse(auth);

  const { assignmentId } = await context.params;
  const result = await readMemberMonthlyQuestionReflection(auth, assignmentId);

  if (!result.ok) {
    return Response.json(result, {
      status: result.status,
      headers: { "Cache-Control": "no-store" },
    });
  }

  return Response.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ assignmentId: string }> }
) {
  const auth = await requireMemberFromRequest(request);
  if (!auth.ok) return memberErrorResponse(auth);

  let payload: MonthlyQuestionReflectionSavePayload;
  try {
    payload = (await request.json()) as MonthlyQuestionReflectionSavePayload;
  } catch {
    return Response.json(
      {
        ok: false,
        code: "invalid_json",
        message: "A valid reflection request is required.",
      },
      { status: 400 }
    );
  }

  const { assignmentId } = await context.params;
  const result = await saveMemberMonthlyQuestionReflection(
    auth,
    assignmentId,
    payload?.reflectionBody
  );

  if (!result.ok) {
    return Response.json(result, {
      status: result.status,
      headers: { "Cache-Control": "no-store" },
    });
  }

  return Response.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
