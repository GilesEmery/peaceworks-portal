import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return Response.json(
      {
        ok: false,
        database: {
          querySucceeded: false,
        },
        error: "Supabase environment is not configured.",
      },
      { status: 503 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { count, error } = await supabase
    .from("peace_assessment_results")
    .select("id", { count: "exact", head: true })
    .limit(1);

  if (error) {
    return Response.json(
      {
        ok: false,
        database: {
          querySucceeded: false,
        },
        error: "Supabase health query failed.",
      },
      { status: 503 }
    );
  }

  return Response.json(
    {
      ok: true,
      database: {
        querySucceeded: true,
        count,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
