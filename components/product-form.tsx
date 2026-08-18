'use client';
import { useState } from 'react';

export default function ProductForm({ loading, onGenerate }: { loading: boolean, onGenerate: (d:any)=>void }) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('Portable Blender');

  return (
    <div className="rounded-2xl border bg-white p-5">
      <p className="font-bold">Product details</p>
      <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3">
        <p className="text-sm font-semibold">Quick import from Amazon</p>
        <div className="mt-2 flex gap-2">
          <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="Paste Amazon product link" className="flex-1 rounded-lg border bg-white px-3 py-2.5 text-sm" />
          <button onClick={()=>onGenerate({ productUrl: url, productName: name })} className="rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold">Import</button>
        </div>
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium">Product name *</label>
        <input value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm" />
      </div>

      <button
        onClick={()=>onGenerate({ productName: name, amazonUrl: url })}
        disabled={loading}
        className="mt-5 w-full rounded-xl bg-black py-3.5 text-sm font-bold text-white disabled:opacity-50"
      >
        {loading? 'Generating...' : 'Generate Content'}
      </button>
    </div>
  );
      }
