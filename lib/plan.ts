export function getPlanState() {
  if (typeof window === 'undefined') return { plan: 'trial' as const, trialEndsAt: null, generationsLeft: 999 };
  if (localStorage.getItem('cartcue_pro') === 'true') return { plan: 'pro' as const, trialEndsAt: null, generationsLeft: null };
  let start = localStorage.getItem('cartcue_trial_start');
  if (!start) { start = new Date().toISOString(); localStorage.setItem('cartcue_trial_start', start); }
  const ends = new Date(new Date(start).getTime() + 3*24*60*60*1000);
  const expired = Date.now() > ends.getTime();
  if (expired) return { plan: 'free' as const, trialEndsAt: ends.toISOString(), generationsLeft: 0 };
  return { plan: 'trial' as const, trialEndsAt: ends.toISOString(), generationsLeft: 999 };
}
export function getTrialTimeLeft() {
  const s = getPlanState();
  if (!s.trialEndsAt) return { hours: 72, minutes: 0, expired: false };
  const diff = new Date(s.trialEndsAt).getTime() - Date.now();
  if (diff <= 0) return { hours: 0, minutes: 0, expired: true };
  return { hours: Math.floor(diff/3600000), minutes: Math.floor((diff%3600000)/60000), expired: false };
}
