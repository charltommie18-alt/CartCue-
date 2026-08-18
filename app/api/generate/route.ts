import { NextRequest, NextResponse } from "next/server";

async function expandShortUrl(url: string): Promise<string> {
  try {
    if (!url.includes('amzn.to')) return url;
    // Follow redirect
    const res = await fetch(url, { redirect: 'manual' });
    const loc = res.headers.get('location');
    if (loc) return loc;
    // fallback: follow with fetch
    const res2 = await fetch(url, { redirect: 'follow' });
    return res2.url || url;
  } catch { return url; }
}

function buildAffiliateLink(url: string, tag: string) {
  if (!url) return `https://www.amazon.com/s?tag=${tag}`;
  try {
    const u = new URL(url);
    u.searchParams.set('tag', tag);
    return u.toString();
  } catch { return url; }
}

function getTemplates(name: string) {
  const n = name.toLowerCase();
  if (n.includes('whoop') || n.includes('watch')) {
    return {
      captions: [
        `This ${name} replaced my $300 watch. Heart rate, sleep, notifications - battery lasts 7 days. Under $50 on Amazon.`,
        `If you track workouts but hate charging daily, the ${name} is the Amazon find that actually delivers. Link in bio!`,
      ],
      hooks: [`Stop scrolling if your smartwatch dies mid-workout`, `This ${name} tracks everything for under $50`]
    };
  }
  return {
    captions: [`Love this ${name} - Amazon find that actually delivers. Link in bio!`],
    hooks: [`You need this ${name}`]
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const productName = body.productName || 'Whoop smartwatch';
  let amazonUrl = body.amazonUrl || '';
  const TAG = process.env.AMAZON_TAG || 'cartcue-20';

  // Expand amzn.to -> real amazon.com/dp/B0XXXXX
  const expandedUrl = await expandShortUrl(amazonUrl);
  
  const affiliateLink = buildAffiliateLink(expandedUrl || amazonUrl, TAG);
  const tpl = getTemplates(productName);

  const asinMatch = expandedUrl.match(/\/dp\/([A-Z0-9]{10})/i) || expandedUrl.match(/\/product\/([A-Z0-9]{10})/i) || amazonUrl.match(/([A-Z0-9]{10})/);
  const asin = asinMatch ? asinMatch[1] : null;
  const productImage = asin ? `https://images-na.ssl-images-amazon.com/images/P/${asin}.jpg` : null;

  const kit = {
    productName,
    amazonUrl,
    expandedUrl,
    affiliateLink,
    productImage,
    asin,
    captions: tpl.captions,
    reelHooks: tpl.hooks,
    hashtags: ['#amazonfinds', '#whoop', '#smartwatch', '#founditonamazon'],
    disclosure: 'As an Amazon Associate I earn from qualifying purchases.',
  };
  return NextResponse.json({ kit });
}
