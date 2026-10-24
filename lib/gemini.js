import { GoogleGenAI } from "@google/genai";
import { EXTRACTION_JSON_SCHEMA } from "./schema.js";
import {
  SYSTEM_INSTRUCTION,
  buildUserPrompt,
} from "./prompt.js";

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";
export const GEMINI_FALLBACK_MODEL =
  process.env.GEMINI_FALLBACK_MODEL || "gemini-2.5-flash";

function isRetryable(error) {
  const status = Number(error?.status);
  const message = error?.message || "";
  return (
    status === 503 ||
    status === 429 ||
    status === 500 ||
    message.includes("UNAVAILABLE") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("high demand") ||
    message.includes("overloaded")
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callGemini({ pdfBase64, text }) {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error("AI service is not configured");
    error.code = "CONFIG";
    throw error;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const parts = pdfBase64
    ? [
        {
          inlineData: {
            mimeType: "application/pdf",
            data: pdfBase64,
          },
        },
        { text: buildUserPrompt("(see attached PDF)") },
      ]
    : [{ text: buildUserPrompt(text) }];

  const models = [...new Set([GEMINI_MODEL, GEMINI_FALLBACK_MODEL])];
  let lastError;
  let lastErrorWasRetryable = false;

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      if (attempt === 2) {
        await sleep(1500);
      }

      try {
        const response = await ai.models.generateContent({
          model,
          contents: [{ role: "user", parts }],
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseJsonSchema: EXTRACTION_JSON_SCHEMA,
            temperature: 0.1,
          },
        });

        return { text: response.text, model };
      } catch (error) {
        lastError = error;
        lastErrorWasRetryable = isRetryable(error);
        if (lastErrorWasRetryable) {
          console.warn(
            `Gemini ${model} attempt ${attempt} failed: ${error.status || "unknown"} — retrying`
          );
          continue;
        }
        console.error("Gemini request failed:", error);
        break;
      }
    }
  }

  const lastMessage = lastError?.message || "";
  const lastStatus = Number(lastError?.status);
  if (lastStatus === 429 || lastMessage.includes("RESOURCE_EXHAUSTED")) {
    const error = new Error(
      "AI rate limit reached. Please wait a minute and try again."
    );
    error.code = "RATE_LIMIT";
    throw error;
  }
  if (lastErrorWasRetryable) {
    const error = new Error(
      "The AI service is busy right now. Please try again in a minute."
    );
    error.code = "AI_BUSY";
    throw error;
  }

  const error = new Error("AI service failed. Please try again.");
  error.code = "AI_FAILED";
  throw error;
}
