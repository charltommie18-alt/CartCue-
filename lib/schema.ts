import { z } from "zod";

export const STYLES = [
  "Amazon must-have",
  "Deal alert",
  "Product review",
  "Problem / solution",
  "Aesthetic product",
  "Funny / viral",
  "Gift guide",
  "Top 5 list",
  "Budget find",
  "Before / after",
] as const;

export const TONES = [
  "Exciting",
  "Casual",
  "Premium",
  "Minimal",
  "Funny",
  "Urgent",
  "Trustworthy",
] as const;

export const generatorInputSchema = z.object({
  productName: z.string().trim().min(1, "Product name is required"),
  amazonUrl: z.string().trim().default(""),
  affiliateUrl: z.string().trim().default(""),
  asin: z.string().trim().default(""),
  price: z.string().trim().default(""),
  category: z.string().trim().default(""),
  imageUrl: z.string().trim().default(""),
  description: z.string().trim().default(""),
  targetAudience: z.string().trim().default(""),
  mainBenefit: z.string().trim().default(""),
  style: z.string().min(1),
  tone: z.string().min(1),
  includeDisclosure: z.boolean().default(true),
});

export const instagramKitSchema = z.object({
  captions: z.array(z.string()).min(1),
  hashtags: z.array(z.string()).min(1),
  reelHooks: z.array(z.string()).min(1),
  reelScript: z.string(),
  storySlides: z.array(z.object({ slide: z.number(), text: z.string() })).min(1),
  carouselSlides: z
    .array(z.object({ slide: z.number(), title: z.string(), body: z.string() }))
    .min(1),
  cta: z.string(),
  disclosure: z.string().default(""),
});
