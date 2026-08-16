export type PlanState = {
  plan: "trial" | "free" | "pro";
  trialEndsAt: string | null;
  generationsLeft: number | null; // null = unlimited
  subSku: string | null;
};

export const AMAZON_SUB_SKU = "CartCue_monthly_sub";

const KEY = "cartcue_plan";
const TRIAL_DAYS = 7;
const TRIAL_GENERATIONS = 10;
const FREE_MONTHLY = 3;

type Stored = {
  trialStartedAt: string | null;
  pro: boolean;
  subSku: string | null;
  monthKey: string;
  usedThisMonth: number;
  trialUsed: number;
};

const EMPTY: Stored = {
  trialStartedAt: null,
  pro: false,
  subSku: null,
  monthKey: "",
  usedThisMonth: 0,
  trialUsed: 0,
};

function load(): Stored {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return EMPTY;
}

function save(s: Stored) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

export function activateAmazonSub() {
  const s = load();
  s.pro = true;
  s.subSku = AMAZON_SUB_SKU;
  save(s);
}

export function getPlanState(): PlanState {
  const s = load();

  if (s.pro)
    return {
      plan: "pro",
      trialEndsAt: null,
      generationsLeft: null,
      subSku: s.subSku,
    };

  // Auto-start the 7-day Pro trial for every new account
  if (!s.trialStartedAt) {
    s.trialStartedAt = new Date().toISOString();
    save(s);
  }

  const end = new Date(s.trialStartedAt).getTime() + TRIAL_DAYS * 86400000;
  if (Date.now() < end) {
    return {
      plan: "trial",
      trialEndsAt: new Date(end).toISOString(),
      generationsLeft: Math.max(0, TRIAL_GENERATIONS - s.trialUsed),
      subSku: null,
    };
  }

  const monthKey = new Date().toISOString().slice(0, 7);
  const used = s.monthKey === monthKey ? s.usedThisMonth : 0;
  return {
    plan: "free",
    trialEndsAt: null,
    generationsLeft: Math.max(0, FREE_MONTHLY - used),
    subSku: null,
  };
}

export function consumeGeneration() {
  const s = load();
  if (s.pro) return;

  if (s.trialStartedAt) {
    const end =
      new Date(s.trialStartedAt).getTime() + TRIAL_DAYS * 86400000;
    if (Date.now() < end) {
      s.trialUsed += 1;
      save(s);
      return;
    }
  }

  const monthKey = new Date().toISOString().slice(0, 7);
  s.usedThisMonth = s.monthKey === monthKey ? s.usedThisMonth + 1 : 1;
  s.monthKey = monthKey;
  save(s);
}
