'use client';
import { useState } from "react";
import type { GeneratorInput } from "@/lib/types";

export default function ProductForm({ loading, onGenerate }: { loading: boolean, onGenerate: (d: GeneratorInput)=>void }) {
  const [productName, setProductName] = useState('Portable Blender');
  const [amazonUrl, setAmazonUrl] = useState('');

  return (
    <div className="rounded-2xl border bg-white p-5">
      <p className="font-bold">Product details</p>
      <label className="mt-4 block text-sm font-medium">Product name *</label>
      <input value={productName} onChange={e=>setProductName(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-2.5 text-sm" />
      
      <label className="mt-4 block text-sm font-medium">Amazon link</label>
      <input value={amazonUrl} onChange={e=>setAmazonUrl(e.target.value)} placeholder="https://amazon.com/..." className="mt-2 w-full rounded-xl border px-4 py-2.5 text-sm" />

      <button onClick={()=>onGenerate({ productName, amazonUrl, style: 'viral', tone: 'friendly' } as any)} disabled={loading} className="mt-5 w-full rounded-xl bg-black py-3.5 text-sm font-bold text-white">
        {loading ? 'Generating...' : 'Generate Content'}
      </button>
    </div>
  );
}
