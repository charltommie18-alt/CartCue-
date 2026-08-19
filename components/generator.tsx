"use client";

import { useState, useEffect } from "react";
import ProductForm from "./product-form";
import OutputTabs from "./output-tabs";
import { getPlanState, getTrialTimeLeft, consumeGeneration } from "@/lib/plan";

export default function Generator() {
  const [kit, setKit] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trial, setTrial] = useState({ hours: 72, minutes: 0, expired: false });
  const [plan, setPlan] = useState<any>(null);

  useEffect(() => {
    const st = getPlanState();
    setPlan(st);
    setTrial(getTrialTimeLeft());
    
    const id = setInterval(() => {
      setTrial(getTrialTimeLeft());
      setPlan(getPlanState());
    }, 60000);
    
    return () => clearInterval(id);
  }, []);

  const isExpired = plan?.plan === 'free' && plan?.generationsLeft === 0;
  const isPro = plan?.plan === 'pro';

  async function handleGenerate(data: any) {
    const state = getPlanState();
    setPlan(state);

    if (state.plan === 'free' && state.generationsLeft === 0) {
      setError("Trial expired. Please subscribe to continue.");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.error || 'Generation failed');
      }
      
      if (json.kit) {
        setKit(json.kit);
        consumeGeneration();
        setPlan(getPlanState());
      } else {
        throw new Error(json.error || 'Generation failed');
      }
    } catch (e: any) {
      setError(e.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold">
            Cart<span className="text-orange-600">Cue</span>
          </h1>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-orange-600 font-medium">
              {isPro ? 'Pro ✓' : `Trial: ${trial.hours}h ${trial.minutes}m left`}
            </span>
            <a href="/saved" className="text-gray-600 hover:text-gray-900 font-medium">
              Saved
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* Trial Banner */}
        {!isPro && !isExpired && (
          <div className="rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 p-4 text-center">
            <p className="text-sm text-orange-800">
              🎁 <span className="font-semibold">3-Day Free Trial Active</span> - {trial.hours}h {trial.minutes}m left
              <a href="/subscription" className="ml-2 font-bold text-orange-600 underline hover:text-orange-700">
                Go Pro
              </a>
            </p>
          </div>
        )}

        {isExpired && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-center">
            <p className="text-sm text-red-800">
               Trial expired -{" "}
              <a href="/subscription" className="font-bold text-red-600 underline hover:text-red-700">
                Subscribe $4.99/mo to unlock
              </a>
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-center">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Workflow Section */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Workflow</h2>
            <button className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              Customize links
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://amazon.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full bg-yellow-400 px-6 py-3 text-sm font-bold text-gray-900 hover:bg-yellow-500 transition shadow-sm"
            >
              Open Amazon
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full bg-black px-6 py-3 text-sm font-bold text-white hover:bg-gray-800 transition shadow-sm"
            >
              Open Instagram
            </a>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
          {/* Product Form */}
          <ProductForm onGenerate={handleGenerate} loading={loading} disabled={isExpired} />

          {/* Output Section */}
          <div>
            {kit && !loading && (
              <OutputTabs 
                kit={kit} 
                onSave={() => {}} 
                saved={false} 
                onCopy={() => {}} 
              />
            )}
            
            {!kit && !loading && !error && (
              <div className="h-full min-h-[400px] rounded-2xl border-2 border-dashed border-gray-300 bg-white/50 p-8 flex flex-col items-center justify-center text-center">
                <div className="text-6xl mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Ready to Generate
                </h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  Fill in the product details and click "Generate Content" to create Instagram-ready posts with Amazon affiliate links.
                </p>
              </div>
            )}
            
            {loading && (
              <div className="h-full min-h-[400px] rounded-2xl border border-gray-200 bg-white p-8 flex flex-col items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-16 w-16 bg-gray-200 rounded-full mb-4"></div>
                  <div className="h-4 w-48 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 w-32 bg-gray-200 rounded"></div>
                </div>
                <p className="mt-4 text-sm text-gray-600 font-medium">Generating with Amazon photo...</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
  }
