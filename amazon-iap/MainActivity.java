package com.cartcue.app;

import android.os.Bundle;

import com.amazon.device.iap.PurchasingService;

import com.getcapacitor.BridgeActivity;

import java.util.HashSet;
import java.util.Set;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AmazonIAPPlugin.class);

        super.onCreate(savedInstanceState);
    }

    @Override
    public void onResume() {
        super.onResume();

        try {
            /*
             * Amazon recommends retrieving user data,
             * product data, and purchase updates when
             * the main activity resumes.
             */

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
             * The app can also run outside Amazon Appstore.
             * In that situation Amazon IAP may not be available.
             */
            android.util.Log.d(
                    "CartCueAmazonIAP",
                    "Amazon IAP unavailable: " +
                    error.getMessage()
            );
        }
    }
}
