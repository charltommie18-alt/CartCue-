'use client';
import { useState } from "react";
import ProductForm from "@/components/product-form";
import AccountLinks from "@/components/account-links";

type Kit = any;

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setOk(true);
        setTimeout(() => setOk(false), 1200);
      }}
      className="rounded bg-black px-3 py-1 text-xs font-bold text-white"
    >
      {ok ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [kit, setKit] = useState<Kit | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
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
          <h2 className="mt-2 text-4xl font-black leading-tight">Turn an Amazon product into ready-to-post social content.</h2>
          
          <div className="mt-6 rounded-2xl border bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-sm">Unlock Pro</p>
                <p className="text-xs text-neutral-500">Unlimited kits, save history. Billed via Amazon.</p>
              </div>
              <button
                onClick={() => window.open('https://www.amazon.com/gp/mas/dl/android?p=com.cartcue.app', '_blank')}
                className="rounded-full bg-orange-500 px-5 py-3 text-sm font-bold text-white"
              >
                Subscribe $4.99/month via Amazon
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 max-w-2xl">
          <ProductForm loading={loading} onGenerate={handleGenerate} />
          {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {kit && (
            <div className="mt-8 space-y-4">
              <div className="rounded-xl border bg-white p-4">
                <p className="font-bold text-sm">Affiliate Link</p>
                <div className="mt-2 flex gap-2">
                  <input value={kit.affiliateLink || kit.amazonUrl || ''} readOnly className="flex-1 rounded-lg border bg-neutral-50 px-3 py-2 text-sm" />
                  <CopyBtn text={kit.affiliateLink || kit.amazonUrl || ''} />
                </div>
              </div>

              <div className="rounded-xl border bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm">Captions</p>
                  <CopyBtn text={(kit.captions || []).join('\n\n')} />
                </div>
                {(kit.captions || []).map((c: string, i: number) => (
                  <div key={i} className="mt-3 flex gap-2 rounded-lg bg-neutral-50 p-3">
                    <p className="flex-1 text-sm">{c}</p>
                    <CopyBtn text={c} />
                  </div>
                ))}

                <div className="mt-6 flex items-center justify-between">
                  <p className="font-bold text-sm">Hooks</p>
                  <CopyBtn text={(kit.reelHooks || kit.hooks || []).join('\n')} />
                </div>
                {(kit.reelHooks || kit.hooks || []).map((h: string, i: number) => (
                  <div key={i} className="mt-3 flex gap-2 rounded-lg bg-neutral-50 p-3">
                    <p className="flex-1 text-sm">{h}</p>
                    <CopyBtn text={h} />
                  </div>
                ))}

                <div className="mt-6 flex items-center justify-between">
                  <p className="font-bold text-sm">Hashtags</p>
                  <CopyBtn text={(kit.hashtags || []).join(' ')} />
                </div>
                <p className="mt-3 rounded-lg bg-neutral-50 p-3 text-sm">{(kit.hashtags || []).join(' ')}</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
      }
