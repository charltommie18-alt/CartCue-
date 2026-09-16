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
         * Register the Amazon IAP Capacitor
         * plugin before the WebView starts.
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
         * Synchronize Amazon IAP state whenever
         * the application returns to the foreground.
         */
        try {
            PurchasingService.getUserData();

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

            PurchasingService.getPurchaseUpdates(
                    false
            );

        } catch (Exception error) {
            /*
             * Amazon IAP may not be available
             * outside the Amazon Appstore.
             */
        }
    }
        }
