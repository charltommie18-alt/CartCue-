import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  const { productName, amazonUrl } = await req.json();
  const url = amazonUrl || 'https://amzn.to/46fieVD';
  const m = url.match(/([A-Z0-9]{10})/i);
  const asin = m? m[1].toUpperCase() : 'B0GVNFJGZC';
  return NextResponse.json({
    kit: {
      productName: productName || 'Smartwatch',
      asin,
      productImage: `https://m.media-amazon.com/images/P/${asin}.01._SL500_.jpg`,
      affiliateLink: `https://www.amazon.com/dp/${asin}?tag=cartcue-20`,
      captions: [`This ${productName} replaced my $300 watch. Battery lasts 7 days.`, `The ${productName} is the Amazon find that actually delivers.`],
      hashtags: ['#AmazonFinds','#SmartWatch']
    }
  });
}
