"use client";

import Link from "next/link";
import { useState } from "react";

const MAX_FILE_SIZE = 4 * 1024 * 1024;

function FieldValue({ children }) {
  return children ? (
    children
  ) : (
    <span className="italic text-slate-400">Not found</span>
  );
}

function ListValue({ items, numbered = false }) {
  if (!items?.length) return <FieldValue />;
  const Tag = numbered ? "ol" : "ul";
  return (
    <Tag className={`space-y-1 ${numbered ? "list-decimal pl-5" : "list-disc pl-5"}`}>
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </Tag>
  );
}

export default function Home() {
  const [mode, setMode] = useState("pdf");
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [state, setState] = useState("input");
  const [error, setError] = useState(null);
  const [extracted, setExtracted] = useState(null);
  const [savedRecord, setSavedRecord] = useState(null);

  function clearError() {
    setError(null);
  }

  function reset() {
    setMode("pdf");
    setFile(null);
    setText("");
    setState("input");
    setError(null);
    setExtracted(null);
    setSavedRecord(null);
  }

  function chooseMode(nextMode) {
    setMode(nextMode);
    setFile(null);
    setText("");
    clearError();
  }

  function handleFileChange(event) {
    const selected = event.target.files?.[0] || null;
    setFile(selected);
    clearError();
    if (!selected) return;
    if (
      selected.type !== "application/pdf" &&
      !selected.name.toLowerCase().endsWith(".pdf")
    ) {
      setError({ message: "Only PDF files are supported." });
    } else if (selected.size > MAX_FILE_SIZE) {
      setError({ message: "PDF is too large. Maximum size is 4 MB." });
    } else if (selected.size === 0) {
      setError({ message: "The uploaded file is empty." });
    }
  }

  async function analyze() {
    clearError();
    if (mode === "pdf") {
      if (!file) {
        setError({ message: "Please upload a PDF or paste some text." });
        return;
      }
      if (
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
      ) {
        setError({ message: "Only PDF files are supported." });
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError({ message: "PDF is too large. Maximum size is 4 MB." });
        return;
      }
      if (file.size === 0) {
        setError({ message: "The uploaded file is empty." });
        return;
      }
    } else if (text.trim().length < 200) {
      setError({
        message:
          "Text is too short. Please paste at least 200 characters (for example the abstract).",
      });
      return;
    }

    setState("analyzing");
    const formData = new FormData();
    if (mode === "pdf") formData.set("file", file);
    else formData.set("text", text);

    try {
      const response = await fetch("/api/extract", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        setError({ message: result.error || "Analysis failed.", details: result.details });
        setState("input");
        return;
      }
      setExtracted(result);
      setState("preview");
    } catch (requestError) {
      setError({
        message: "Could not reach the server. Check your connection and try again.",
      });
      setState("input");
    }
  }

  async function save() {
    if (!extracted?.can_save || state === "saving") return;
    clearError();
    setState("saving");
    try {
      const response = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: extracted.data,
          source: extracted.source,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        setError({ message: result.error || "Could not save the record.", details: result.details });
        setState("preview");
        return;
      }
      setSavedRecord(result.record);
      setState("saved");
    } catch (requestError) {
      setError({
        message: "Could not reach the server. Check your connection and try again.",
      });
      setState("preview");
    }
  }

  const data = extracted?.data;
  const formatSize = file
    ? file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(1)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`
    : "";

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700">
          Research knowledge, organized
        </p>
        <h1 className="max-w-3xl font-serif text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
          Turn a research paper into structured knowledge
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-slate-600">
          Upload a PDF or paste text. Gemini extracts the title, claims, methods,
          limitations and keywords into a fixed schema, you review it, then it is
          saved to the database.
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 sm:grid-cols-5">
          {["Upload", "AI extraction", "Schema validation", "Your review", "Saved to database"].map(
            (step, index) => (
              <div key={step} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <span className="mr-1 font-bold text-indigo-600">{index + 1}.</span>
                {step}
              </div>
            )
          )}
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800" role="alert">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium">{error.message}</p>
              {error.details && (
                <ul className="mt-2 list-disc pl-5 text-sm">
                  {error.details.map((detail) => <li key={detail}>{detail}</li>)}
                </ul>
              )}
            </div>
            <button className="text-xs font-semibold underline" onClick={clearError}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {(state === "input" || state === "analyzing") && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex gap-2 rounded-lg bg-slate-100 p-1">
            {["pdf", "text"].map((option) => (
              <button
                key={option}
                onClick={() => chooseMode(option)}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold ${
                  mode === option ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"
                }`}
              >
                {option === "pdf" ? "Upload PDF" : "Paste text"}
              </button>
            ))}
          </div>
          <div className="mt-6">
            {mode === "pdf" ? (
              <label className="block text-sm font-medium text-slate-700">
                Research paper PDF
                <input
                  className="mt-2 block w-full cursor-pointer rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  disabled={state === "analyzing"}
                />
                {file && <span className="mt-2 block text-slate-500">{file.name} · {formatSize}</span>}
              </label>
            ) : (
              <label className="block text-sm font-medium text-slate-700">
                Research paper text
                <textarea
                  className="mt-2 block min-h-60 w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  rows="10"
                  placeholder="Paste the abstract or full text of a research paper (minimum 200 characters)"
                  value={text}
                  onChange={(event) => { setText(event.target.value); clearError(); }}
                  disabled={state === "analyzing"}
                />
                <span className={`mt-2 block text-xs ${text.trim().length >= 200 ? "text-green-600" : "text-slate-400"}`}>
                  {text.length} / 200 minimum
                </span>
              </label>
            )}
          </div>
          <button
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={analyze}
            disabled={state === "analyzing"}
          >
            {state === "analyzing" && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            {state === "analyzing" ? "Analyzing with Gemini…" : "Analyze with AI"}
          </button>
          {state === "analyzing" && (
            <p className="mt-3 text-center text-sm text-slate-500">
              Analyzing with Gemini… this usually takes 10–30 seconds.
            </p>
          )}
        </section>
      )}

      {state === "preview" || state === "saving" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-2xl font-bold text-slate-900">Review extracted data</h2>
            <div className="flex gap-2 text-xs font-semibold">
              <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">✓ Schema valid</span>
              {!extracted.can_save && <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">Cannot save</span>}
            </div>
          </div>
          {extracted.model_used && (
            <p className="mt-2 text-xs text-slate-500">Extracted by {extracted.model_used}</p>
          )}
          {data.missing_fields.length > 0 && (
            <div className="mt-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold">Not found in the document (left empty, not guessed):</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {data.missing_fields.map((field) => <span key={field} className="rounded-full bg-amber-100 px-2 py-1 text-xs">{field}</span>)}
              </div>
            </div>
          )}
          {extracted.missing_required.length > 0 && (
            <div className="mt-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">Required to save: {extracted.missing_required.join(", ")}</p>
              <p>Try a clearer document or paste the abstract including the title.</p>
            </div>
          )}
          <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-2">
            <div><dt className="font-semibold text-slate-500">Title</dt><dd className="mt-1 text-base"><FieldValue>{data.title}</FieldValue></dd></div>
            <div><dt className="font-semibold text-slate-500">Authors</dt><dd className="mt-1"><FieldValue>{data.authors.join(", ")}</FieldValue></dd></div>
            <div><dt className="font-semibold text-slate-500">Publication year</dt><dd className="mt-1"><FieldValue>{data.publication_year}</FieldValue></dd></div>
            <div className="sm:col-span-2"><dt className="font-semibold text-slate-500">Research question</dt><dd className="mt-1"><FieldValue>{data.research_question}</FieldValue></dd></div>
            <div><dt className="font-semibold text-slate-500">Claims</dt><dd className="mt-1"><ListValue items={data.claims} numbered /></dd></div>
            <div><dt className="font-semibold text-slate-500">Methods</dt><dd className="mt-1"><ListValue items={data.methods} /></dd></div>
            <div><dt className="font-semibold text-slate-500">Limitations</dt><dd className="mt-1"><ListValue items={data.limitations} /></dd></div>
            <div><dt className="font-semibold text-slate-500">Keywords</dt><dd className="mt-2 flex flex-wrap gap-2">{data.keywords.length ? data.keywords.map((keyword) => <span key={keyword} className="rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-700">{keyword}</span>) : <FieldValue />}</dd></div>
          </dl>
          <details className="mt-6 rounded-lg bg-slate-50 p-3">
            <summary className="cursor-pointer text-sm font-semibold">View structured JSON output</summary>
            <pre className="mt-3 overflow-x-auto text-xs text-slate-600">{JSON.stringify(data, null, 2)}</pre>
          </details>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60" onClick={save} disabled={!extracted.can_save || state === "saving"}>
              {state === "saving" ? "Saving…" : "Confirm & Save"}
            </button>
            <button className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50" onClick={reset} disabled={state === "saving"}>Discard</button>
          </div>
          <p className="mt-3 text-xs text-slate-500">Nothing is saved until you click Confirm &amp; Save.</p>
        </section>
      ) : null}

      {state === "saved" && savedRecord && (
        <section className="rounded-2xl border border-green-200 bg-green-50 p-7 shadow-sm">
          <h2 className="font-serif text-2xl font-bold text-green-900">Saved to database</h2>
          <p className="mt-2 text-green-800">
            Record #{savedRecord.id} created at {new Date(savedRecord.created_at).toLocaleString()}.
          </p>
          <p className="mt-5 rounded-lg bg-white p-4 font-semibold text-slate-800">{savedRecord.title}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link className="rounded-lg bg-indigo-600 px-5 py-3 text-center font-semibold text-white hover:bg-indigo-700" href="/papers">View in My Papers</Link>
            <button className="rounded-lg border border-green-300 px-5 py-3 font-semibold text-green-800 hover:bg-white" onClick={reset}>Analyze another paper</button>
          </div>
        </section>
      )}
    </div>
  );
}
