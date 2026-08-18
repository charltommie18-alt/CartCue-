'use client';

import { useState } from "react";
import ProductForm from "@/components/product-form";
import AccountLinks from "@/components/account-links";

// adjust this to match your ProductForm's expected input type
type GeneratorInput = {
  productUrl?: string;
  productDescription?: string;
  style?: string;
  platform?: string;
  [key: string]: any;
};

type GeneratedContent = {
  caption?: string;
  hooks?: string[];
  hashtags?: string[];
  ideas?: string[];
  [key: string]: any;
} | null;

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedContent>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (input: GeneratorInput) => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Failed to generate");
      }

      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-100">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-neutral-900">
            Cart<span className="text-orange-600">Cue</span>
          </h1>
          <AccountLinks />
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
            Amazon content assistant
          </p>

          <h2 className="mt-2 text-4xl font-bold tracking-tight text-neutral-900">
            Turn an Amazon product into ready-to-post social content.
          </h2>

          <p className="mt-4 text-lg text-neutral-600">
            Enter a product, choose your style and generate captions,
            hooks, hashtags and content ideas for social media.
          </p>
        </div>

        <div className="mt-8">
          {/* FIX: pass the required props */}
          <ProductForm loading={loading} onGenerate={handleGenerate} />
          
          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
              <h3 className="font-semibold text-neutral-900">Generated Content</h3>
              <pre className="mt-4 whitespace-pre-wrap text-sm text-neutral-700">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </section>
    </main>
  );
                        }
