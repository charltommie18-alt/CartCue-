'use client';
import { useEffect, useState } from 'react';
import { getTrialTimeLeft, getPlanState } from '@/lib/plan';

export default function TrialBanner() {
  const [time, setTime] = useState({ hours: 168, minutes: 0, expired: false });
  const [plan, setPlan] = useState('trial');

  useEffect(() => {
    const tick = () => {
      setTime(getTrialTimeLeft());
      setPlan(getPlanState().plan);
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  if (plan === 'pro') return null;

  if (time.expired) {
    return (
      <div className="bg-black text-white text-center py-3 text-sm">
        Trial expired - <a href="/subscription" className="underline font-bold text-orange-400">Subscribe $4.99/mo to continue</a>
        <span className="ml-2">Timer: 00:00</span>
      </div>
    );
  }

  return (
    <div className="bg-amber-100 border-b border-amber-200 text-center py-2.5 text-sm font-medium">
      🎁 7-Day Free Trial Active - {time.hours}h {time.minutes}m left - <a href="/subscription" className="underline text-orange-600">Go Pro</a>
    </div>
  );
}
