"use client";

import { useEffect, useState } from "react";

const DEFAULTS = {
  amazon: "https://www.amazon.com",
  instagram: "https://www.instagram.com",
};

type Links = typeof DEFAULTS;

export default function AccountLinks() {
  const [links, setLinks] = useState<Links>(DEFAULTS);
  const [draft, setDraft] = useState<Links>(DEFAULTS);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("cartcue_links");
      if (raw) {
        const parsed = { ...DEFAULTS, ...JSON.parse(raw) } as Links;
        setLinks(parsed);
        setDraft(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  function save() {
    try {
      window.localStorage.setItem("cartcue_links", JSON.stringify(draft));
      setLinks(draft);
    } catch {
      // ignore
    }
    setEditing(false);
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={links.amazon}
          target="_blank"
          rel="noreferrer"
          className="min-w-[140px] flex-1 rounded-md bg-amber-400 px-4 py-2.5 text-center text-sm font-semibold text-neutral-900 hover:bg-amber-500"
        >
          🛒 Open Amazon
        </a>
        <a
          href={links.instagram}
          target="_blank"
          rel="noreferrer"
          className="min-w-[140px] flex-1 rounded-md bg-gradient-to-r from-pink-600 to-purple-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:opacity-90"
        >
          📸 Open Instagram
        </a>
        <button
          onClick={() => {
            setDraft(links);
            setEditing((e) => !e);
          }}
          className="text-sm font-medium text-neutral-600 hover:underline"
        >
          {editing ? "Close" : "Customize links"}
        </button>
      </div>

      {editing && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">
              Your Amazon link (storefront / Associates page)
            </span>
            <input
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              value={draft.amazon}
              onChange={(e) => setDraft({ ...draft, amazon: e.target.value })}
              placeholder="https://www.amazon.com/shop/yourname"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">
              Your Instagram link
            </span>
            <input
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              value={draft.instagram}
              onChange={(e) => setDraft({ ...draft, instagram: e.target.value })}
              placeholder="https://www.instagram.com/yourname"
            />
          </label>
          <div>
            <button
              onClick={save}
              className="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
            >
              Save links
            </button>
          </div>
        </div>
      )}

      <p className="mt-3 text-xs text-neutral-500">
        Flow: open Amazon → copy product info into the form → generate → open
        Instagram → paste. Full auto-import and auto-posting come later with
        the official APIs.
      </p>
    </div>
  );
}
