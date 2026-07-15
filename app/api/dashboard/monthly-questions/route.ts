import { fetchMemberMonthlyQuestions } from "../../../../lib/coach/monthlyQuestions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const result = await fetchMemberMonthlyQuestions(request);

    if (!result.ok) {
      return Response.json(
        {
          ok: false,
          error: result.code,
          code: result.code,
          message: result.message,
        },
        { status: result.status }
      );
    }

    return Response.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Dashboard monthly questions load failed", error);

    return Response.json(
      {
        ok: false,
        error: "monthly_questions_unavailable",
        code: "monthly_questions_unavailable",
        message: "Monthly questions are not available yet.",
      },
      { status: 503 }
    );
  }
}
