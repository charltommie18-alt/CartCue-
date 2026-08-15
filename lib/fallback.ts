import type { GeneratorInput, InstagramKit } from "./types";

export function generateFallback(input: GeneratorInput): InstagramKit {
  const name = input.productName.trim();
  const price = input.price.trim() || "a great price";
  const benefit = input.mainBenefit.trim() || "makes everyday life a little easier";
  const audience =
    input.targetAudience.trim() || "anyone who loves a useful find";
  const category = (input.category.trim() || "amazon").toLowerCase();

  const hashtags = [
    "#amazonfinds",
    "#amazonmusthaves",
    "#amazondeals",
    "#amazonfavorites",
    "#amazonpicks",
    "#founditonamazon",
    "#amazonhaul",
    "#tiktokmademebuyit",
    "#" + category.replace(/[^a-z0-9]+/g, ""),
    "#musthaves",
    "#lifehacks",
    "#shoppingfinds",
    "#deals",
    "#budgetfinds",
    "#giftideas",
    "#everydayessentials",
  ];

  const captions = [
    `I wasn't going to post about ${name}… but it actually ${benefit}. Worth it at ${price}. 🛒`,
    `If you're shopping for ${audience}, ${name} is the Amazon find you need on your radar.`,
    `${name} — one of those "why didn't I buy this sooner" Amazon finds. It ${benefit}, and it looks good doing it.`,
  ];

  const reelHooks = [
    `Stop scrolling if you want something that ${benefit}.`,
    `This Amazon find at ${price} is everywhere for a reason.`,
    `I tested ${name} so you don't have to.`,
  ];

  const reelScript = [
    `HOOK (0-2s): "${reelHooks[0]}"`,
    ``,
    `SHOW PRODUCT (2-5s): Quick close-up of ${name}.`,
    ``,
    `PROBLEM (5-10s): "If you're ${audience}, you know the struggle."`,
    ``,
    `SOLUTION (10-20s): "This is ${name}. It ${benefit}."`,
    `Show it in use, 2-3 quick cuts.`,
    ``,
    `PAYOFF (20-27s): Show the result / reaction.`,
    ``,
    `CTA (27-30s): "${
      input.affiliateUrl ? "Link in bio." : 'Comment "LINK" and I\'ll send it to you.'
    }"`,
  ].join("\n");

  const storySlides = [
    { slide: 1, text: `Okay, Amazon did THAT. 👀` },
    { slide: 2, text: `Found ${name} — and yes, it lives up to the hype.` },
    { slide: 3, text: `Why I love it: it ${benefit}.` },
    { slide: 4, text: `Price: ${price}. Perfect for ${audience}.` },
    { slide: 5, text: `Want the link? Reply "LINK" and I'll send it.` },
  ];

  const carouselSlides = [
    {
      slide: 1,
      title: `Amazon find alert 🚨`,
      body: `${name} — the ${category} upgrade you didn't know you needed.`,
    },
    {
      slide: 2,
      title: `The problem`,
      body: `Most ${category} products overpromise and underdeliver.`,
    },
    { slide: 3, title: `The fix`, body: `${name} ${benefit}. Simple as that.` },
    { slide: 4, title: `Who it's for`, body: `Made for ${audience}.` },
    {
      slide: 5,
      title: `Get it`,
      body: `Price: ${price}. Comment "LINK" and I'll send it to you.`,
    },
  ];

  const cta = `Comment "LINK" and I'll send you the ${name} link. 🔗`;

  const disclosure = input.includeDisclosure
    ? "As an Amazon Associate, I earn from qualifying purchases."
    : "";

  return {
    captions,
    hashtags,
    reelHooks,
    reelScript,
    storySlides,
    carouselSlides,
    cta,
    disclosure,
  };
}
