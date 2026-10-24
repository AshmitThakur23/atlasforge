"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function plural(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function ValueOrMissing({ children }) {
  return children ? children : <span className="italic text-slate-400">Not found</span>;
}

function PaperList({ items, numbered = false }) {
  if (!items?.length) return <ValueOrMissing />;
  const Tag = numbered ? "ol" : "ul";
  return (
    <Tag className={`space-y-1 ${numbered ? "list-decimal pl-5" : "list-disc pl-5"}`}>
      {items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
    </Tag>
  );
}

function SkeletonCards() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((item) => (
        <div key={item} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6">
          <div className="h-3 w-1/4 rounded bg-slate-200" />
          <div className="mt-4 h-6 w-3/4 rounded bg-slate-200" />
          <div className="mt-3 h-4 w-1/2 rounded bg-slate-200" />
          <div className="mt-6 h-3 w-full rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function PaperCard({ paper }) {
  const [expanded, setExpanded] = useState(false);
  const authors = paper.authors?.length
    ? `${paper.authors.slice(0, 3).join(", ")}${paper.authors.length > 3 ? " et al." : ""}`
    : null;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>#{paper.id}</span>
        <div className="flex min-w-0 items-center gap-2">
          <span className={`rounded-full px-2 py-1 font-semibold ${paper.source_type === "pdf" ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>
            {paper.source_type === "pdf" ? "PDF" : "Text"}
          </span>
          {paper.source_name && <span className="max-w-40 truncate">{paper.source_name}</span>}
        </div>
      </div>
      <h2 className="mt-4 font-serif text-2xl font-bold text-slate-900">{paper.title}</h2>
      <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
        <p><span className="font-semibold text-slate-700">Authors: </span><ValueOrMissing>{authors}</ValueOrMissing></p>
        <p><span className="font-semibold text-slate-700">Year: </span><ValueOrMissing>{paper.publication_year}</ValueOrMissing></p>
        <p className="text-xs text-slate-500 sm:col-span-2">Saved {new Date(paper.created_at).toLocaleString()}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {paper.keywords?.map((keyword) => <span key={keyword} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700">{keyword}</span>)}
      </div>
      <p className="mt-4 text-xs text-slate-500">
        {plural(paper.claims?.length || 0, "claim")} ·{" "}
        {plural(paper.methods?.length || 0, "method")} ·{" "}
        {plural(paper.limitations?.length || 0, "limitation")}
      </p>
      {paper.missing_fields?.length > 0 && (
        <p className="mt-3 text-xs text-amber-700">Missing: {paper.missing_fields.join(", ")}</p>
      )}
      <button
        className="mt-5 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && (
        <div className="mt-5 grid gap-5 border-t border-slate-100 pt-5 text-sm text-slate-600 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <h3 className="font-semibold text-slate-700">Research question</h3>
            <p className="mt-1"><ValueOrMissing>{paper.research_question}</ValueOrMissing></p>
          </div>
          <div><h3 className="font-semibold text-slate-700">Claims</h3><div className="mt-1"><PaperList items={paper.claims} numbered /></div></div>
          <div><h3 className="font-semibold text-slate-700">Methods</h3><div className="mt-1"><PaperList items={paper.methods} /></div></div>
          <div><h3 className="font-semibold text-slate-700">Limitations</h3><div className="mt-1"><PaperList items={paper.limitations} /></div></div>
        </div>
      )}
    </article>
  );
}

async function requestPapers(query = "") {
  try {
    const params = query ? `?q=${encodeURIComponent(query)}` : "";
    const response = await fetch(`/api/papers${params}`, { cache: "no-store" });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      return { ok: false, error: result.error || "Could not load papers." };
    }
    return { ok: true, papers: result.papers, count: result.count };
  } catch (error) {
    return {
      ok: false,
      error: "Could not reach the server. Please try again.",
    };
  }
}

export default function PapersPage() {
  const [papers, setPapers] = useState([]);
  const [count, setCount] = useState(0);
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  function applyResult(result) {
    if (result.ok) {
      setPapers(result.papers);
      setCount(result.count);
      setError("");
      setStatus("ready");
    } else {
      setError(result.error);
      setStatus("error");
    }
  }

  useEffect(() => {
    let ignore = false;
    requestPapers("").then((result) => {
      if (!ignore) applyResult(result);
    });
    return () => {
      ignore = true;
    };
  }, []);

  async function search(event) {
    event?.preventDefault();
    const nextQuery = query.trim();
    setActiveQuery(nextQuery);
    setStatus("loading");
    applyResult(await requestPapers(nextQuery));
  }

  async function clearSearch() {
    setQuery("");
    setActiveQuery("");
    setStatus("loading");
    applyResult(await requestPapers());
  }

  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-serif text-4xl font-bold text-slate-900">My Papers</h1>
          <p className="mt-2 text-slate-600">All research papers saved to the database.</p>
        </div>
        <span className="w-fit rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">{count} saved</span>
      </section>

      <form className="flex flex-col gap-2 sm:flex-row" onSubmit={search}>
        <label className="sr-only" htmlFor="paper-search">Search by title</label>
        <input
          id="paper-search"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          placeholder="Search by title…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700" type="submit">Search</button>
        <button className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="button" onClick={clearSearch}>Clear</button>
      </form>

      {status === "loading" && <SkeletonCards />}
      {status === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">
          <p>{error}</p>
          <button
            className="mt-3 font-semibold underline"
            onClick={async () => {
              setStatus("loading");
              applyResult(await requestPapers(activeQuery));
            }}
          >
            Try again
          </button>
        </div>
      )}
      {status === "ready" && papers.length === 0 && !activeQuery && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h2 className="font-serif text-2xl font-bold text-slate-900">No papers saved yet.</h2>
          <Link className="mt-5 inline-block rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700" href="/">Analyze your first paper</Link>
        </div>
      )}
      {status === "ready" && papers.length === 0 && activeQuery && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
          <p>No papers match &quot;{activeQuery}&quot;.</p>
          <button className="mt-4 font-semibold text-indigo-600 underline" onClick={clearSearch}>Clear</button>
        </div>
      )}
      {status === "ready" && papers.length > 0 && (
        <div className="space-y-4">{papers.map((paper) => <PaperCard key={paper.id} paper={paper} />)}</div>
      )}
    </div>
  );
}
