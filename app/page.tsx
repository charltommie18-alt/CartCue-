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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="ml-2 rounded-md bg-black px-3 py-1 text-xs font-bold text-white"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [kit, setKit] = useState<Kit | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  return (
    <main className="min-h-screen bg-neutral-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold">Cart<span className="text-orange-600">Cue</span></h1>
          <AccountLinks />
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-8">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-600">AMAZON CONTENT ASSISTANT</p>
          <h2 className="mt-2 text-4xl font-black leading-tight tracking-tight">Turn an Amazon product into ready-to-post social content.</h2>

          <div className="mt-6 rounded-2xl border bg-white p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-bold flex items-center gap-2">🔓 {isPro ? 'Pro Active' : 'Unlock Pro'}</p>
                <p className="text-xs text-neutral-500 mt-1">Unlimited kits, save history. Billed via Amazon.</p>
              </div>
              <button
                onClick={() => {
                  if ((window as any).AmazonIAP) {
                    (window as any).AmazonIAP.purchase('cartcue_pro_monthly');
                  } else {
                    window.open('https://www.amazon.com/gp/mas/dl/android?p=com.cartcue.app', '_blank');
                  }
                }}
                className="shrink-0 rounded-full bg-orange-500 px-5 py-3 text-sm font-bold text-white"
              >
                {isPro ? 'Active ✓' : 'Subscribe $4.99/month via Amazon'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 max-w-2xl">
          <ProductForm loading={loading} onGenerate={handleGenerate} />
          {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {kit && (
            <div className="mt-8 space-y-6">
              <div className="rounded-xl border bg-white p-5">
                <h3 className="font-bold">📦 {kit.productName || 'Product'}</h3>
                <div className="mt-3 flex gap-2">
                  <input value={kit.affiliateLink || kit.amazonUrl || ''} readOnly className="flex-1 rounded-lg border bg-neutral-50 px-3 py-2 text-sm" />
                  <CopyButton text={kit.affiliateLink || kit.amazonUrl || ''} />
                </div>
              </div>

              <div className="rounded-xl border bg-white p-5 space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold">Captions</h4>
                    <CopyButton text={(kit.captions || kit.descriptions || []).join('\n\n')} />
                  </div>
                  {(kit.captions || kit.descriptions || []).map((c: string, i: number) => (
                    <div key={i} className="mt-3 flex gap-2 rounded-lg bg-neutral-50 p-3">
                      <p className="flex-1 text-sm">"{c}"</p>
                      <CopyButton text={c} />
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold">Hooks</h4>
                    <CopyButton text={(kit.reelHooks || kit.hooks || []).join('\n')} />
                  </div>
                  {(kit.reelHooks || kit.hooks || []).map((h: string, i: number) => (
                    <div key={i} className="mt-3 flex gap-2 rounded-lg bg-neutral-50 p-3">
                      <p className="flex-1 text-sm">"{h}"</p>
                      <CopyButton text={h} />
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold">Hashtags</h4>
                    <CopyButton text={(kit.hashtags || []).join(' ')} />
                  </div>
                  <p className="mt-3 rounded-lg bg-neutral-50 p-3 text-sm">{(kit.hashtags || []).join(' ')}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
          }
