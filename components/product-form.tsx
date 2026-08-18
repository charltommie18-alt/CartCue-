// components/product-form.tsx (or wherever your file is located)
'use client';
import { useState } from "react";

export default function ProductForm({ loading, onGenerate, disabled }: { loading: boolean, onGenerate: (input: any) => void, disabled: boolean }) {
  // Start with empty strings instead of hardcoded test data
  const [productName, setProductName] = useState('');
  const [amazonUrl, setAmazonUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !amazonUrl.trim()) return;
    onGenerate({ productName: productName.trim(), amazonUrl: amazonUrl.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="font-bold text-lg mb-4">Product Details</p>
      
      <label className="block text-sm font-medium text-gray-700">Product Name *</label>
      <input 
        value={productName} 
        onChange={e => setProductName(e.target.value)} 
        placeholder="e.g., USMECBL Fitness Tracker Smart Watch"
        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition" 
        required
      />
      
      <label className="mt-4 block text-sm font-medium text-gray-700">Amazon Link *</label>
      <input 
        value={amazonUrl} 
        onChange={e => setAmazonUrl(e.target.value)} 
        placeholder="https://www.amazon.com/dp/B0GVNFJGZC"
        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition" 
        required
      />
      
      <button 
        type="submit"
        disabled={loading || disabled || !productName || !amazonUrl} 
        className={`mt-6 w-full rounded-full py-3 font-bold text-white transition-all ${
          disabled || !productName || !amazonUrl ? 'bg-gray-300 cursor-not-allowed' : 'bg-black hover:bg-gray-800 active:scale-[0.98]'
        }`}
      >
        {disabled ? '🔒 Trial Expired' : loading ? 'Generating...' : 'Generate Content'}
      </button>
    </form>
  );
}
