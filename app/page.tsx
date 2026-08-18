'use client';

import { useState } from "react";
import ProductForm from "@/components/product-form";
import AccountLinks from "@/components/account-links";

type GeneratorInput = {
  productUrl?: string;
  amazonUrl?: string;
  productName?: string;
  price?: string;
  productDescription?: string;
  style?: string;
  platform?: string;
  affiliateUrl?: string;
  [key: string]: any;
};

type Kit = {
  productName?: string;
  amazonUrl?: string;
  affiliateLink?: string;
  affiliateTag?: string;
  price?: string;
  captions?: string[];
  hashtags?: string[];
  reelHooks?: string[];
  descriptions?: string[];
  hooks?: string[];
  cta?: string;
  disclosure?: string;
  reelScript?: string;
  [key: string]: any;
};

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [kit, setKit] = useState<Kit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (input: GeneratorInput) => {
    setLoading(true);
    setError(null);
    setKit(null);
    
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(errData.error || "Failed to generate");
      }

      const data = await res.json();
      // FIX: extract kit from { kit: {...} }
      setKit(data.kit || data);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (!kit?.affiliateLink) return;
    navigator.clipboard.writeText(kit.affiliateLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            Enter a product, choose your style and generate captions, hooks, hashtags and content ideas.
          </p>
        </div>

        <div className="mt-8">
          <ProductForm loading={loading} onGenerate={handleGenerate} />
          
          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {kit && (
            <div className="mt-8 space-y-6">
              {/* PRODUCT + PAYMENT LINK - FIXES YOUR 2 PROBLEMS */}
              <div className="rounded-xl border-2 border-orange-400 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold">📦 {kit.productName || 'Amazon Product'}</h3>
                {kit.price && <p className="text-sm text-neutral-600 mt-1">Price: ${kit.price}</p>}
                
                <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm font-bold text-orange-900">💰 YOUR PAYMENT LINK (you earn when they buy):</p>
                  <div className="mt-2 flex gap-2">
                    <input 
                      value={kit.affiliateLink || kit.amazonUrl || ''} 
                      readOnly 
                      className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
                    />
                    <button 
                      onClick={copyLink}
                      className="rounded-md bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <a href={kit.affiliateLink || kit.amazonUrl} target="_blank" className="mt-3 inline-block rounded-md bg-black px-4 py-2 text-sm font-bold text-white">
                    Test Link → Amazon 🛒
                  </a>
                </div>
              </div>

              {/* CONTENT */}
              <div className="rounded-lg border border-neutral-200 bg-white p-6">
                <h3 className="font-semibold">Captions</h3>
                <div className="mt-3 space-y-2">
                  {(kit.captions || kit.descriptions || []).map((c: string, i: number) => (
                    <p key={i} className="rounded bg-neutral-50 p-3 text-sm">"{c}"</p>
                  ))}
                </div>

                <h3 className="mt-6 font-semibold">Reel Hooks</h3>
                <div className="mt-3 space-y-2">
                  {(kit.reelHooks || kit.hooks || []).map((h: string, i: number) => (
                    <p key={i} className="rounded bg-neutral-50 p-3 text-sm">"{h}"</p>
                  ))}
                </div>

                <h3 className="mt-6 font-semibold">Hashtags</h3>
                <p className="mt-3 text-sm text-neutral-700">
                  {(kit.hashtags || []).join(' ')}
                </p>

                {kit.disclosure && (
                  <p className="mt-6 text-xs text-neutral-500">{kit.disclosure}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
            }
