"use client";
import { useState } from "react";
export default function ProductForm({ onGenerate, loading }: any) {
  const [productName, setProductName] = useState('');
  const [amazonUrl, setAmazonUrl] = useState('');
  const canGenerate = productName.trim() && amazonUrl.trim();
  return (
    <div className="rounded-2xl border p-5 bg-white">
      <h2 className="font-bold">Product Details</h2>
      <label className="mt-4 block text-sm font-medium">Product Name *</label>
      <input value={productName} onChange={e=>setProductName(e.target.value)} placeholder="e.g., USMECBL Fitness Tracker" className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" />
      <label className="mt-4 block text-sm font-medium">Amazon Link *</label>
      <input value={amazonUrl} onChange={e=>setAmazonUrl(e.target.value)} placeholder="https://amzn.to/46fieVD or amazon.com/dp/..." className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" />
      <button disabled={!canGenerate || loading} onClick={()=>onGenerate({productName, amazonUrl})} className={`mt-5 w-full rounded-full py-3 font-bold text-white ${!canGenerate || loading? 'bg-gray-300' : 'bg-black'}`}>
        {loading? 'Generating...' : 'Generate Content'}
      </button>
    </div>
  );
}
