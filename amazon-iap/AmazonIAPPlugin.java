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
public class AmazonIAPPlugin
        extends Plugin
        implements PurchasingListener {

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

        /*
         * Amazon requires the PurchasingListener to be
         * registered before IAP requests are made.
         */
        try {
            PurchasingService.registerListener(
                    getContext().getApplicationContext(),
                    this
            );

            /*
             * Enable Amazon pending purchases.
             * This is required when supporting purchases
             * that can remain pending for approval.
             */
            PurchasingService.enablePendingPurchases();

        } catch (Exception error) {
            android.util.Log.e(
                    "CartCueAmazonIAP",
                    "Amazon IAP initialization failed",
                    error
            );
        }
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        String sku = call.getString("sku");

        if (sku == null || sku.trim().isEmpty()) {
            call.reject(
                    "Missing Amazon subscription SKU."
            );
            return;
        }

        final String cleanSku = sku.trim();

        try {
            RequestId requestId =
                    PurchasingService.purchase(cleanSku);

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

        } catch (Exception error) {
            call.reject(
                    "Amazon purchase could not be started: " +
                    safeMessage(error)
            );
        }
    }

    @PluginMethod
    public void getUserData(PluginCall call) {
        userDataCall = call;

        call.setKeepAlive(true);

        try {
            PurchasingService.getUserData();
        } catch (Exception error) {
            userDataCall = null;

            call.reject(
                    "Amazon user data request failed: " +
                    safeMessage(error)
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

            call.reject(
                    "Amazon purchase updates failed: " +
                    safeMessage(error)
            );
        }
    }

    @PluginMethod
    public void fulfillPurchase(PluginCall call) {
        String receiptId =
                call.getString("receiptId");

        String result =
                call.getString(
                        "result",
                        "FULFILLED"
                );

        if (receiptId == null ||
                receiptId.trim().isEmpty()) {

            call.reject(
                    "Missing receipt ID."
            );
            return;
        }

        FulfillmentResult fulfillment;

        try {
            fulfillment =
                    FulfillmentResult.valueOf(
                            result
                    );
        } catch (IllegalArgumentException error) {
            call.reject(
                    "Invalid fulfillment result."
            );
            return;
        }

        try {
            PurchasingService.notifyFulfillment(
                    receiptId.trim(),
                    fulfillment
            );

            JSObject response = new JSObject();

            response.put(
                    "success",
                    true
            );

            call.resolve(response);

        } catch (Exception error) {
            call.reject(
                    "Amazon fulfillment failed: " +
                    safeMessage(error)
            );
        }
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
         * Product information is requested by MainActivity
         * so Amazon can validate the configured SKUs.
         *
         * The purchase call itself is asynchronous and
         * completes through onPurchaseResponse().
         */
        android.util.Log.d(
                "CartCueAmazonIAP",
                "Product data response: " +
                response.getRequestStatus()
        );
    }

    @Override
    public void onPurchaseResponse(
            PurchaseResponse response
    ) {
        String requestKey =
                response.getRequestId().toString();

        PluginCall call =
                pendingPurchases.remove(requestKey);

        if (call == null) {
            return;
        }

        switch (response.getRequestStatus()) {

            case SUCCESSFUL:

                Receipt receipt =
                        response.getReceipt();

                if (receipt == null) {
                    call.reject(
                            "Amazon returned no purchase receipt."
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

                call.resolve(result);

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

            case PENDING:

                call.reject(
                        "AMAZON_PURCHASE_PENDING"
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
            PluginCall call = updatesCall;

            updatesCall = null;

            call.reject(
                    "Amazon purchase updates failed: " +
                    response.getRequestStatus()
            );

            return;
        }

        if (response.getUserData() != null) {
            restoredUserId =
                    response
                            .getUserData()
                            .getUserId();

            restoredMarketplace =
                    response
                            .getUserData()
                            .getMarketplace();
        }

        if (response.getReceipts() != null) {
            for (
                    Receipt receipt :
                    response.getReceipts()
            ) {
                if (receipt != null) {
                    restoredReceipts.add(receipt);
                }
            }
        }

        /*
         * Amazon purchase updates are paginated.
         */
        if (response.hasMore()) {
            try {
                PurchasingService.getPurchaseUpdates(false);
            } catch (Exception error) {
                PluginCall call = updatesCall;

                updatesCall = null;

                call.reject(
                        "Amazon purchase pagination failed: " +
                        safeMessage(error)
                );
            }

            return;
        }

        JSArray receipts = new JSArray();

        for (
                Receipt receipt :
                restoredReceipts
        ) {
            JSObject item = new JSObject();

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

            if (receipt.getPurchaseDate() != null) {
                item.put(
                        "purchaseDate",
                        receipt
                                .getPurchaseDate()
                                .getTime()
                );
            }

            item.put(
                    "canceled",
                    receipt.isCanceled()
            );

            receipts.put(item);
        }

        JSObject data = new JSObject();

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

        PluginCall call = updatesCall;

        updatesCall = null;

        call.resolve(data);
    }

    private String safeMessage(Exception error) {
        String message = error.getMessage();

        if (message == null ||
                message.trim().isEmpty()) {
            return error.getClass().getSimpleName();
        }

        return message;
    }
                    }
