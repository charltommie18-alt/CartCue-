'use client';

function CopyBtn({ text }: { text: string }) {
  return (
    <button 
      onClick={() => navigator.clipboard.writeText(text)} 
      className="ml-2 rounded-full border bg-white px-3 py-1 text-xs font-bold hover:bg-gray-50 transition"
    >
      Copy
    </button>
  );
}

export default function OutputTabs({ kit }: any) {
  if (!kit) return null;
  
  const allText = `${kit.productName}\n${kit.affiliateLink}\n\n${kit.captions?.join('\n\n') || ''}\n\n${kit.hashtags?.join(' ') || ''}`;

  return (
    <div className="space-y-4">
      {/* Product Summary Card */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-lg">{kit.productName}</h2>
          <button 
            onClick={() => navigator.clipboard.writeText(allText)} 
            className="rounded-full border px-4 py-2 text-xs font-bold hover:bg-gray-50 transition"
          >
            Copy All
          </button>
        </div>
        
        <div className="mt-4 flex gap-4">
          <img 
            src={kit.productImage || "https://via.placeholder.com/150?text=No+Image"} 
            alt={kit.productName} 
            className="h-24 w-24 rounded-xl border object-contain bg-white"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=200&q=80";
            }}
          />
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-mono">ASIN: {kit.asin || 'N/A'}</p>
            <a 
              href={kit.affiliateLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-2 inline-block rounded-full bg-yellow-400 px-4 py-2 text-sm font-bold hover:bg-yellow-500 transition"
            >
               View on Amazon
            </a>
            <div className="mt-3 flex gap-2">
              <input 
                value={kit.affiliateLink} 
                readOnly 
                className="flex-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 truncate" 
              />
              <CopyBtn text={kit.affiliateLink} />
            </div>
          </div>
        </div>
      </div>

      {/* Affiliate Link Card */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <p className="font-bold">Affiliate Link</p>
        <div className="mt-2 flex gap-2">
          <input value={kit.affiliateLink} readOnly className="flex-1 rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700" />
          <CopyBtn text={kit.affiliateLink} />
        </div>
      </div>

      {/* Captions & Hashtags Card */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <p className="font-bold">Captions</p>
        {kit.captions?.map((c: string, i: number) => (
          <div key={i} className="mt-3 rounded-xl bg-gray-50 p-3 text-sm flex justify-between items-start gap-2">
            <span className="text-gray-700">{c}</span>
            <CopyBtn text={c} />
          </div>
        ))}
        
        <p className="mt-6 font-bold">Hashtags</p>
        <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">{kit.hashtags?.join(' ')}</p>
      </div>
    </div>
  );
            }
