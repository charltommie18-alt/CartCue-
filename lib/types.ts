export type GeneratorInput = {
  productName: string;
  amazonUrl: string;
  affiliateUrl: string;
  asin: string;
  price: string;
  category: string;
  imageUrl: string;
  description: string;
  targetAudience: string;
  mainBenefit: string;
  style: string;
  tone: string;
  includeDisclosure: boolean;
};

export type StorySlide = { slide: number; text: string };

export type CarouselSlide = { slide: number; title: string; body: string };

export type InstagramKit = {
  captions: string[];
  hashtags: string[];
  reelHooks: string[];
  reelScript: string;
  storySlides: StorySlide[];
  carouselSlides: CarouselSlide[];
  cta: string;
  disclosure: string;
};

export type SavedKit = {
  id: string;
  createdAt: string;
  productName: string;
  style: string;
  tone: string;
  kit: InstagramKit;
};
