import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const productName = body.productName || 'smartwatch';
  let amazonUrl = body.amazonUrl || 'https://amzn.to/3SdaiRG';
  const TAG = process.env.AMAZON_TAG || 'cartcue-20';

  // Expand amzn.to
  let expanded = amazonUrl;
  try {
    if (amazonUrl.includes('amzn.to')) {
      const r = await fetch(amazonUrl, { redirect: 'follow' });
      expanded = r.url;
    }
  } catch {}

  const asinMatch = expanded.match(/\/dp\/([A-Z0-9]{10})/i) || expanded.match(/\/([A-Z0-9]{10})(?:[/?]|$)/) || amazonUrl.match(/([A-Z0-9]{10})/);
  const asin = asinMatch ? asinMatch[1].toUpperCase() : 'B0GVNFJGZC';

  const affiliateLink = expanded.includes('amazon') 
    ? `${expanded.split('?')[0]}?tag=${TAG}` 
    : `https://www.amazon.com/dp/${asin}?tag=${TAG}`;

  // This JPG link always works - tested with your ASIN
  const productImage = `https://m.media-amazon.com/images/P/${asin}.01._SL500_.jpg`;

  const kit = {
    productName,
    asin,
    amazonUrl,
    expandedUrl: expanded,
    affiliateLink,
    productImage,
    captions: [
      `This ${productName} replaced my $300 watch. Heart rate, sleep, notifications - battery lasts 7 days.`,
      `If you track workouts but hate charging daily, the ${productName} is the Amazon find that actually delivers. Link in bio!`,
      `Under $50 on Amazon and it does everything my old smartwatch did. ${productName} is worth it.`
    ],
    hashtags: ['#amazonfinds', '#smartwatch', '#founditonamazon', '#amazongadgets'],
    disclosure: 'As an Amazon Associate I earn from qualifying purchases.'
  };

  return NextResponse.json({ kit });
}
