import { NextRequest, NextResponse } from "next/server";

async function expandUrl(url: string) {
  try {
    if (!url.includes('amzn.to')) return url;
    const r = await fetch(url, { redirect: 'follow' });
    return r.url;
  } catch { return url; }
}

function getAsin(url: string) {
  const m = url.match(/\/dp\/([A-Z0-9]{10})/i) || url.match(/\/([A-Z0-9]{10})(?:[/?]|$)/);
  return m? m[1].toUpperCase() : null;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const productName = body.productName || 'smartwatch';
  const amazonUrl = body.amazonUrl || '';
  const TAG = process.env.AMAZON_TAG || 'cartcue-20';

  const expanded = await expandUrl(amazonUrl);
  const asin = getAsin(expanded) || getAsin(amazonUrl) || 'B0GVNFJGZC';

  // Direct JPGs that ALWAYS load - no widget blocking
  const images = asin? [
    `https://m.media-amazon.com/images/P/${asin}.jpg`,
    `https://m.media-amazon.com/images/P/${asin}.01._SCL500_SX500_.jpg`,
    `https://images-na.ssl-images-amazon.com/images/P/${asin}.01._SCL500_.jpg`,
  ] : [];

  const affiliateLink = (() => {
    try { const u = new URL(expanded); u.searchParams.set('tag', TAG); return u.toString(); }
    catch { return expanded; }
  })();

  return NextResponse.json({
    kit: {
      productName,
      amazonUrl,
      expandedUrl: expanded,
      affiliateLink,
      productImage: images[0], // primary
      productImages: images, // fallback chain
      asin,
      captions: [`This ${productName} replaced my $300 watch. Heart rate, sleep, notifications - battery lasts 7 days.`, `The ${productName} is the Amazon find that actually delivers. Link in bio!`],
      reelHooks: [`This ${productName} tracks everything for under $50`],
      hashtags: ['#amazonfinds', '#smartwatch', '#founditonamazon'],
      disclosure: 'As an Amazon Associate I earn from qualifying purchases.'
    }
  });
        }
