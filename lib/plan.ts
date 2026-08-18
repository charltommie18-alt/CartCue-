export type PlanState = { 
  plan: 'trial' | 'free' | 'pro', 
  trialEndsAt: string | null, 
  generationsLeft: number | null 
};

const TRIAL_DAYS = 3;
const TRIAL_GENERATIONS = 10;

export function getPlanState(): PlanState {
  // Server-side rendering safety
  if (typeof window === 'undefined') {
    return { plan: 'trial', trialEndsAt: null, generationsLeft: TRIAL_GENERATIONS };
  }
  
  // Check if user has pro
  const pro = localStorage.getItem('cartcue_pro') === 'true';
  if (pro) return { plan: 'pro', trialEndsAt: null, generationsLeft: null };

  // Get or create trial start date
  let start = localStorage.getItem('cartcue_trial_start');
  if (!start) {
    start = new Date().toISOString();
    localStorage.setItem('cartcue_trial_start', start);
  }
  
  // Calculate trial end date
  const ends = new Date(new Date(start).getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const isExpired = new Date() > ends;

  // If expired, return free plan
  if (isExpired) {
    return { plan: 'free', trialEndsAt: ends.toISOString(), generationsLeft: 0 };
  }
  
  // Track generations used during trial
  let used = parseInt(localStorage.getItem('cartcue_generations_used') || '0');
  const left = Math.max(0, TRIAL_GENERATIONS - used);
  
  return { plan: 'trial', trialEndsAt: ends.toISOString(), generationsLeft: left };
}

export function getTrialTimeLeft(): { hours: number, minutes: number, expired: boolean } {
  const state = getPlanState();
  
  if (!state.trialEndsAt) {
    return { 
      hours: 0, 
      minutes: 0, 
      expired: state.plan !== 'pro' && state.plan !== 'trial' 
    };
  }
  
  const diff = new Date(state.trialEndsAt).getTime() - Date.now();
  
  if (diff <= 0) {
    return { hours: 0, minutes: 0, expired: true };
  }
  
  return { 
    hours: Math.floor(diff / 3600000), 
    minutes: Math.floor((diff % 3600000) / 60000), 
    expired: false 
  };
}

export function consumeGeneration() {
  if (typeof window === 'undefined') return;
  
  let used = parseInt(localStorage.getItem('cartcue_generations_used') || '0');
  localStorage.setItem('cartcue_generations_used', String(used + 1));
}

export function activatePro() {
  if (typeof window === 'undefined') return;
  localStorage.setItem('cartcue_pro', 'true');
}

export function resetTrial() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('cartcue_trial_start');
  localStorage.removeItem('cartcue_generations_used');
  localStorage.removeItem('cartcue_pro');
    }
