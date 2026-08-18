export type PlanState = { plan: 'trial'|'free'|'pro', trialEndsAt: string | null, generationsLeft: number | null };

const TRIAL_DAYS = 3;

export function getPlanState(): PlanState {
  if (typeof window === 'undefined') return { plan: 'free', trialEndsAt: null, generationsLeft: 0 };
  const pro = localStorage.getItem('cartcue_pro') === 'true';
  if (pro) return { plan: 'pro', trialEndsAt: null, generationsLeft: null };

  let start = localStorage.getItem('cartcue_trial_start');
  if (!start) {
    start = new Date().toISOString();
    localStorage.setItem('cartcue_trial_start', start);
  }
  const ends = new Date(new Date(start).getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const isExpired = new Date() > ends;

  if (isExpired) return { plan: 'free', trialEndsAt: ends.toISOString(), generationsLeft: 0 };
  return { plan: 'trial', trialEndsAt: ends.toISOString(), generationsLeft: 999 };
}

export function getTrialTimeLeft(): { hours: number, minutes: number, expired: boolean } {
  const state = getPlanState();
  if (!state.trialEndsAt) return { hours: 0, minutes: 0, expired: state.plan!== 'pro' && state.plan!== 'trial' };
  const diff = new Date(state.trialEndsAt).getTime() - Date.now();
  if (diff <= 0) return { hours: 0, minutes: 0, expired: true };
  return { hours: Math.floor(diff / 3600000), minutes: Math.floor((diff % 3600000)/60000), expired: false };
}

export function consumeGeneration(){}
export function activatePro(){ localStorage.setItem('cartcue_pro', 'true'); }
