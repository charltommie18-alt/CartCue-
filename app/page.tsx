'use client';
import { useState } from "react";
import ProductForm from "@/components/product-form";
import AccountLinks from "@/components/account-links";

type Kit = {
  productName?: string;
  amazonUrl?: string;
  affiliateLink?: string;
  price?: string;
  captions?: string[];
  hashtags?: string[];
  reelHooks?: string[];
  descriptions?: string[];
  hooks?: string[];
  disclosure?: string;
  [key: string]: any;
};

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [kit, setKit] = useState<Kit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [isPro, setIsPro] = useState(false);

  const handleGenerate = async (input: any) => {
    setLoading(true);
    setError(null);
    setKit(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setKit(data.kit || data);
    } catch (e: any) {
      setError(e.message);
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

  const handleSubscribe = async () => {
    setSubLoading(true);
    try {
      if (typeof window !== 'undefined' && (window as any).AmazonIAP) {
        const result = await (window as any).AmazonIAP.purchase('cartcue_pro_monthly');
        if (result?.success) {
          setIsPro(true);
          localStorage.setItem('cartcue_pro', 'true');
        }
      } else {
        window.open('https://www.amazon.com/gp/mas/dl/android?p=com.cartcue.app', '_blank');
      }
    } finally {
      setSubLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50">
      {/* FIXED HEADER LAYOUT */}
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">Cart<span className="text-orange-600">Cue</span></h1>
            {isPro && <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">PRO</span>}
          </div>
          <div className="flex items-center gap-4">
            <AccountLinks />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight">Turn Amazon products into ready-to-post content.</h2>
          <p className="mt-3 text-neutral-600">Paste an Amazon link, choose style, generate.</p>

          {/* CLEAN SUBSCRIPTION CARD - NO 70% */}
          <div className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{isPro ? 'CartCue Pro Active' : 'Upgrade to CartCue Pro'}</p>
                <p className="text-xs text-neutral-500 mt-1">Unlimited generations & saved kits</p>
              </div>
              <button
                onClick={handleSubscribe}
                disabled={subLoading || isPro}
                className="rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {isPro ? 'Active ✓' : subLoading ? '...' : '$4.99 / month'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 max-w-2xl">
          <ProductForm loading={loading} onGenerate={handleGenerate} />
          {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          
          {kit && (
            <div className="mt-8 space-y-4">
              <div className="rounded-xl border bg-white p-5">
                <h3 className="font-bold">📦 {kit.productName || 'Amazon Product'}</h3>
                {kit.price && <p className="text-sm text-neutral-500 mt-1">${kit.price}</p>}
                <div className="mt-4 rounded-lg bg-neutral-100 p-3 flex gap-2">
                  <input value={kit.affiliateLink || kit.amazonUrl || ''} readOnly className="flex-1 bg-white rounded-md border px-3 py-2 text-sm" />
                  <button onClick={copyLink} className="rounded-md bg-orange-600 px-4 py-2 text-sm font-bold text-white">{copied ? 'Copied' : 'Copy'}</button>
                </div>
                <a href={kit.affiliateLink || kit.amazonUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold underline">Open on Amazon →</a>
              </div>

              <div className="rounded-xl border bg-white p-5">
                <p className="font-semibold text-sm">Captions</p>
                <div className="mt-3 space-y-2">
                  {(kit.captions || kit.descriptions || []).map((c: string, i: number) => (
                    <p key={i} className="text-sm bg-neutral-50 p-3 rounded-lg">"{c}"</p>
                  ))}
                </div>
                <p className="font-semibold text-sm mt-6">Hooks</p>
                <div className="mt-3 space-y-2">
                  {(kit.reelHooks || kit.hooks || []).map((h: string, i: number) => (
                    <p key={i} className="text-sm bg-neutral-50 p-3 rounded-lg">"{h}"</p>
                  ))}
                </div>
                <p className="font-semibold text-sm mt-6">Hashtags</p>
                <p className="mt-2 text-sm text-neutral-600">{(kit.hashtags || []).join(' ')}</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
    }
