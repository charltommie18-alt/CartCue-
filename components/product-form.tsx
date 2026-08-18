'use client';
import { useState } from "react";
import type { GeneratorInput } from "@/lib/types";

export default function ProductForm({ 
  loading, 
  onGenerate, 
  disabled 
}: { 
  loading: boolean, 
  onGenerate: (d: GeneratorInput)=>void,
  disabled?: boolean 
}) {
  const [productName, setProductName] = useState('Whoop smartwatch');
  const [amazonUrl, setAmazonUrl] = useState('');

  const handleClick = () => {
    if (disabled) {
      // will trigger modal in parent
      onGenerate({ productName, amazonUrl, style: 'viral', tone: 'friendly' } as any);
      return;
    }
    onGenerate({ productName, amazonUrl, style: 'viral', tone: 'friendly' } as any);
  };

  return (
    <div className="rounded-2xl border bg-white p-5">
      <p className="font-bold">Product details</p>
      
      <label className="mt-4 block text-sm font-medium">Product name *</label>
      <input 
        value={productName} 
        onChange={e=>setProductName(e.target.value)} 
        disabled={disabled}
        className="mt-2 w-full rounded-xl border px-4 py-2.5 text-sm disabled:bg-neutral-100 disabled:text-neutral-400" 
      />
      
      <label className="mt-4 block text-sm font-medium">Amazon link</label>
      <input 
        value={amazonUrl} 
        onChange={e=>setAmazonUrl(e.target.value)} 
        placeholder="https://amzn.to/... or amazon.com/dp/..."
        disabled={disabled}
        className="mt-2 w-full rounded-xl border px-4 py-2.5 text-sm disabled:bg-neutral-100" 
      />

      <button 
        onClick={handleClick} 
        disabled={loading} 
        className={`mt-5 w-full rounded-full py-3.5 text-sm font-bold text-white transition
          ${disabled? 'bg-neutral-300 cursor-pointer' : 'bg-black hover:bg-neutral-800'} 
          ${loading? 'opacity-60' : ''}`}
      >
        {disabled? '🔒 Trial Expired - Tap to Subscribe' : loading ? 'Generating...' : 'Generate Content'}
      </button>

      {disabled && (
        <p className="mt-3 text-center text-xs text-red-500">
          Your 3-day trial ended. <a href="/subscription" className="font-bold underline">Subscribe $4.99/mo</a>
        </p>
      )}
    </div>
  );
      }
