import { callGemini } from "../../../lib/gemini.js";
import {
  ExtractionSchema,
  formatZodErrors,
} from "../../../lib/schema.js";
import { MAX_INPUT_CHARS } from "../../../lib/prompt.js";

const MISSING_FIELD_NAMES = [
  "title",
  "authors",
  "publication_year",
  "research_question",
  "claims",
  "methods",
  "limitations",
  "keywords",
];

function jsonError(error, status, details) {
  return Response.json(
    details ? { ok: false, error, details } : { ok: false, error },
    { status }
  );
}

export async function POST(request) {
  try {
    let formData;
    try {
      formData = await request.formData();
    } catch (error) {
      console.error("Failed to parse extraction form data:", error);
      return jsonError("Invalid form data.", 400);
    }

    const file = formData.get("file");
    const textValue = formData.get("text");
    const hasFile = file instanceof File;
    const hasText = typeof textValue === "string" && textValue.trim().length > 0;

    if (!hasFile && !hasText) {
      return jsonError("Please upload a PDF or paste some text.", 400);
    }

    let pdfBase64;
    let source;
    let inputText;

    if (hasFile) {
      const isPdf =
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) {
        return jsonError("Only PDF files are supported.", 400);
      }
      if (file.size > 4 * 1024 * 1024) {
        return jsonError("PDF is too large. Maximum size is 4 MB.", 400);
      }
      if (file.size === 0) {
        return jsonError("The uploaded file is empty.", 400);
      }

      pdfBase64 = Buffer.from(await file.arrayBuffer()).toString("base64");
      source = { type: "pdf", name: file.name || null };
    } else {
      inputText = textValue.trim();
      if (inputText.length < 200) {
        return jsonError(
          "Text is too short. Please paste at least 200 characters (for example the abstract).",
          400
        );
      }
      inputText = inputText.slice(0, MAX_INPUT_CHARS);
      source = { type: "text", name: null };
    }

    let rawResult;
    try {
      rawResult = await callGemini({ pdfBase64, text: inputText });
    } catch (error) {
      const status =
        error.code === "CONFIG"
          ? 500
          : error.code === "RATE_LIMIT"
            ? 429
            : error.code === "AI_BUSY"
              ? 503
              : 502;
      return jsonError(error.message, status);
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(rawResult.text);
    } catch (error) {
      console.error("Failed to parse Gemini JSON output:", error);
      return jsonError(
        "The AI returned invalid output. Please try again.",
        502
      );
    }

    const result = ExtractionSchema.safeParse(parsedResult);
    if (!result.success) {
      return jsonError(
        "The AI output did not match the required schema.",
        422,
        formatZodErrors(result.error)
      );
    }

    const data = result.data;
    if (!data.is_research_paper) {
      return jsonError(
        "This does not look like a research paper. Please upload an academic paper or abstract.",
        422
      );
    }

    const serverMissingFields = MISSING_FIELD_NAMES.filter((field) => {
      const value = data[field];
      return value === null || (Array.isArray(value) && value.length === 0);
    });
    const mergedMissingFields = [
      ...new Set([
        ...data.missing_fields.filter((field) =>
          MISSING_FIELD_NAMES.includes(field)
        ),
        ...serverMissingFields,
      ]),
    ];
    const missingRequired = [];
    if (data.title === null) {
      missingRequired.push("title");
    }
    if (data.claims.length === 0) {
      missingRequired.push("claims");
    }

    return Response.json({
      ok: true,
      data: {
        ...data,
        missing_fields: mergedMissingFields,
      },
      missing_required: missingRequired,
      can_save: missingRequired.length === 0,
      model_used: rawResult.model,
      source,
    });
  } catch (error) {
    console.error("Unexpected extraction error:", error);
    return jsonError("Something went wrong on the server.", 500);
  }
}
