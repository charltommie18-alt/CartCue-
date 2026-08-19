'use client';
import { useState } from "react";

function Copy({ text, label='Copy' }: { text: string, label?: string }) {
  const [ok,setOk]=useState(false);
  return <button onClick={()=>{navigator.clipboard.writeText(text); setOk(true); setTimeout(()=>setOk(false),1000)}} className="rounded-full border px-3 py-1.5 text-xs font-bold bg-white">{ok?'Copied':'Copy'}</button>
}

export default function OutputTabs({ kit }: { kit: any, onSave: any, saved: any }) {
  const [imgIdx, setImgIdx] = useState(0);
  const imgs = kit.productImages || [kit.productImage];
  const link = kit.affiliateLink;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-4">
        <div className="flex justify-between"><p className="font-bold">{kit.productName}</p><Copy text={`${kit.productName}\n${link}\n\n${kit.captions.join('\n\n')}`} label="Copy All" /></div>
        <div className="mt-3 flex gap-4">
          <div className="h-24 w-24 rounded-xl bg-neutral-50 border overflow-hidden flex items-center justify-center">
            {imgs[imgIdx]? (
              <img
                src={imgs[imgIdx]}
                alt={kit.productName}
                className="h-full w-full object-contain"
                onError={()=>{ if(imgIdx < imgs.length-1) setImgIdx(imgIdx+1); }}
                referrerPolicy="no-referrer"
              />
            ) : <span className="text-">No photo</span>}
          </div>
          <div>
            <p className="text-xs text-neutral-500">ASIN: {kit.asin}</p>
            <a href={link} target="_blank" className="mt-2 inline-block rounded-full bg-[#FFC83D] px-4 py-2 text-xs font-bold">🛒 View on Amazon</a>
            <div className="mt-2"><Copy text={`${kit.productName} - ${link}`} label="Copy Watch + Link" /></div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <p className="font-bold text-sm">Affiliate Link</p>
        <div className="mt-2 flex gap-2"><input value={link} readOnly className="flex-1 rounded-full bg-neutral-100 px-3 py-2 text-xs" /><Copy text={link} /></div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <p className="font-bold">Captions</p>
        {kit.captions.map((c:string,i:number)=><div key={i} className="mt-3 rounded-xl bg-neutral-50 p-3 text-sm flex justify-between gap-2"><span>{c}</span><Copy text={c} /></div>)}
      </div>
    </div>
  );
                                                                                                                                                               }
