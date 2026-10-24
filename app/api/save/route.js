import { getSupabase, TABLE_NAME } from "../../../lib/supabase.js";
import { SaveSchema, formatZodErrors } from "../../../lib/schema.js";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return Response.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  try {
    if (!body?.data || !body?.source) {
      return Response.json(
        { ok: false, error: "Missing data or source." },
        { status: 400 }
      );
    }

    const record = {
      title: body.data.title,
      authors: body.data.authors,
      publication_year: body.data.publication_year,
      research_question: body.data.research_question,
      claims: body.data.claims,
      methods: body.data.methods,
      limitations: body.data.limitations,
      keywords: body.data.keywords,
      missing_fields: body.data.missing_fields,
      source_type: body.source.type,
      source_name: body.source.name ?? null,
    };
    const result = SaveSchema.safeParse(record);

    if (!result.success) {
      return Response.json(
        {
          ok: false,
          error: "Cannot save: required information is missing or invalid.",
          details: formatZodErrors(result.error),
        },
        { status: 422 }
      );
    }

    const { data: saved, error } = await getSupabase()
      .from(TABLE_NAME)
      .insert(result.data)
      .select()
      .single();

    if (error) {
      console.error("Database save failed:", error);
      return Response.json(
        {
          ok: false,
          error: "Could not save to the database. Please try again.",
        },
        { status: 500 }
      );
    }

    return Response.json(
      { ok: true, message: "Saved successfully", record: saved },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected save error:", error);
    return Response.json(
      { ok: false, error: "Something went wrong on the server." },
      { status: 500 }
    );
  }
}
