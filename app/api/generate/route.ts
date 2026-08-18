import { NextRequest, NextResponse } from "next/server";

async function expandUrl(shortUrl: string) {
  try {
    if (!shortUrl.includes('amzn.to')) return shortUrl;
    const res = await fetch(shortUrl, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' } });
    return res.url;
  } catch { return shortUrl; }
}

function getAsin(url: string): string | null {
  const m = url.match(/\/dp\/([A-Z0-9]{10})/i) || url.match(/\/gp\/product\/([A-Z0-9]{10})/i) || url.match(/\/([A-Z0-9]{10})(?:[/?]|$)/);
  return m ? m[1].toUpperCase() : null;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  let productName = body.productName || 'Whoop smartwatch';
  let amazonUrl = body.amazonUrl || '';
  const TAG = process.env.AMAZON_TAG || 'cartcue-20';

  const expanded = await expandUrl(amazonUrl);
  const asin = getAsin(expanded) || getAsin(amazonUrl);

  // 3 fallbacks - one will always work
  let productImage: string | null = null;
  if (asin) {
    // Amazon Ad Widget - this ALWAYS returns an image, even without scraping
    productImage = `https://ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=${asin}&Format=_SL500_SX500_CR0%2C0%2C500%2C500_&ID=AsinImage&MarketPlace=US&ServiceVersion=20070822&WS=1&tag=${TAG}`;
  }

  // Try to get better quality image if possible (optional)
  try {
    if (expanded.includes('amazon.')) {
      const htmlRes = await fetch(expanded, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 0 } });
      const html = await htmlRes.text();
      const og = html.match(/"hiRes":"(https:[^"]+)"/) || html.match(/"large":"(https:[^"]+)"/) || html.match(/og:image" content="([^"]+)"/);
      if (og) productImage = og[1].replace(/\\u002F/g, '/').replace(/\\u0026/g, '&');
    }
  } catch {}

  const finalAffiliate = (() => {
    try { const u = new URL(expanded); u.searchParams.set('tag', TAG); return u.toString(); }
    catch { return `${expanded}${expanded.includes('?')?'&':'?'}tag=${TAG}`; }
  })();

  const isWatch = /watch|whoop/i.test(productName);

  return NextResponse.json({
    kit: {
      productName,
      amazonUrl,
      expandedUrl: expanded,
      affiliateLink: finalAffiliate,
      productImage, // <- will never be null if ASIN found
      asin,
      captions: isWatch ? [
        `This ${productName} replaced my $300 watch. Heart rate, sleep, notifications - battery lasts 7 days.`,
        `If you track workouts but hate charging daily, the ${productName} is the Amazon find that actually delivers.`
      ] : [`Love this ${productName} - Amazon find!`],
      reelHooks: isWatch ? [`This ${productName} tracks everything`, `Stop scrolling if your watch dies mid-workout`] : [`You need this ${productName}`],
      hashtags: ['#amazonfinds', '#founditonamazon', `#${productName.toLowerCase().replace(/\s+/g,'')}`],
      disclosure: 'As an Amazon Associate I earn from qualifying purchases.'
    }
  });
}
