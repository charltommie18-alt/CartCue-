'use client';
import { useState } from 'react';

type Kit = {
  productName: string;
  affiliateLink: string;
  captions: string[];
  reelHooks: string[];
  hashtags: string[];
};

function SmallCopy({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(()=>setOk(false),1200); }}
      className="shrink-0 rounded-full border bg-white px-3 py-1 text-xs font-bold"
    >
      {ok ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function HomePage() {
  const [productName, setProductName] = useState('Portable Blender');
  const [amazonUrl, setAmazonUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [kit, setKit] = useState<Kit | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, amazonUrl }),
      });
      const data = await res.json();
      const k = data.kit || data;
      // ENSURE affiliate link always exists
      const link = k.affiliateLink || k.amazonUrl || amazonUrl || 'https://amzn.to/example';
      setKit({
        productName: k.productName || productName,
        affiliateLink: link,
        captions: k.captions || k.descriptions || [
          `I wasn't going to post about ${productName}... but it actually makes smoothies anywhere in seconds. Worth it at $29.99. 🛒`,
          `If you're shopping for busy people who want healthy drinks on the go, ${productName} is the Amazon find you need.`,
        ],
        reelHooks: k.reelHooks || k.hooks || [`Stop scrolling if you want something that makes smoothies in seconds.`],
        hashtags: k.hashtags || ['#amazonfinds','#portableblender','#smoothie'],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fafafa]">
      <header className="border-b bg-white px-6 py-4">
        <h1 className="text-xl font-bold">Cart<span className="text-orange-600">Cue</span></h1>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-6">
        <h2 className="text-3xl font-black leading-tight">Turn an Amazon product into ready-to-post content.</h2>

        <div className="mt-6 rounded-2xl border bg-white p-5">
          <label className="text-sm font-bold">Product name *</label>
          <input value={productName} onChange={e=>setProductName(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 text-sm" />
          
          <label className="mt-4 block text-sm font-bold">Amazon link</label>
          <input value={amazonUrl} onChange={e=>setAmazonUrl(e.target.value)} placeholder="https://amazon.com/..." className="mt-2 w-full rounded-xl border px-4 py-3 text-sm" />

          <button onClick={handleGenerate} disabled={loading} className="mt-5 w-full rounded-xl bg-black py-3.5 text-sm font-bold text-white">
            {loading ? 'Generating...' : 'Generate Content'}
          </button>
        </div>

        {kit && (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border bg-white p-5">
              <p className="font-bold">Affiliate Link</p>
              <div className="mt-3 flex gap-2">
                <input value={kit.affiliateLink} readOnly className="flex-1 rounded-full bg-neutral-100 px-4 py-2.5 text-sm" />
                <SmallCopy text={kit.affiliateLink} />
              </div>
              <a href={kit.affiliateLink} target="_blank" rel="noreferrer" className="mt-3 inline-block rounded-full bg-[#FFC83D] px-5 py-2.5 text-sm font-bold">
                🛒 Open Amazon
              </a>
            </div>

            <div className="rounded-2xl border bg-white p-5">
              <div className="flex justify-between items-center"><p className="font-bold">Captions</p><SmallCopy text={kit.captions.join('\n\n')} /></div>
              {kit.captions.map((c,i)=>(
                <div key={i} className="mt-3 rounded-xl bg-neutral-50 p-4 flex gap-3">
                  <p className="flex-1 text-sm">{c}</p>
                  <SmallCopy text={c} />
                </div>
              ))}

              <div className="mt-6 flex justify-between items-center"><p className="font-bold">Hooks</p><SmallCopy text={kit.reelHooks.join('\n')} /></div>
              {kit.reelHooks.map((h,i)=>(
                <div key={i} className="mt-3 rounded-xl bg-neutral-50 p-4 flex gap-3">
                  <p className="flex-1 text-sm">{h}</p>
                  <SmallCopy text={h} />
                </div>
              ))}

              <div className="mt-6 flex justify-between items-center"><p className="font-bold">Hashtags</p><SmallCopy text={kit.hashtags.join(' ')} /></div>
              <p className="mt-3 rounded-xl bg-neutral-50 p-4 text-sm">{kit.hashtags.join(' ')}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
