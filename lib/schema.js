import { z } from "zod";

export const EXTRACTION_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    is_research_paper: {
      type: "boolean",
      description: "Whether the document is research or academic content.",
    },
    title: {
      type: ["string", "null"],
      description: "The exact research paper title, or null if not found.",
    },
    authors: {
      type: "array",
      items: { type: "string" },
      description: "Full author names in the order they appear.",
    },
    publication_year: {
      type: ["integer", "null"],
      description: "The explicitly stated publication year, or null if not found.",
    },
    research_question: {
      type: ["string", "null"],
      description: "The main research question or objective in one sentence.",
    },
    claims: {
      type: "array",
      items: { type: "string" },
      maxItems: 5,
      description: "Up to five main findings or contributions.",
    },
    methods: {
      type: "array",
      items: { type: "string" },
      maxItems: 5,
      description: "Up to five methods, datasets, or techniques used.",
    },
    limitations: {
      type: "array",
      items: { type: "string" },
      maxItems: 5,
      description: "Up to five limitations explicitly stated by the authors.",
    },
    keywords: {
      type: "array",
      items: { type: "string" },
      maxItems: 8,
      description: "Short keywords or key phrases describing the paper.",
    },
    missing_fields: {
      type: "array",
      items: { type: "string" },
      description: "Names of fields that could not be found in the document.",
    },
  },
  required: [
    "is_research_paper",
    "title",
    "authors",
    "publication_year",
    "research_question",
    "claims",
    "methods",
    "limitations",
    "keywords",
    "missing_fields",
  ],
};

export const ExtractionSchema = z.object({
  is_research_paper: z.boolean(),
  title: z.string().trim().min(1).nullable(),
  authors: z.array(z.string().trim().min(1)),
  publication_year: z.number().int().min(1900).max(2100).nullable(),
  research_question: z.string().trim().min(1).nullable(),
  claims: z.array(z.string().trim().min(1)).max(5),
  methods: z.array(z.string().trim().min(1)).max(5),
  limitations: z.array(z.string().trim().min(1)).max(5),
  keywords: z.array(z.string().trim().min(1)).max(8),
  missing_fields: z.array(z.string()),
});

export const SaveSchema = z.object({
  title: z
    .string()
    .nullable()
    .optional()
    .refine(
      (value) => typeof value === "string" && value.trim().length >= 3,
      { message: "Title is required to save" }
    ),
  authors: z.array(z.string()),
  publication_year: z.number().int().min(1900).max(2100).nullable(),
  research_question: z.string().nullable(),
  claims: z
    .array(z.string().trim().min(1))
    .min(1, "At least one claim is required to save")
    .max(5),
  methods: z.array(z.string()).max(5),
  limitations: z.array(z.string()).max(5),
  keywords: z.array(z.string()).max(8),
  missing_fields: z.array(z.string()),
  source_type: z.enum(["pdf", "text"]),
  source_name: z.string().max(200).nullable(),
});

export function formatZodErrors(error) {
  return error.issues.map((issue) => {
    const path = issue.path.join(".");
    return `${path || "value"}: ${issue.message}`;
  });
}
