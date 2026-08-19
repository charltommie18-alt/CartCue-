'use client';

function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button 
      onClick={handleCopy}
      className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm"
    >
      {label}
    </button>
  );
}

export default function OutputTabs({ kit, onSave, saved }: any) {
  if (!kit) return null;
  
  const allText = `${kit.productName}\n\n${kit.captions?.join('\n\n')}\n\n${kit.hashtags?.join(' ')}`;

  // Fix: Use a proxy for Amazon images to bypass hotlink protection
  const displayImage = kit.productImage 
    ? `https://corsproxy.io/?${encodeURIComponent(kit.productImage)}`
    : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80";

  return (
    <div className="space-y-4">
      {/* Product Card with Image */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-900">{kit.productName}</h2>
          <CopyBtn text={allText} label="Copy All" />
        </div>
        
        <div className="flex gap-4">
          {/* Product Image - Now using proxy */}
          <div className="flex-shrink-0">
            <img 
              src={displayImage} 
              alt={kit.productName}
              className="h-32 w-32 rounded-xl border border-gray-200 object-cover bg-white"
              onError={(e) => {
                // Ultimate fallback if proxy fails
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80";
              }}
            />
          </div>
          
          <div className="flex-1 space-y-3">
            <p className="text-xs text-gray-500 font-mono">ASIN: {kit.asin || 'N/A'}</p>
            
            <a 
              href={kit.affiliateLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full bg-yellow-400 px-5 py-2.5 text-sm font-bold text-gray-900 hover:bg-yellow-500 transition shadow-sm"
            >
              🛒 View on Amazon
            </a>
            
            <div className="flex gap-2">
              <input 
                value={kit.affiliateLink || ''} 
                readOnly 
                className="flex-1 rounded-full bg-gray-100 px-3 py-2 text-xs text-gray-600 truncate border border-gray-200" 
              />
              <CopyBtn text={kit.affiliateLink || ''} label="Copy" />
            </div>
          </div>
        </div>
      </div>

      {/* Affiliate Link Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <p className="font-bold text-gray-900">Affiliate Link</p>
          <CopyBtn text={kit.affiliateLink || ''} label="Copy Link" />
        </div>
        <div className="flex gap-2">
          <input 
            value={kit.affiliateLink || ''} 
            readOnly 
            className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 border border-gray-200" 
          />
          <CopyBtn text={kit.affiliateLink || ''} label="Copy" />
        </div>
      </div>

      {/* Captions Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <p className="font-bold text-gray-900">Captions</p>
          <CopyBtn text={kit.captions?.join('\n\n') || ''} label="Copy All" />
        </div>
        <div className="space-y-3">
          {kit.captions?.map((c: string, i: number) => (
            <div key={i} className="rounded-xl bg-gray-50 p-4 text-sm text-gray-700 border border-gray-200">
              <div className="flex justify-between items-start gap-3">
                <span className="flex-1">{c}</span>
                <CopyBtn text={c} label="Copy" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hashtags Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <p className="font-bold text-gray-900">Hashtags</p>
          <CopyBtn text={kit.hashtags?.join(' ') || ''} label="Copy All" />
        </div>
        <div className="rounded-xl bg-gray-50 p-4 border border-gray-200">
          <p className="text-sm text-gray-700 leading-relaxed">
            {kit.hashtags?.join(' ')}
          </p>
        </div>
      </div>
    </div>
  );
            }
