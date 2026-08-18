import { NextRequest, NextResponse } from "next/server";

function buildAffiliateLink(url: string, tag: string) {
  if (!url) return `https://www.amazon.com/s?k=portable+blender&tag=${tag}`;
  try {
    const u = new URL(url);
    // Keep product ID, strip old tag, add yours
    u.searchParams.delete('tag');
    u.searchParams.set('tag', tag);
    return u.toString();
  } catch {
    return url;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const productName = body.productName || 'Portable Blender';
  const amazonUrl = body.amazonUrl || body.productUrl || '';
  
  // YOUR ASSOCIATE TAG - change this to yours
  const TAG = process.env.AMAZON_TAG || 'cartcue-20';
  
  const affiliateLink = buildAffiliateLink(amazonUrl, TAG);

  const kit = {
    productName,
    amazonUrl,
    affiliateLink,
    price: '29.99',
    captions: [
      `I wasn't going to post about ${productName}... but it blends smoothies anywhere in seconds. Currently $${'29.99'} on Amazon!`,
      `Amazon find that actually delivers. ${productName} is perfect for gym, work, travel. Link in bio!`,
    ],
    reelHooks: [
      `Stop scrolling if you hate cleaning big blenders`,
      `This ${productName} makes smoothies in 20 seconds`,
    ],
    hashtags: ['#amazonfinds', '#amazonmusthaves', '#founditonamazon', `#${productName.toLowerCase().replace(/\s/g,'')}`],
    disclosure: 'As an Amazon Associate I earn from qualifying purchases.',
  };

  return NextResponse.json({ kit });
}
