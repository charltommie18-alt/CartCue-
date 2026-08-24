export const AMAZON_SUB_SKU =
  "CartCue_monthly_term";

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

type StoredSubscription = {
  active: boolean;
  autoRenewing: boolean;
  renewalDate: number | null;
  cancelDate: number | null;
  freeTrialEndDate: number | null;
  receiptId: string | null;
  verifiedAt: number;
};

function getStoredSubscription():
  StoredSubscription | null {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  try {
    const raw =
      localStorage.getItem(
        "cartcue_amazon_subscription"
      );

    return raw
      ? (JSON.parse(
          raw
        ) as StoredSubscription)
      : null;
  } catch {
    return null;
  }
}

export function saveAmazonSubscription(
  subscription: StoredSubscription
) {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  localStorage.setItem(
    "cartcue_amazon_subscription",
    JSON.stringify(subscription)
  );

  localStorage.setItem(
    "cartcue_pro",
    "true"
  );
}

export function clearAmazonSubscription() {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  localStorage.removeItem(
    "cartcue_amazon_subscription"
  );

  localStorage.removeItem(
    "cartcue_pro"
  );
}

function getLocalTrial() {
  if (
    typeof window === "undefined"
  ) {
    return {
      plan: "trial" as const,
      trialEndsAt: null,
      generationsLeft:
        TRIAL_GENERATIONS,
    };
  }

  let start =
    localStorage.getItem(
      "cartcue_trial_start"
    );

  if (!start) {
    start =
      new Date().toISOString();

    localStorage.setItem(
      "cartcue_trial_start",
      start
    );
  }

  const end =
    new Date(start).getTime() +
    TRIAL_DAYS *
      24 *
      60 *
      60 *
      1000;

  const endDate =
    new Date(end);

  const used = parseInt(
    localStorage.getItem(
      "cartcue_generations_used"
    ) || "0",
    10
  );

  if (Date.now() >= end) {
    return {
      plan: "free" as const,
      trialEndsAt:
        endDate.toISOString(),
      generationsLeft: 0,
    };
  }

  return {
    plan: "trial" as const,
    trialEndsAt:
      endDate.toISOString(),
    generationsLeft:
      Math.max(
        0,
        TRIAL_GENERATIONS -
          used
      ),
  };
}

export function getPlanState():
  PlanState {
  if (
    typeof window === "undefined"
  ) {
    return {
      plan: "trial",
      trialEndsAt: null,
      generationsLeft:
        TRIAL_GENERATIONS,
      subscriptionEndAt: null,
      autoRenewing: false,
      freeTrialEndAt: null,
    };
  }

  const subscription =
    getStoredSubscription();

  if (subscription?.active) {
    const now = Date.now();

    const end =
      subscription.cancelDate ||
      subscription.renewalDate ||
      subscription.freeTrialEndDate;

    if (!end || end > now) {
      return {
        plan: "pro",
        trialEndsAt: null,
        generationsLeft: null,
        subscriptionEndAt: end
          ? new Date(
              end
            ).toISOString()
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

  const trial =
    getLocalTrial();

  return {
    plan: trial.plan,
    trialEndsAt:
      trial.trialEndsAt,
    generationsLeft:
      trial.generationsLeft,
    subscriptionEndAt: null,
    autoRenewing: false,
    freeTrialEndAt: null,
  };
}

export function getTrialTimeLeft() {
  const state =
    getPlanState();

  if (
    state.plan !== "trial" ||
    !state.trialEndsAt
  ) {
    return {
      hours: 0,
      minutes: 0,
      expired:
        state.plan === "free",
    };
  }

  const difference =
    new Date(
      state.trialEndsAt
    ).getTime() -
    Date.now();

  if (difference <= 0) {
    return {
      hours: 0,
      minutes: 0,
      expired: true,
    };
  }

  return {
    hours: Math.floor(
      difference / 3600000
    ),
    minutes: Math.floor(
      (difference %
        3600000) /
        60000
    ),
    expired: false,
  };
}

export function consumeGeneration() {
  if (
    typeof window === "undefined"
  ) {
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
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  localStorage.setItem(
    "cartcue_pro",
    "true"
  );
}

export function resetTrial() {
  if (
    typeof window === "undefined"
  ) {
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
