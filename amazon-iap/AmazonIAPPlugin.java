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

    private final Map<String, PluginCall>
            pendingPurchases =
            new HashMap<>();

    private PluginCall userDataCall;

    private PluginCall updatesCall;

    private final List<Receipt>
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

        try {

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

        } catch (Exception error) {

            call.reject(
                    "Amazon purchase could not be started."
            );
        }
    }

    @PluginMethod
    public void getUserData(
            PluginCall call
    ) {
        userDataCall = call;

        call.setKeepAlive(true);

        try {

            PurchasingService.getUserData();

        } catch (Exception error) {

            userDataCall = null;

            call.reject(
                    "Amazon user data could not be requested."
            );
        }
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

        try {

            PurchasingService.getPurchaseUpdates(
                    true
            );

        } catch (Exception error) {

            updatesCall = null;

            call.reject(
                    "Amazon purchase synchronization could not be started."
            );
        }
    }

    @PluginMethod
    public void fulfillPurchase(
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

        FulfillmentResult fulfillment;

        try {

            fulfillment =
                    FulfillmentResult.valueOf(
                            result
                    );

        } catch (Exception error) {

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

            JSObject response =
                    new JSObject();

            response.put(
                    "success",
                    true
            );

            call.resolve(response);

        } catch (Exception error) {

            call.reject(
                    "Amazon fulfillment failed."
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

        PluginCall call =
                userDataCall;

        userDataCall = null;

        if (
                response != null &&
                response.getRequestStatus() ==
                UserDataResponse.RequestStatus.SUCCESSFUL &&
                response.getUserData() != null
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

            call.resolve(data);

        } else {

            call.reject(
                    "Amazon user data failed."
            );
        }
    }

    @Override
    public void onProductDataResponse(
            ProductDataResponse response
    ) {
        /*
         * Amazon product information is received here.
         * CartCue uses its registered subscription SKU.
         */
    }

    @Override
    public void onPurchaseResponse(
            PurchaseResponse response
    ) {

        if (
                response == null ||
                response.getRequestId() == null
        ) {
            return;
        }

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

                if (
                        receipt.getPurchaseDate() != null
                ) {
                    result.put(
                            "purchaseDate",
                            receipt
                                    .getPurchaseDate()
                                    .getTime()
                    );
                }

                if (
                        receipt.getProductType() != null
                ) {
                    result.put(
                            "productType",
                            receipt
                                    .getProductType()
                                    .toString()
                    );
                }

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
                response == null ||
                response.getRequestStatus() !=
                PurchaseUpdatesResponse.RequestStatus.SUCCESSFUL
        ) {

            PluginCall call =
                    updatesCall;

            updatesCall = null;

            call.reject(
                    "Amazon purchase updates failed."
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

                if (receipt != null) {
                    restoredReceipts.add(
                            receipt
                    );
                }
            }
        }

        /*
         * Amazon can return purchase history
         * over multiple update pages.
         */
        if (response.hasMore()) {

            try {

                PurchasingService.getPurchaseUpdates(
                        false
                );

            } catch (Exception error) {

                PluginCall call =
                        updatesCall;

                updatesCall = null;

                call.reject(
                        "Amazon could not continue purchase synchronization."
                );
            }

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

            if (
                    receipt.getPurchaseDate() != null
            ) {

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

        JSObject result =
                new JSObject();

        result.put(
                "receipts",
                receipts
        );

        result.put(
                "userId",
                restoredUserId
        );

        result.put(
                "marketplace",
                restoredMarketplace
        );

        PluginCall call =
                updatesCall;

        updatesCall = null;

        call.resolve(result);
    }
                }
