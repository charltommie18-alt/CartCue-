'use client';
import { useState, useEffect } from 'react';
import { getPlanState, getTrialTimeLeft } from '@/lib/plan';

export default function SubscriptionPage() {
  const [plan, setPlan] = useState<any>(null);
  const [time, setTime] = useState({ hours: 0, minutes: 0, expired: false });

  useEffect(() => {
    setPlan(getPlanState());
    const t = getTrialTimeLeft();
    setTime(t);
  }, []);

  const handleSubscribe = () => {
    localStorage.setItem('cartcue_pro', 'true');
    alert('Pro activated - In real Amazon Appstore build this will open Amazon payment.');
    window.location.href = '/';
  };

  const handleUnsubscribe = () => {
    if (!confirm('Cancel Pro subscription? You will go back to free plan after trial.')) return;
    localStorage.removeItem('cartcue_pro');
    localStorage.removeItem('cartcue_trial_start'); // reset to start new trial if you want, or keep
    // For Amazon IAP - real cancel:
    if ((window as any).AmazonIAP) {
      (window as any).AmazonIAP.cancel('cartcue_pro_monthly');
    }
    alert('Unsubscribed. You are now on free plan.');
    setPlan(getPlanState());
    window.location.href = '/';
  };

  const handleClearForTest = () => {
    localStorage.clear();
    alert('Cleared - Trial will restart');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-xl px-6 py-10">
        <h1 className="text-3xl font-black">Manage Subscription</h1>

        <div className="mt-6 rounded-2xl border bg-white p-5">
          <p className="text-sm text-neutral-500">Current Plan</p>
          <p className="mt-1 text-xl font-bold capitalize">{plan?.plan || 'loading...'}</p>
          {plan?.plan === 'trial' && <p className="mt-1 text-sm">⏰ {time.hours}h {time.minutes}m left in free trial</p>}
          {plan?.plan === 'free' && <p className="mt-1 text-sm text-red-600">Trial expired - Subscribe to continue</p>}
          {plan?.plan === 'pro' && <p className="mt-1 text-sm text-green-600">✓ Unlimited generations</p>}
        </div>

        <div className="mt-6 rounded-2xl border bg-white p-5 space-y-3">
          <h2 className="font-bold">CartCue Pro - $4.99/month</h2>
          <ul className="text-sm text-neutral-600 space-y-1">
            <li>✓ Unlimited Amazon to Instagram kits</li>
            <li>✓ Product photos + affiliate links</li>
            <li>✓ Billed via Amazon Appstore</li>
          </ul>

          {plan?.plan!== 'pro'? (
            <button onClick={handleSubscribe} className="mt-4 w-full rounded-xl bg-orange-500 py-4 font-bold text-white">
              Subscribe - $4.99/mo (3-day free trial)
            </button>
          ) : (
            <button onClick={handleUnsubscribe} className="mt-4 w-full rounded-xl border-2 border-red-200 bg-white py-4 font-bold text-red-600">
              Unsubscribe / Cancel Pro
            </button>
          )}

          <p className="text- text-neutral-400 text-center">
            On real Amazon Appstore build: Manage at Amazon Appstore &gt; My Apps &gt; Subscriptions &gt; CartCue &gt; Cancel<br/>
            Web test version: Button above clears localStorage.
          </p>
        </div>

        <button onClick={handleClearForTest} className="mt-6 text-xs text-neutral-400 underline">
          Reset trial for testing (clear storage)
        </button>

        <a href="/" className="mt-6 block text-center text-sm font-medium text-neutral-600 underline">← Back to app</a>
      </div>
    </div>
  );
      }
