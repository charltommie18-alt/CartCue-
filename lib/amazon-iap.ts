package com.cartcue.app;

import android.os.Bundle;

import com.amazon.device.iap.PurchasingService;
import com.getcapacitor.BridgeActivity;

import java.util.HashSet;
import java.util.Set;

public class MainActivity
        extends BridgeActivity {

    @Override
    public void onCreate(
            Bundle savedInstanceState
    ) {
        /*
         * Register CartCue's Amazon IAP
         * Capacitor plugin before the activity
         * is created.
         */
        registerPlugin(
                AmazonIAPPlugin.class
        );

        super.onCreate(
                savedInstanceState
        );
    }

    @Override
    public void onResume() {
        super.onResume();

        /*
         * Amazon IAP must be refreshed whenever
         * the app comes to the foreground.
         *
         * This keeps:
         * - Amazon user information
         * - subscriptions
         * - renewals
         * - cancellations
         * - restored purchases
         * synchronized.
         */
        try {

            /*
             * Get the Amazon Appstore user ID.
             */
            PurchasingService.getUserData();

            /*
             * Validate the parent subscription SKU
             * and the monthly term SKU.
             *
             * Parent SKU:
             * CartCue_monthly_sub
             *
             * Monthly term SKU:
             * CartCue_monthly_term
             */
            Set<String> productSkus =
                    new HashSet<>();

            productSkus.add(
                    "CartCue_monthly_sub"
            );

            productSkus.add(
                    "CartCue_monthly_term"
            );

            PurchasingService.getProductData(
                    productSkus
            );

            /*
             * Sync new and changed purchases.
             *
             * false = retrieve updates since the
             * previous synchronization.
             */
            PurchasingService.getPurchaseUpdates(
                    false
            );

        } catch (
                Exception ignored
        ) {
            /*
             * The Amazon Appstore may not be
             * available when running the APK
             * outside the Amazon Appstore.
             *
             * Do not crash CartCue in that case.
             */
        }
    }
        }
