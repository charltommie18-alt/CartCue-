"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import type { GeneratorInput } from "@/lib/types";
import { STYLES, TONES } from "@/lib/schema";

const inputCls =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-neutral-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function extractAsin(url: string): string | null {
  const m =
    url.match(/\/(?:dp|gp\/product|gp\/aw\/d|product)\/([A-Z0-9]{10})/i) ||
    url.match(/\b([A-Z0-9]{10})\b/);
  return m ? m[1].toUpperCase() : null;
}

const initial = {
  productName: "",
  amazonUrl: "",
  affiliateUrl: "",
  asin: "",
  price: "",
  category: "",
  imageUrl: "",
  description: "",
  targetAudience: "",
  mainBenefit: "",
};

export default function ProductForm({
  loading,
  onGenerate,
}: {
  loading: boolean;
  onGenerate: (input: GeneratorInput) => void;
}) {
  const [form, setForm] = useState(initial);
  const [style, setStyle] = useState<string>(STYLES[0]);
  const [tone, setTone] = useState<string>(TONES[0]);
  const [includeDisclosure, setIncludeDisclosure] = useState(true);
  const [importUrl, setImportUrl] = useState("");
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const set =
    (key: keyof typeof initial) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  function handleImport() {
    const asin = extractAsin(importUrl);
    if (!asin) {
      setImportMsg("Could not find an ASIN in that link.");
      return;
    }
    setForm((f) => ({
      ...f,
      asin,
      amazonUrl: importUrl,
      affiliateUrl: f.affiliateUrl || importUrl,
    }));
    setImportMsg(`Imported ASIN ${asin}. Add a name + benefit and generate.`);
  }

  function loadSample() {
    setForm({
      productName: "Portable Blender",
      amazonUrl: "https://www.amazon.com/dp/B0EXAMPLE",
      affiliateUrl: "https://amzn.to/example",
      asin: "B0EXAMPLE",
      price: "$29.99",
      category: "Kitchen",
      imageUrl: "",
      description:
        "Rechargeable portable blender for smoothies, shakes, and travel.",
      targetAudience: "busy people who want healthy drinks on the go",
      mainBenefit: "makes smoothies anywhere in seconds",
    });
    setStyle("Amazon must-have");
    setTone("Exciting");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onGenerate({ ...form, style, tone, includeDisclosure });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="h-fit space-y-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-neutral-900">Product details</h2>
        <button
          type="button"
          onClick={loadSample}
          className="text-sm font-medium text-orange-600 hover:underline"
        >
          Load sample
        </button>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <span className="mb-1 block text-sm font-medium text-neutral-700">
           Quick import from Amazon
        </span>
        <div className="flex gap-2">
          <input
            className={inputCls}
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            placeholder="Paste Amazon product link"
          />
          <button
            type="button"
            onClick={handleImport}
            className="shrink-0 rounded-md bg-amber-400 px-3 py-2 text-sm font-semibold text-neutral-900 hover:bg-amber-500"
          >
            Import
          </button>
        </div>
        {importMsg && (
          <p className="mt-1 text-xs text-neutral-600">{importMsg}</p>
        )}
      </div>

      <Field label="Product name *">
        <input
          className={inputCls}
          value={form.productName}
          onChange={set("productName")}
          placeholder="Portable Blender"
          required
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Price">
          <input
            className={inputCls}
            value={form.price}
            onChange={set("price")}
            placeholder="$29.99"
          />
        </Field>
        <Field label="Category">
          <input
            className={inputCls}
            value={form.category}
            onChange={set("category")}
            placeholder="Kitchen"
          />
        </Field>
      </div>

      <Field label="Amazon URL">
        <input
          className={inputCls}
          value={form.amazonUrl}
          onChange={set("amazonUrl")}
          placeholder="https://www.amazon.com/dp/..."
        />
      </Field>

      <Field label="Affiliate URL">
        <input
          className={inputCls}
          value={form.affiliateUrl}
          onChange={set("affiliateUrl")}
          placeholder="https://amzn.to/..."
        />
      </Field>

      <Field label="ASIN">
        <input
          className={inputCls}
          value={form.asin}
          onChange={set("asin")}
          placeholder="B0XXXXXXXX"
        />
      </Field>

      <Field label="Short description">
        <textarea
          className={inputCls}
          rows={2}
          value={form.description}
          onChange={set("description")}
          placeholder="What is it?"
        />
      </Field>

      <Field label="Target audience">
        <input
          className={inputCls}
          value={form.targetAudience}
          onChange={set("targetAudience")}
          placeholder="busy people who want healthy drinks"
        />
      </Field>

      <Field label="Main benefit">
        <input
          className={inputCls}
          value={form.mainBenefit}
          onChange={set("mainBenefit")}
          placeholder="makes smoothies anywhere in seconds"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Content style">
          <select
            className={inputCls}
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          >
            {STYLES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Tone">
          <select
            className={inputCls}
            value={tone}
            onChange={(e) => setTone(e.target.value)}
          >
            {TONES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={includeDisclosure}
          onChange={(e) => setIncludeDisclosure(e.target.checked)}
        />
        Include affiliate disclosure
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
      >
        {loading ? "Generating…" : "Generate content kit"}
      </button>
    </form>
  );
    }
