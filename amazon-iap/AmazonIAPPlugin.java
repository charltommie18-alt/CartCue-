package com.cartcue.app;

import com.amazon.device.iap.PurchasingListener;
import com.amazon.device.iap.PurchasingService;

import com.amazon.device.iap.model.FulfillmentResult;
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
public class AmazonIAPPlugin extends Plugin
        implements PurchasingListener {

    private static final String TAG = "CartCueAmazonIAP";

    private final Map<String, PluginCall> pendingPurchases =
            new HashMap<>();

    private PluginCall userDataCall;

    private PluginCall updatesCall;

    private final List<Receipt> restoredReceipts =
            new ArrayList<>();

    private String restoredUserId = "";

    private String restoredMarketplace = "";

    @Override
    public void load() {
        super.load();

        try {
            PurchasingService.registerListener(
                    getContext().getApplicationContext(),
                    this
            );

            PurchasingService.enablePendingPurchases();

            android.util.Log.i(
                    TAG,
                    "Amazon IAP listener registered."
            );

        } catch (Exception error) {
            android.util.Log.e(
                    TAG,
                    "Amazon IAP initialization failed.",
                    error
            );
        }
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        String sku = call.getString("sku");

        if (sku == null || sku.trim().isEmpty()) {
            call.reject("Missing Amazon subscription SKU.");
            return;
        }

        final String cleanSku = sku.trim();

        android.util.Log.i(
                TAG,
                "Starting purchase for SKU: " + cleanSku
        );

        try {
            RequestId requestId =
                    PurchasingService.purchase(cleanSku);

            if (requestId == null) {
                android.util.Log.e(
                        TAG,
                        "Amazon returned a null purchase request ID."
                );

                call.reject(
                        "Amazon purchase could not be started: "
                                + "Amazon returned no request ID."
                );
                return;
            }

            pendingPurchases.put(
                    requestId.toString(),
                    call
            );

            call.setKeepAlive(true);

            android.util.Log.i(
                    TAG,
                    "Purchase request submitted. Request ID: "
                            + requestId
            );

        } catch (Exception error) {
            android.util.Log.e(
                    TAG,
                    "Exception starting Amazon purchase.",
                    error
            );

            call.reject(
                    "Amazon purchase could not be started: "
                            + safeMessage(error)
            );
        }
    }

    @PluginMethod
    public void getUserData(PluginCall call) {
        if (userDataCall != null) {
            call.reject(
                    "An Amazon user data request is already running."
            );
            return;
        }

        userDataCall = call;
        call.setKeepAlive(true);

        try {
            PurchasingService.getUserData();

        } catch (Exception error) {
            userDataCall = null;

            android.util.Log.e(
                    TAG,
                    "Amazon user data request failed.",
                    error
            );

            call.reject(
                    "Amazon user data request failed: "
                            + safeMessage(error)
            );
        }
    }

    @PluginMethod
    public void restorePurchases(PluginCall call) {
        startPurchaseUpdates(call);
    }

    @PluginMethod
    public void syncPurchases(PluginCall call) {
        startPurchaseUpdates(call);
    }

    private void startPurchaseUpdates(PluginCall call) {
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

        try {
            PurchasingService.getPurchaseUpdates(true);

        } catch (Exception error) {
            updatesCall = null;

            android.util.Log.e(
                    TAG,
                    "Amazon purchase updates request failed.",
                    error
            );

            call.reject(
                    "Amazon purchase updates failed: "
                            + safeMessage(error)
            );
        }
    }

    @PluginMethod
    public void fulfillPurchase(PluginCall call) {
        String receiptId = call.getString("receiptId");

        String result = call.getString(
                "result",
                "FULFILLED"
        );

        if (receiptId == null || receiptId.trim().isEmpty()) {
            call.reject("Missing receipt ID.");
            return;
        }

        final FulfillmentResult fulfillment;

        try {
            fulfillment = FulfillmentResult.valueOf(result);

        } catch (IllegalArgumentException error) {
            call.reject("Invalid fulfillment result.");
            return;
        }

        try {
            PurchasingService.notifyFulfillment(
                    receiptId.trim(),
                    fulfillment
            );

            JSObject response = new JSObject();
            response.put("success", true);

            call.resolve(response);

        } catch (Exception error) {
            android.util.Log.e(
                    TAG,
                    "Amazon fulfillment failed.",
                    error
            );

            call.reject(
                    "Amazon fulfillment failed: "
                            + safeMessage(error)
            );
        }
    }

    @Override
    public void onUserDataResponse(
            UserDataResponse response
    ) {
        android.util.Log.i(
                TAG,
                "User data response status: "
                        + response.getRequestStatus()
        );

        if (userDataCall == null) {
            return;
        }

        if (
                response.getRequestStatus()
                        == UserDataResponse.RequestStatus.SUCCESSFUL
        ) {
            JSObject data = new JSObject();

            if (response.getUserData() != null) {
                data.put(
                        "userId",
                        response.getUserData().getUserId()
                );

                data.put(
                        "marketplace",
                        response.getUserData().getMarketplace()
                );

                data.put(
                        "countryCode",
                        response.getUserData().getCountryCode()
                );
            }

            userDataCall.resolve(data);

        } else {
            userDataCall.reject(
                    "Amazon user data failed: "
                            + response.getRequestStatus()
            );
        }

        userDataCall = null;
    }

    @Override
    public void onProductDataResponse(
            ProductDataResponse response
    ) {
        android.util.Log.i(
                TAG,
                "Product data response status: "
                        + response.getRequestStatus()
        );

        if (response.getProductData() != null) {
            android.util.Log.i(
                    TAG,
                    "Products returned: "
                            + response.getProductData().keySet()
            );
        }

        if (response.getUnavailableSkus() != null) {
            android.util.Log.e(
                    TAG,
                    "Unavailable SKUs: "
                            + response.getUnavailableSkus()
            );
        }
    }

    @Override
    public void onPurchaseResponse(
            PurchaseResponse response
    ) {
        String requestKey =
                response.getRequestId().toString();

        PurchaseResponse.RequestStatus status =
                response.getRequestStatus();

        android.util.Log.i(
                TAG,
                "Amazon purchase response status: " + status
        );

        android.util.Log.i(
                TAG,
                "Amazon purchase response request ID: " + requestKey
        );

        PluginCall call = pendingPurchases.remove(requestKey);

        if (call == null) {
            android.util.Log.e(
                    TAG,
                    "No pending purchase call for request ID: "
                            + requestKey
            );
            return;
        }

        switch (status) {

            case SUCCESSFUL: {
                Receipt receipt = response.getReceipt();

                if (receipt == null) {
                    call.reject(
                            "Amazon returned no purchase receipt."
                    );
                    return;
                }

                JSObject result = new JSObject();

                result.put("success", true);
                result.put("sku", receipt.getSku());
                result.put("termSku", receipt.getTermSku());
                result.put("receiptId", receipt.getReceiptId());

                if (receipt.getPurchaseDate() != null) {
                    result.put(
                            "purchaseDate",
                            receipt.getPurchaseDate().getTime()
                    );
                }

                if (receipt.getProductType() != null) {
                    result.put(
                            "productType",
                            receipt.getProductType().toString()
                    );
                }

                if (response.getUserData() != null) {
                    result.put(
                            "userId",
                            response.getUserData().getUserId()
                    );

                    result.put(
                            "marketplace",
                            response.getUserData().getMarketplace()
                    );
                }

                call.resolve(result);
                break;
            }

            case ALREADY_PURCHASED:
                call.reject(
                        "ALREADY_PURCHASED: This item may already be owned."
                );
                break;

            case INVALID_SKU:
                call.reject(
                        "INVALID_SKU: Amazon did not accept the product SKU."
                );
                break;

            case NOT_SUPPORTED:
                call.reject(
                        "NOT_SUPPORTED: Amazon purchase is not supported "
                                + "in this environment."
                );
                break;

            case PENDING:
                call.reject(
                        "AMAZON_PURCHASE_PENDING: The purchase is pending."
                );
                break;

            case FAILED:
                android.util.Log.e(
                        TAG,
                        "Amazon returned FAILED for SKU request: "
                                + requestKey
                );

                call.reject(
                        "AMAZON_PURCHASE_FAILED: Amazon returned FAILED. "
                                + "Check the CartCueAmazonIAP logs."
                );
                break;

            default:
                android.util.Log.e(
                        TAG,
                        "Unexpected Amazon purchase status: " + status
                );

                call.reject(
                        "AMAZON_PURCHASE_FAILED: Amazon status was "
                                + status
                );
                break;
        }
    }

    @Override
    public void onPurchaseUpdatesResponse(
            PurchaseUpdatesResponse response
    ) {
        android.util.Log.i(
                TAG,
                "Purchase updates response status: "
                        + response.getRequestStatus()
        );

        if (updatesCall == null) {
            return;
        }

        if (
                response.getRequestStatus()
                        != PurchaseUpdatesResponse.RequestStatus.SUCCESSFUL
        ) {
            PluginCall call = updatesCall;
            updatesCall = null;

            call.reject(
                    "Amazon purchase updates failed: "
                            + response.getRequestStatus()
            );

            return;
        }

        if (response.getUserData() != null) {
            restoredUserId =
                    response.getUserData().getUserId();

            restoredMarketplace =
                    response.getUserData().getMarketplace();
        }

        if (response.getReceipts() != null) {
            for (Receipt receipt : response.getReceipts()) {
                if (receipt != null) {
                    restoredReceipts.add(receipt);
                }
            }
        }

        if (response.hasMore()) {
            try {
                PurchasingService.getPurchaseUpdates(false);

            } catch (Exception error) {
                PluginCall call = updatesCall;
                updatesCall = null;

                android.util.Log.e(
                        TAG,
                        "Amazon purchase pagination failed.",
                        error
                );

                call.reject(
                        "Amazon purchase pagination failed: "
                                + safeMessage(error)
                );
            }

            return;
        }

        JSArray receipts = new JSArray();

        for (Receipt receipt : restoredReceipts) {
            JSObject item = new JSObject();

            item.put("sku", receipt.getSku());
            item.put("termSku", receipt.getTermSku());
            item.put("receiptId", receipt.getReceiptId());

            if (receipt.getPurchaseDate() != null) {
                item.put(
                        "purchaseDate",
                        receipt.getPurchaseDate().getTime()
                );
            }

            item.put("canceled", receipt.isCanceled());

            receipts.put(item);
        }

        JSObject data = new JSObject();

        data.put("receipts", receipts);
        data.put("userId", restoredUserId);
        data.put("marketplace", restoredMarketplace);

        PluginCall call = updatesCall;
        updatesCall = null;

        call.resolve(data);
    }

    private String safeMessage(Exception error) {
        String message = error.getMessage();

        if (message == null || message.trim().isEmpty()) {
            return error.getClass().getSimpleName();
        }

        return message; 
           }
     
        }
