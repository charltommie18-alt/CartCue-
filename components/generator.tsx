"use client";
import { useState, useEffect } from "react";
import ProductForm from "./product-form";
import OutputTabs from "./output-tabs";
import { getPlanState, getTrialTimeLeft } from "@/lib/plan";

export function Generator() {
  const [kit, setKit] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [trialLeft, setTrialLeft] = useState({ hours: 72, minutes: 0, expired: false });

  useEffect(() => {
    setTrialLeft(getTrialTimeLeft());
    const id = setInterval(() => setTrialLeft(getTrialTimeLeft()), 60000);
    return () => clearInterval(id);
  }, []);

  async function handleGenerate(data: any) {
    const state = getPlanState();
    // Only block AFTER trial expires
    if (state.plan === 'free' && state.generationsLeft === 0) {
      setShowPaywall(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (json.kit) setKit(json.kit);
      else alert(json.error || 'Failed');
    } catch (e) {
      alert('Generation failed - try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <div className="text-xs text-gray-500">
        {trialLeft.expired ? 'Trial expired' : `Trial: ${trialLeft.hours}h ${trialLeft.minutes}m left`}
      </div>
      <ProductForm onGenerate={handleGenerate} loading={loading} disabled={false} />
      {kit && <OutputTabs kit={kit} />}
      
      {showPaywall && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h2 className="font-bold text-lg">Trial Expired</h2>
            <p className="text-sm mt-2">Subscribe for $4.99/mo to continue generating</p>
            <button onClick={()=>setShowPaywall(false)} className="mt-4 w-full bg-black text-white rounded-full py-2">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// THIS LINE FIXES YOUR BUILD ERROR
export default Generator;
