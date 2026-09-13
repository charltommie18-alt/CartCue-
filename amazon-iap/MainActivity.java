package com.cartcue.app;

import android.os.Bundle;

import com.amazon.device.iap.PurchasingService;
import com.getcapacitor.BridgeActivity;

import java.util.HashSet;
import java.util.Set;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(
            Bundle savedInstanceState
    ) {
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

        try {
            /*
             * Amazon IAP listener registration is performed
             * by AmazonIAPPlugin.load().
             *
             * On resume we refresh the Amazon account,
             * product information and purchase updates.
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

        } catch (Exception exception) {

            /*
             * The app may be opened outside an Amazon
             * Appstore environment during development.
             *
             * Do not crash the application in that case.
             */
            exception.printStackTrace();
        }
    }
}
