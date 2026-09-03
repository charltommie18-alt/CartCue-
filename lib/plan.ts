export const AMAZON_PARENT_SKU = "CartCue_monthly_sub";

/** Term SKU purchased by the app */
export const AMAZON_SUB_SKU = "CartCue_monthly_term";

/** Alias kept for older imports */
export const AMAZON_SUBSCRIPTION_SKU = AMAZON_SUB_SKU;

const TRIAL_DAYS = 7;
const TRIAL_GENERATIONS = 10;

export type PlanState = {
  plan: "trial" | "free" | "pro";
  trialEndsAt: string | null;
  generationsLeft: number | null;
  subscriptionEndAt: string | null;
  autoRenewing: boolean;
  freeTrialEndAt: string | null;
};

export type StoredSubscription = {
  active: boolean;
  autoRenewing: boolean;
  renewalDate: number | null;
  cancelDate: number | null;
  freeTrialEndDate: number | null;
  gracePeriodEndDate?: number | null;
  receiptId: string | null;
  verifiedAt: number;
};

function getStoredSubscription(): StoredSubscription | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem("cartcue_amazon_subscription");
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as StoredSubscription;
  } catch {
    return null;
  }
}

export function saveAmazonSubscription(subscription: StoredSubscription) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    "cartcue_amazon_subscription",
    JSON.stringify(subscription)
  );

  if (subscription.active) {
    localStorage.setItem("cartcue_pro", "true");
  } else {
    localStorage.removeItem("cartcue_pro");
  }
}

export function clearAmazonSubscription() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("cartcue_amazon_subscription");
  localStorage.removeItem("cartcue_pro");
}

function isSubscriptionActive(subscription: StoredSubscription): boolean {
  if (!subscription?.active) {
    return false;
  }

  const now = Date.now();

  const endDates = [
    subscription.cancelDate,
    subscription.renewalDate,
    subscription.gracePeriodEndDate,
    subscription.freeTrialEndDate,
  ].filter(
    (value): value is number => typeof value === "number" && value > 0
  );

  // No end dates → treat as active (Amazon still owns the truth via RVS)
  if (endDates.length === 0) {
    return true;
  }

  const latestEnd = Math.max(...endDates);
  return latestEnd > now;
}

function getLocalTrial() {
  if (typeof window === "undefined") {
    return {
      plan: "trial" as const,
      trialEndsAt: null as string | null,
      generationsLeft: TRIAL_GENERATIONS,
    };
  }

  let start = localStorage.getItem("cartcue_trial_start");

  if (!start) {
    start = new Date().toISOString();
    localStorage.setItem("cartcue_trial_start", start);
  }

  const end =
    new Date(start).getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000;

  const used = parseInt(
    localStorage.getItem("cartcue_generations_used") || "0",
    10
  );

  const left = Math.max(0, TRIAL_GENERATIONS - used);
  const expired = Date.now() >= end || left <= 0;

  if (expired) {
    return {
      plan: "free" as const,
      trialEndsAt: new Date(end).toISOString(),
      generationsLeft: 0,
    };
  }

  return {
    plan: "trial" as const,
    trialEndsAt: new Date(end).toISOString(),
    generationsLeft: left,
  };
}

export function getPlanState(): PlanState {
  if (typeof window === "undefined") {
    return {
      plan: "trial",
      trialEndsAt: null,
      generationsLeft: TRIAL_GENERATIONS,
      subscriptionEndAt: null,
      autoRenewing: false,
      freeTrialEndAt: null,
    };
  }

  const subscription = getStoredSubscription();

  if (subscription && isSubscriptionActive(subscription)) {
    const endDates = [
      subscription.cancelDate,
      subscription.renewalDate,
      subscription.gracePeriodEndDate,
      subscription.freeTrialEndDate,
    ].filter(
      (value): value is number => typeof value === "number" && value > 0
    );

    const end = endDates.length ? Math.max(...endDates) : null;

    return {
      plan: "pro",
      trialEndsAt: null,
      generationsLeft: null,
      subscriptionEndAt: end ? new Date(end).toISOString() : null,
      autoRenewing: subscription.autoRenewing,
      freeTrialEndAt: subscription.freeTrialEndDate
        ? new Date(subscription.freeTrialEndDate).toISOString()
        : null,
    };
  }

  if (subscription) {
    clearAmazonSubscription();
  }

  const trial = getLocalTrial();

  return {
    plan: trial.plan,
    trialEndsAt: trial.trialEndsAt,
    generationsLeft: trial.generationsLeft,
    subscriptionEndAt: null,
    autoRenewing: false,
    freeTrialEndAt: null,
  };
}

export function getTrialTimeLeft() {
  const state = getPlanState();

  if (state.plan !== "trial" || !state.trialEndsAt) {
    return {
      hours: 0,
      minutes: 0,
      expired: state.plan === "free",
    };
  }

  const difference = new Date(state.trialEndsAt).getTime() - Date.now();

  if (difference <= 0) {
    return { hours: 0, minutes: 0, expired: true };
  }

  return {
    hours: Math.floor(difference / 3600000),
    minutes: Math.floor((difference % 3600000) / 60000),
    expired: false,
  };
}

export function consumeGeneration() {
  if (typeof window === "undefined") {
    return;
  }

  const used = parseInt(
    localStorage.getItem("cartcue_generations_used") || "0",
    10
  );

  localStorage.setItem("cartcue_generations_used", String(used + 1));
}

export function activatePro() {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem("cartcue_pro", "true");
}

export function resetTrial() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("cartcue_trial_start");
  localStorage.removeItem("cartcue_generations_used");
  localStorage.removeItem("cartcue_pro");
  localStorage.removeItem("cartcue_amazon_subscription");
}

/**
 * Called after a successful Amazon RVS verification.
 */
export function activateAmazonSub(
  receiptId: string | null,
  verification: {
    active: boolean;
    autoRenewing?: boolean;
    renewalDate?: number | null;
    cancelDate?: number | null;
    freeTrialEndDate?: number | null;
    gracePeriodEndDate?: number | null;
  }
) {
  if (typeof window === "undefined") {
    return;
  }

  if (!verification.active) {
    clearAmazonSubscription();
    return;
  }

  saveAmazonSubscription({
    active: true,
    autoRenewing: verification.autoRenewing !== false,
    renewalDate: verification.renewalDate ?? null,
    cancelDate: verification.cancelDate ?? null,
    freeTrialEndDate: verification.freeTrialEndDate ?? null,
    gracePeriodEndDate: verification.gracePeriodEndDate ?? null,
    receiptId: receiptId,
    verifiedAt: Date.now(),
  });
}
