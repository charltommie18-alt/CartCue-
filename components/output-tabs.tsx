'use client';
import { useState } from "react";

function Copy({ text }: { text: string }) {
  const [ok,setOk]=useState(false);
  if(!text) return null;
  return (
    <button
      onClick={()=>{navigator.clipboard.writeText(text); setOk(true); setTimeout(()=>setOk(false),1200)}}
      className="shrink-0 rounded-full border bg-white px-3 py-1.5 text-xs font-bold hover:bg-neutral-50"
    >
      {ok?'Copied ✓':'Copy'}
    </button>
  );
}

export default function OutputTabs({ kit, onSave, saved }: { kit: any, onSave: ()=>void, saved: boolean }) {
  const link = kit.affiliateLink || kit.amazonUrl || '';

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-5">
        <p className="font-bold">Affiliate Link</p>
        <div className="mt-2 flex gap-2 items-center">
          <input value={link} readOnly placeholder="https://amazon.com/..." className="flex-1 rounded-full bg-neutral-100 px-4 py-2.5 text-sm" />
          <Copy text={link} />
        </div>
        {link? (
          <div className="mt-3 flex gap-2">
            <a href={link} target="_blank" rel="noreferrer" className="inline-block rounded-full bg-[#FFC83D] px-5 py-2.5 text-sm font-bold">
              🛒 Open Amazon
            </a>
            <button onClick={onSave} className="rounded-full border px-4 py-2.5 text-sm font-medium">
              {saved? 'Saved ✓' : 'Save kit'}
            </button>
          </div>
        ) : (
          <p className="mt-3 text-xs text-red-500">Add an Amazon link in Product details to generate affiliate link</p>
        )}
      </div>

      <div className="rounded-2xl border bg-white p-5">
        <div className="flex justify-between items-center"><p className="font-bold">Captions</p><Copy text={(kit.captions||kit.descriptions||[]).join('\n\n')} /></div>
        {(kit.captions||kit.descriptions||[]).map((c:string,i:number)=><div key={i} className="mt-3 flex gap-3 rounded-xl bg-neutral-50 p-3"><p className="flex-1 text-sm leading-relaxed">{c}</p><Copy text={c}/></div>)}

        <div className="mt-6 flex justify-between items-center"><p className="font-bold">Hooks</p><Copy text={(kit.reelHooks||kit.hooks||[]).join('\n')} /></div>
        {(kit.reelHooks||kit.hooks||[]).map((h:string,i:number)=><div key={i} className="mt-3 flex gap-3 rounded-xl bg-neutral-50 p-3"><p className="flex-1 text-sm">{h}</p><Copy text={h}/></div>)}

        <div className="mt-6 flex justify-between items-center"><p className="font-bold">Hashtags</p><Copy text={(kit.hashtags||[]).join(' ')} /></div>
        <p className="mt-3 rounded-xl bg-neutral-50 p-3 text-sm break-words">{(kit.hashtags||[]).join(' ')}</p>

        {kit.disclosure && <p className="mt-6 text- text-neutral-400">{kit.disclosure}</p>}
      </div>
    </div>
  );
}
