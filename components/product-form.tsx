'use client';
import { useState } from "react";

export default function ProductForm({ loading, onGenerate, disabled }: any) {
  const [productName, setProductName] = useState('smartwatch');
  const [amazonUrl, setAmazonUrl] = useState('https://amzn.to/3SdaiRG');

  return (
    <div className="rounded-2xl border bg-white p-5">
      <p className="font-bold">Product details</p>
      <label className="mt-4 block text-sm">Product name *</label>
      <input value={productName} onChange={e=>setProductName(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" />
      <label className="mt-4 block text-sm">Amazon link</label>
      <input value={amazonUrl} onChange={e=>setAmazonUrl(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" />
      <button disabled={loading||disabled} onClick={()=>onGenerate({ productName, amazonUrl })} className={`mt-5 w-full rounded-full py-3 font-bold text-white ${disabled?'bg-gray-300':'bg-black'}`}>
        {disabled? '🔒 Trial Expired' : loading? 'Generating...' : 'Generate Content'}
      </button>
    </div>
  );
}
