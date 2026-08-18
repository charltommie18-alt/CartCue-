'use client';

import { useState } from "react";
import ProductForm from "@/components/product-form";
import AccountLinks from "@/components/account-links";

type GeneratorInput = {
  productUrl?: string;
  amazonUrl?: string;
  productName?: string;
  price?: string;
  productDescription?: string;
  style?: string;
  platform?: string;
  affiliateUrl?: string;
  [key: string]: any;
};

type Kit = {
  productName?: string;
  amazonUrl?: string;
  affiliateLink?: string;
  affiliateTag?: string;
  price?: string;
  captions?: string[];
  hashtags?: string[];
  reelHooks?: string[];
  descriptions?: string[];
  hooks?: string[];
  cta?: string;
  disclosure?: string;
  reelScript?: string;
  [key: string]: any;
};

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [kit, setKit] = useState<Kit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [isPro, setIsPro] = useState(false);

  const handleGenerate = async (input: GeneratorInput) => {
    setLoading(true);
    setError(null);
    setKit(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(errData.error || "Failed to generate");
      }
      const data = await res.json();
      setKit(data.kit || data);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (!kit?.affiliateLink) return;
    navigator.clipboard.writeText(kit.affiliateLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAmazonSubscribe = async () => {
    setSubLoading(true);
    try {
      // @ts-ignore Amazon IAP available inside Amazon Appstore wrapper
      if (typeof window !== 'undefined' && (window as any).AmazonIAP) {
        // REAL purchase when app is on Amazon Appstore
        const result = await (window as any).AmazonIAP.purchase('cartcue_pro_monthly');
        if (result?.success) {
          setIsPro(true);
          localStorage.setItem('cartcue_pro', 'true');
          alert('Subscribed! Welcome to CartCue Pro 🎉');
        }
      } else {
        // Web preview - show how monthly money works
        // Replace com.cartcue.app with your real Amazon Appstore package name
        window.open('https://www.amazon.com/gp/mas/dl/android?p=com.cartcue.app', '_blank');
        alert('Amazon Subscription:\n\n1. Publish your app to Amazon Appstore\n2. Users tap this button inside the Amazon version\n3. Amazon charges $4.99/month\n4. You get $3.49/month per user via Amazon Payments\n\nFor web testing, this links to Amazon Appstore.');
      }
    } catch (e: any) {
      alert('Subscribe error: ' + e.message);
    } finally {
      setSubLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-100">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-neutral-900">
            Cart<span className="text-orange-600">Cue</span>
          </h1>
          <AccountLinks />
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
            Amazon content assistant
          </p>
          <h2 className="mt-2 text-4xl font-bold tracking-tight text-neutral-900">
            Turn an Amazon product into ready-to-post social content.
          </h2>
          <p className="mt-4 text-lg text-neutral-600">
            Enter a product, choose your style and generate captions, hooks, hashtags and content ideas.
          </p>
          
          {/* AMAZON MONTHLY SUBSCRIPTION BUTTON */}
          <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-sm font-bold">{isPro ? '✅ CartCue Pro Active' : '🔓 Unlock CartCue Pro'}</p>
            <p className="text-xs text-neutral-600 mt-1">Unlimited kits, save history, no watermark. Billed via Amazon.</p>
            <button
              onClick={handleAmazonSubscribe}
              disabled={subLoading || isPro}
              className="mt-3 w-full rounded-lg bg-black py-3 text-sm font-bold text-white disabled:opacity-50"
              style={{background: isPro ? '#16a34a' : 'linear-gradient(90deg, #FF9900, #FF6600)'}}
            >
              {isPro ? 'Pro Active ✓' : subLoading ? 'Connecting to Amazon...' : 'Subscribe $4.99/month via Amazon'}
            </button>
            <p className="mt-2 text- text-center text-neutral-500">Cancel anytime in Amazon Appstore • You keep 70%</p>
          </div>
        </div>

        <div className="mt-8">
          <ProductForm loading={loading} onGenerate={handleGenerate} />
          
          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {kit && (
            <div className="mt-8 space-y-6">
              <div className="rounded-xl border-2 border-orange-400 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold">📦 {kit.productName || 'Amazon Product'}</h3>
                {kit.price && <p className="text-sm text-neutral-600 mt-1">Price: ${kit.price}</p>}
                
                <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm font-bold text-orange-900">💰 YOUR PAYMENT LINK (you earn when they buy):</p>
                  <div className="mt-2 flex gap-2">
                    <input 
                      value={kit.affiliateLink || kit.amazonUrl || ''} 
                      readOnly 
                      className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
                    />
                    <button 
                      onClick={copyLink}
                      className="rounded-md bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <a href={kit.affiliateLink || kit.amazonUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block rounded-md bg-black px-4 py-2 text-sm font-bold text-white">
                    Test Link → Amazon 
