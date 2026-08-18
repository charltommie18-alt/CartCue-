import { NextRequest, NextResponse } from "next/server";

async function expandAndGetImage(shortUrl: string) {
  let finalUrl = shortUrl;
  let image: string | null = null;
  let title: string | null = null;
  try {
    // Expand amzn.to
    if (shortUrl.includes('amzn.to')) {
      const r = await fetch(shortUrl, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0' } });
      finalUrl = r.url;
      const html = await r.text();
      const ogImg = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) || html.match(/"hiRes":"([^"]+)"/) || html.match(/"large":"([^"]+)"/);
      if (ogImg) image = ogImg[1].replace(/\\u002F/g, '/');
      const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i) || html.match(/<span id="productTitle"[^>]*>([^<]+)</);
      if (ogTitle) title = ogTitle[1].trim();
    } else {
      const r = await fetch(shortUrl, { headers: { 'User-Agent': 'Mozilla/5.0 iPhone' } });
      const html = await r.text();
      const ogImg = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
      if (ogImg) image = ogImg[1];
    }
  } catch (e) { console.log('scrape failed', e); }
  return { finalUrl, image, title };
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  let productName = body.productName || 'Product';
  let amazonUrl = body.amazonUrl || '';
  const TAG = process.env.AMAZON_TAG || 'cartcue-20';

  const { finalUrl, image, title } = await expandAndGetImage(amazonUrl);
  if (title && productName === 'Product') productName = title;

  const affiliateLink = (() => {
    try { const u = new URL(finalUrl); u.searchParams.set('tag', TAG); return u.toString(); }
    catch { return `${amazonUrl}${amazonUrl.includes('?')?'&':'?'}tag=${TAG}`; }
  })();

  const isWatch = productName.toLowerCase().includes('watch') || productName.toLowerCase().includes('whoop');
  const kit = {
    productName,
    amazonUrl,
    expandedUrl: finalUrl,
    affiliateLink,
    productImage: image, // REAL amazon photo now
    captions: isWatch? [
      `This ${productName} replaced my $300 watch. Heart rate, sleep, notifications - battery lasts 7 days. Under $50 on Amazon.`,
      `If you track workouts but hate charging daily, the ${productName} is the Amazon find that actually delivers. Link in bio!`
    ] : [`Love this ${productName} - Amazon find that actually delivers!`],
    reelHooks: isWatch? [`Stop scrolling if your smartwatch dies mid-workout`, `This ${productName} tracks everything`] : [`You need this ${productName}`],
    hashtags: ['#amazonfinds', '#founditonamazon', `#${productName.toLowerCase().replace(/\s+/g,'')}`],
    disclosure: 'As an Amazon Associate I earn from qualifying purchases.',
  };
  return NextResponse.json({ kit });
}
