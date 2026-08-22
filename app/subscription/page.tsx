// At the top of your try block, after the purchase:
const result = await AmazonIAP.purchase({
  sku: AMAZON_SUB_SKU,
});

// Always convert a possibly undefined SKU to a real string.
const purchasedSku: string =
  result?.sku ?? AMAZON_SUB_SKU;

if (purchasedSku !== AMAZON_SUB_SKU) {
  throw new Error(
    `Unexpected Amazon SKU: ${purchasedSku}`
  );
}

// Pass the receiptId to save it in local storage
const receiptId = result?.receiptId;
activateAmazonSub(receiptId);

const newState = getPlanState();
setState(newState);

setNotice(
  "Payment successful. Your CartCue Pro subscription is active."
);
