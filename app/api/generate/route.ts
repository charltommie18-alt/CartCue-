import { NextRequest, NextResponse } from "next/server";

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
  const isWatch = n.includes('watch');
  const isBlender = n.includes('blender');

  if (isWatch) {
    return {
      captions: [
        `This ${name} replaced my $300 watch. Heart rate, sleep, notifications - battery lasts 7 days. Under $50 on Amazon.`,
        `If you track workouts but hate charging daily, the ${name} is the Amazon find that actually delivers. Link in bio!`,
      ],
      hooks: [
        `Stop scrolling if your smartwatch dies mid-workout`,
        `This ${name} tracks everything for under $50`,
        `I tested 3 budget smartwatches - this one won`,
      ]
    };
  }
  // default blender etc
  return {
    captions: [
      `I wasn't going to post about ${name}... but it makes smoothies anywhere in seconds. Currently on Amazon!`,
      `Amazon find that actually delivers. ${name} is perfect for gym, work, travel. Link in bio!`,
    ],
    hooks: [
      `Stop scrolling if you hate cleaning big blenders`,
      `This ${name} makes smoothies in 20 seconds`,
    ]
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const productName = body.productName || 'Portable Blender';
  const amazonUrl = body.amazonUrl || '';
  const TAG = process.env.AMAZON_TAG || 'cartcue-20';

  const affiliateLink = buildAffiliateLink(amazonUrl, TAG);
  const tpl = getTemplates(productName);

  // Try to get product image from Amazon URL - Amazon uses /dp/ASIN/
  const asinMatch = amazonUrl.match(/\/dp\/([A-Z0-9]{10})/i) || amazonUrl.match(/\/product\/([A-Z0-9]{10})/i);
  const productImage = asinMatch? `https://images-na.ssl-images-amazon.com/images/P/${asinMatch[1]}.jpg` : null;

  const kit = {
    productName,
    amazonUrl,
    affiliateLink,
    productImage, // <-- this will show photo
    price: body.price || 'See price on Amazon',
    captions: tpl.captions,
    reelHooks: tpl.hooks,
    hashtags: ['#amazonfinds', '#amazonmusthaves', '#founditonamazon', `#${productName.toLowerCase().replace(/\s+/g,'')}`],
    disclosure: 'As an Amazon Associate I earn from qualifying purchases.',
  };
  return NextResponse.json({ kit });
      }
