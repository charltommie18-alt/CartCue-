'use client';
import { useState } from 'react';

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = () => {
    setLoading(true);
    // For Amazon Appstore build, this triggers IAP. For web, open Amazon Pay page
    if (typeof window !== 'undefined' && (window as any).AmazonIAP) {
      (window as any).AmazonIAP.purchase('cartcue_pro_monthly');
    } else {
      // Replace with your real Amazon subscription link from Seller Central
      // For testing, it goes to your live site
      window.location.href = '/';
      alert('Pro activated for testing - In Amazon Appstore build this will open Amazon payment.');
      localStorage.setItem('cartcue_pro', 'true');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-xl px-6 py-12">
        <h1 className="text-3xl font-black">CartCue Pro - $4.99/month</h1>
        <ul className="mt-6 space-y-2 text-sm">
          <li>✓ Unlimited generations</li>
          <li>✓ Save unlimited kits</li>
          <li>✓ Billed securely via Amazon</li>
        </ul>
        <button onClick={handleSubscribe} disabled={loading} className="mt-8 w-full rounded-xl bg-orange-500 py-4 font-bold text-white">
          {loading ? 'Processing...' : 'Subscribe via Amazon - $4.99/mo'}
        </button>
        <p className="mt-4 text-xs text-neutral-500 text-center">Your affiliate links keep working. We do not take 70%, you keep 100% of Amazon commission.</p>
        <a href="/" className="mt-6 block text-center text-sm underline">Back to app</a>
      </div>
    </div>
  );
}
