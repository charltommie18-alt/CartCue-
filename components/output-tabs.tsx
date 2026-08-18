'use client';

function CopyBtn({ text }: { text: string }) {
  return <button onClick={()=>navigator.clipboard.writeText(text)} className="ml-2 rounded-full border bg-white px-3 py-1 text-xs font-bold">Copy</button>
}

export default function OutputTabs({ kit }: any) {
  if (!kit) return null;
  const allText = `${kit.productName}\n${kit.affiliateLink}\n\n${kit.captions.join('\n\n')}\n\n${kit.hashtags.join(' ')}`;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-5">
        <div className="flex justify-between items-center">
          <h2 className="font-bold">{kit.productName}</h2>
          <button onClick={()=>navigator.clipboard.writeText(allText)} className="rounded-full border px-4 py-2 text-xs font-bold">Copy All</button>
        </div>
        <div className="mt-4 flex gap-4">
          <img src={kit.productImage} alt={kit.productName} className="h-24 w-24 rounded-xl border object-contain bg-white" />
          <div>
            <p className="text-xs text-gray-500">ASIN: {kit.asin}</p>
            <a href={kit.affiliateLink} target="_blank" className="mt-2 inline-block rounded-full bg-yellow-400 px-4 py-2 text-sm font-bold">🛒 View on Amazon</a>
            <div className="mt-2 flex gap-2">
              <input value={kit.affiliateLink} readOnly className="w-48 rounded-full bg-gray-100 px-3 py-1 text-" />
              <CopyBtn text={kit.affiliateLink} />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <p className="font-bold">Affiliate Link</p>
        <div className="mt-2 flex gap-2">
          <input value={kit.affiliateLink} readOnly className="flex-1 rounded-full bg-gray-100 px-4 py-2 text-sm" />
          <CopyBtn text={kit.affiliateLink} />
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <p className="font-bold">Captions</p>
        {kit.captions.map((c:string,i:number)=>(
          <div key={i} className="mt-3 rounded-xl bg-gray-50 p-3 text-sm flex justify-between">
            <span>{c}</span><CopyBtn text={c} />
          </div>
        ))}
        <p className="mt-4 font-bold">Hashtags</p>
        <p className="mt-2 text-sm">{kit.hashtags.join(' ')}</p>
      </div>
    </div>
  );
}
