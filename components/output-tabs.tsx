'use client';
import { useState } from "react";

function Copy({ text, label='Copy' }: { text: string, label?: string }) {
  const [ok,setOk]=useState(false);
  return <button onClick={()=>{navigator.clipboard.writeText(text); setOk(true); setTimeout(()=>setOk(false),1200)}} className="shrink-0 rounded-full border bg-white px-3 py-1.5 text-xs font-bold">{ok?'Copied ✓':label}</button>
}

export default function OutputTabs({ kit }: { kit: any, onSave: any, saved: any }) {
  const link = kit.affiliateLink || '';
  const productBlock = `${kit.productName}\n${link}\n\n${(kit.captions||[]).join('\n\n')}\n\n${(kit.hashtags||[]).join(' ')}`;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-5">
        <div className="flex justify-between"><p className="font-bold">{kit.productName}</p><Copy text={productBlock} label="Copy All" /></div>
        <div className="mt-3 flex gap-4">
          {kit.productImage ? <img src={kit.productImage} alt={kit.productName} className="h-24 w-24 rounded-xl object-contain bg-neutral-50 border" /> : <div className="h-24 w-24 rounded-xl bg-neutral-100 flex items-center justify-center text-xs">No photo - use full amazon.com/dp/ link</div>}
          <div>
            <p className="text-xs text-neutral-500">{kit.asin? `ASIN: ${kit.asin}`: 'Short link - paste full link for photo'}</p>
            <a href={link} target="_blank" rel="noreferrer" className="mt-2 inline-block rounded-full bg-[#FFC83D] px-4 py-2 text-xs font-bold">🛒 View on Amazon</a>
            <div className="mt-2"><Copy text={`${kit.productName} - ${link}`} label="Copy Watch + Link" /></div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <p className="font-bold text-sm">Affiliate Link</p>
        <div className="mt-2 flex gap-2"><input value={link} readOnly className="flex-1 rounded-full bg-neutral-100 px-4 py-2.5 text-sm" /><Copy text={link} /></div>
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <div className="flex justify-between"><p className="font-bold">Captions</p><Copy text={(kit.captions||[]).join('\n\n')} /></div>
        {(kit.captions||[]).map((c:string,i:number)=><div key={i} className="mt-3 flex gap-3 rounded-xl bg-neutral-50 p-3"><p className="flex-1 text-sm">{c}</p><Copy text={c}/></div>)}
        <div className="mt-6 flex justify-between"><p className="font-bold">Hooks</p><Copy text={(kit.reelHooks||[]).join('\n')} /></div>
        {(kit.reelHooks||[]).map((h:string,i:number)=><div key={i} className="mt-3 flex gap-3 rounded-xl bg-neutral-50 p-3"><p className="flex-1 text-sm">{h}</p><Copy text={h}/></div>)}
        <div className="mt-6 flex justify-between"><p className="font-bold">Hashtags</p><Copy text={(kit.hashtags||[]).join(' ')} /></div>
        <p className="mt-3 rounded-xl bg-neutral-50 p-3 text-sm">{(kit.hashtags||[]).join(' ')}</p>
      </div>
    </div>
  );
          }
