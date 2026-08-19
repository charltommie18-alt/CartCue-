export type PlanState = {
  plan: "trial" | "free" | "pro";
  trialEndsAt: string | null;
  generationsLeft: number | null;
  subscriptionEndAt: string | null;
  autoRenewing: boolean;
  freeTrialEndAt: string | null;
};

const TRIAL_DAYS = 3;
const TRIAL_GENERATIONS = 10;

type StoredSubscription = {
  active: boolean;
  autoRenewing: boolean;
  renewalDate: number | null;
  cancelDate: number | null;
  freeTrialEndDate: number | null;
  receiptId: string | null;
  verifiedAt: number;
};

function getStoredSubscription(): StoredSubscription | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(
      "cartcue_amazon_subscription"
    );

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as StoredSubscription;
  } catch {
    return null;
  }
}

export function saveAmazonSubscription(
  subscription: StoredSubscription
) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    "cartcue_amazon_subscription",
    JSON.stringify(subscription)
  );

  /*
   * Kept for compatibility with the existing app.
   * It is only a UI cache; the real source of truth is
   * Amazon receipt verification.
   */
  localStorage.setItem("cartcue_pro", "true");
}

export function clearAmazonSubscription() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    "cartcue_amazon_subscription"
  );

  localStorage.removeItem("cartcue_pro");
}

function getLocalTrial(): {
  plan: "trial" | "free";
  trialEndsAt: string | null;
  generationsLeft: number | null;
} {
  if (typeof window === "undefined") {
    return {
      plan: "trial",
      trialEndsAt: null,
      generationsLeft: TRIAL_GENERATIONS,
    };
  }

  let start =
    localStorage.getItem("cartcue_trial_start");

  if (!start) {
    start = new Date().toISOString();

    localStorage.setItem(
      "cartcue_trial_start",
      start
    );
  }

  const ends =
    new Date(start).getTime() +
    TRIAL_DAYS *
      24 *
      60 *
      60 *
      1000;

  const endsDate = new Date(ends);

  if (Date.now() >= ends) {
    return {
      plan: "free",
      trialEndsAt: endsDate.toISOString(),
      generationsLeft: 0,
    };
  }

  const used = parseInt(
    localStorage.getItem(
      "cartcue_generations_used"
    ) || "0",
    10
  );

  const left = Math.max(
    0,
    TRIAL_GENERATIONS - used
  );

  return {
    plan: "trial",
    trialEndsAt: endsDate.toISOString(),
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

  const subscription =
    getStoredSubscription();

  if (subscription) {
    const now = Date.now();

    const endDate =
      subscription.cancelDate ||
      subscription.renewalDate ||
      subscription.freeTrialEndDate;

    const active =
      subscription.active &&
      (!endDate || endDate > now);

    if (active) {
      return {
        plan: "pro",
        trialEndsAt: null,
        generationsLeft: null,
        subscriptionEndAt: endDate
          ? new Date(endDate).toISOString()
          : null,
        autoRenewing:
          subscription.autoRenewing,
        freeTrialEndAt:
          subscription.freeTrialEndDate
            ? new Date(
                subscription.freeTrialEndDate
              ).toISOString()
            : null,
      };
    }
  }

  const trial = getLocalTrial();

  return {
    plan: trial.plan,
    trialEndsAt: trial.trialEndsAt,
    generationsLeft:
      trial.generationsLeft,
    subscriptionEndAt: null,
    autoRenewing: false,
    freeTrialEndAt: null,
  };
}

export function getTrialTimeLeft(): {
  hours: number;
  minutes: number;
  expired: boolean;
} {
  const state = getPlanState();

  if (state.plan === "pro") {
    const end =
      state.freeTrialEndAt ||
      state.subscriptionEndAt;

    if (!end) {
      return {
        hours: 0,
        minutes: 0,
        expired: false,
      };
    }

    const diff =
      new Date(end).getTime() -
      Date.now();

    if (diff <= 0) {
      return {
        hours: 0,
        minutes: 0,
        expired: false,
      };
    }

    return {
      hours: Math.floor(
        diff / 3600000
      ),
      minutes: Math.floor(
        (diff % 3600000) / 60000
      ),
      expired: false,
    };
  }

  if (!state.trialEndsAt) {
    return {
      hours: 0,
      minutes: 0,
      expired: true,
    };
  }

  const diff =
    new Date(state.trialEndsAt).getTime() -
    Date.now();

  if (diff <= 0) {
    return {
      hours: 0,
      minutes: 0,
      expired: true,
    };
  }

  return {
    hours: Math.floor(
      diff / 3600000
    ),
    minutes: Math.floor(
      (diff % 3600000) / 60000
    ),
    expired: false,
  };
}

export function consumeGeneration() {
  if (typeof window === "undefined") {
    return;
  }

  const used = parseInt(
    localStorage.getItem(
      "cartcue_generations_used"
    ) || "0",
    10
  );

  localStorage.setItem(
    "cartcue_generations_used",
    String(used + 1)
  );
}

export function activatePro() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    "cartcue_pro",
    "true"
  );
}

export function resetTrial() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(
    "cartcue_trial_start"
  );

  localStorage.removeItem(
    "cartcue_generations_used"
  );

  localStorage.removeItem(
    "cartcue_pro"
  );

  localStorage.removeItem(
    "cartcue_amazon_subscription"
  );
}
