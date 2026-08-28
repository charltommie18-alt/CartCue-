package com.cartcue.app;

import android.os.Bundle;

import com.amazon.device.iap.PurchasingService;
import com.getcapacitor.BridgeActivity;

import java.util.HashSet;
import java.util.Set;

public class MainActivity extends BridgeActivity {

    private static final String PARENT_SKU =
            "CartCue_monthly_sub";

    private static final String SUBSCRIPTION_SKU =
            "CartCue_monthly_term";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AmazonIAPPlugin.class);

        super.onCreate(savedInstanceState);
    }

    @Override
    public void onResume() {
        super.onResume();

        /*
         * Amazon Appstore IAP calls are safe to make
         * when the app is running inside Amazon.
         *
         * Outside Amazon Appstore, these calls may
         * fail, so they are intentionally protected.
         */
        try {
            PurchasingService.getUserData();

            Set<String> productSkus =
                    new HashSet<>();

            productSkus.add(PARENT_SKU);
            productSkus.add(SUBSCRIPTION_SKU);

            PurchasingService.getProductData(
                    productSkus
            );

            /*
             * false means:
             * start from the last synchronized
             * purchase-update position.
             */
            PurchasingService.getPurchaseUpdates(
                    false
            );

        } catch (Exception ignored) {
            /*
             * CartCue can still run normally outside
             * the Amazon Appstore environment.
             */
        }
    }
}
