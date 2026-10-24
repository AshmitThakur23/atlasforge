import { connection } from "next/server";
import { getSupabase, TABLE_NAME } from "../../../lib/supabase.js";

export async function GET(request) {
  await connection();

  try {
    const q = request.nextUrl.searchParams.get("q")?.trim();
    const columns =
      "id, title, authors, publication_year, research_question, claims, methods, limitations, keywords, missing_fields, source_type, source_name, created_at";
    let query = getSupabase()
      .from(TABLE_NAME)
      .select(columns)
      .order("created_at", { ascending: false })
      .limit(50);

    if (q) {
      query = query.ilike("title", `%${q.slice(0, 100)}%`);
    }

    const { data: rows, error } = await query;
    if (error) {
      console.error("Database paper lookup failed:", error);
      return Response.json(
        { ok: false, error: "Could not load papers. Please try again." },
        { status: 500 }
      );
    }

    return Response.json(
      { ok: true, count: rows.length, papers: rows },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected paper lookup error:", error);
    return Response.json(
      { ok: false, error: "Something went wrong on the server." },
      { status: 500 }
    );
  }
}
