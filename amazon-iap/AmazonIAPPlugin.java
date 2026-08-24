package com.cartcue.app;
import com.amazon.device.iap.PurchasingListener;
import com.amazon.device.iap.PurchasingService;
import com.amazon.device.iap.model.FulllmentResult;
import com.amazon.device.iap.model.ProductDataResponse;
import com.amazon.device.iap.model.PurchaseResponse;
import com.amazon.device.iap.model.PurchaseUpdatesResponse;
import com.amazon.device.iap.model.Receipt;
import com.amazon.device.iap.model.RequestId;
import com.amazon.device.iap.model.UserDataResponse;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
@CapacitorPlugin(name = "AmazonIAP")
public class AmazonIAPPlugin
extends Plugin
implements PurchasingListener {
private nal Map<String, PluginCall>
pendingPurchases =
new HashMap<>();
private PluginCall userDataCall;
private PluginCall updatesCall;
private nal List<Receipt>
restoredReceipts =
new ArrayList<>();
private String restoredUserId = "";
private String restoredMarketplace = "";
@Override
public void load() {
super.load();
PurchasingService.registerListener(
getContext()
.getApplicationContext(),
this
);
}
@PluginMethod
public void purchase(
PluginCall call
) {
String sku =
call.getString("sku");
if (
sku == null ||
sku.trim().isEmpty()
) {
call.reject(
"Missing Amazon subscription SKU."
);
return;
}
RequestId requestId =
PurchasingService.purchase(
sku.trim()
);
if (requestId == null) {
call.reject(
"Amazon purchase could not be started."
);
return;
}
pendingPurchases.put(
requestId.toString(),
call
);
call.setKeepAlive(true);
}
@PluginMethod
public void getUserData(
PluginCall call
) {
userDataCall = call;
call.setKeepAlive(true);
PurchasingService.getUserData();
}
@PluginMethod
public void restorePurchases(
PluginCall call
) {
startPurchaseUpdates(call);
}
@PluginMethod
public void syncPurchases(
PluginCall call
) {
startPurchaseUpdates(call);
}
private void startPurchaseUpdates(
PluginCall call
) {
if (updatesCall != null) {
call.reject(
"Amazon purchase synchronization is already running."
);
return;
}
updatesCall = call;
restoredReceipts.clear();
restoredUserId = "";
restoredMarketplace = "";
call.setKeepAlive(true);
PurchasingService.getPurchaseUpdates(
true
);
}
@PluginMethod
public void fulllPurchase(
PluginCall call
) {
String receiptId =
call.getString(
"receiptId"
);
String result =
call.getString(
"result",
"FULFILLED"
);
if (
receiptId == null ||
receiptId.trim().isEmpty()
) {
call.reject(
"Missing receipt ID."
);
return;
}
FulllmentResult fulllment;
try {
fulllment =
FulllmentResult.valueOf(
result
);
} catch (
IllegalArgumentException error
) {
call.reject(
"Invalid fulllment result."
);
return;
}
PurchasingService.notifyFulllment(
receiptId,
fulllment
);
JSObject response =
new JSObject();
response.put(
"success",
true
);
call.resolve(response);
}
@Override
public void onUserDataResponse(
UserDataResponse response
) {
if (userDataCall == null) {
return;
}
if (
response.getRequestStatus() ==
UserDataResponse.RequestStatus.SUCCESSFUL
) {
JSObject data =
new JSObject();
data.put(
"userId",
response
.getUserData()
.getUserId()
);
data.put(
"marketplace",
response
.getUserData()
.getMarketplace()
);
data.put(
"countryCode",
response
.getUserData()
.getCountryCode()
);
userDataCall.resolve(
data
);
} else {
userDataCall.reject(
"Amazon user data failed: " +
response.getRequestStatus()
);
}
userDataCall = null;
}
@Override
public void onProductDataResponse(
ProductDataResponse response
) {
/*
* Product information can be added later
* if the UI needs Amazon's live price.
*/
}
@Override
public void onPurchaseResponse(
PurchaseResponse response
) {
PluginCall call =
pendingPurchases.remove(
response
.getRequestId()
.toString()
);
if (call == null) {
return;
}
switch (
response.getRequestStatus()
) {
case SUCCESSFUL:
Receipt receipt =
response.getReceipt();
if (receipt == null) {
call.reject(
"Amazon returned no receipt."
);
return;
}
JSObject result =
new JSObject();
result.put(
"success",
true
);
result.put(
"sku",
receipt.getSku()
);
result.put(
"termSku",
receipt.getTermSku()
);
result.put(
"receiptId",
receipt.getReceiptId()
);
result.put(
"purchaseDate",
receipt
.getPurchaseDate()
.getTime()
);
result.put(
"productType",
receipt
.getProductType()
.toString()
);
if (
response.getUserData() != null
) {
result.put(
"userId",
response
.getUserData()
.getUserId()
);
result.put(
"marketplace",
response
.getUserData()
.getMarketplace()
);
}
call.resolve(
result
);
break;
case ALREADY_PURCHASED:
call.reject(
"ALREADY_PURCHASED"
);
break;
case INVALID_SKU:
call.reject(
"INVALID_SKU"
);
break;
case NOT_SUPPORTED:
call.reject(
"NOT_SUPPORTED"
);
break;
case FAILED:
default:
call.reject(
"AMAZON_PURCHASE_FAILED"
);
break;
}
}
@Override
public void onPurchaseUpdatesResponse(
PurchaseUpdatesResponse response
) {
if (updatesCall == null) {
return;
}
if (
response.getRequestStatus() !=
PurchaseUpdatesResponse.RequestStatus.SUCCESSFUL
) {
PluginCall call =
updatesCall;
updatesCall = null;
call.reject(
"Amazon purchase updates failed: " +
response.getRequestStatus()
);
return;
}
if (
response.getUserData() != null
) {
restoredUserId =
response
.getUserData()
.getUserId();
restoredMarketplace =
response
.getUserData()
.getMarketplace();
}
if (
response.getReceipts() != null
) {
for (
Receipt receipt :
response.getReceipts()
) {
restoredReceipts.add(
receipt
);
}
}
/*
* Amazon can paginate purchase history.
*/
if (response.hasMore()) {
PurchasingService.getPurchaseUpdates(
false
);
return;
}
JSArray receipts =
new JSArray();
for (
Receipt receipt :
restoredReceipts
) {
JSObject item =
new JSObject();
item.put(
"sku",
receipt.getSku()
);
item.put(
"termSku",
receipt.getTermSku()
);
item.put(
"receiptId",
receipt.getReceiptId()
);
item.put(
"purchaseDate",
receipt
.getPurchaseDate()
.getTime()
);
item.put(
"canceled",
receipt.isCanceled()
);
receipts.put(
item
);
}
JSObject data =
new JSObject();
data.put(
"receipts",
receipts
);
data.put(
"userId",
restoredUserId
);
data.put(
"marketplace",
restoredMarketplace
);
PluginCall call =
updatesCall;
updatesCall = null;
call.resolve(
data
);
}
}
