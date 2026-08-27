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
             * Ask Amazon for the current customer.
             */
            PurchasingService.getUserData();

            /*
             * Validate BOTH the subscription parent
             * and its child/term SKU.
             *
             * Amazon requires the parent and all child
             * subscription SKUs to be supplied when
             * calling getProductData().
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
             * Synchronize purchases.
             *
             * This allows CartCue to discover an
             * existing subscription when the app
             * starts or resumes.
             */
            PurchasingService.getPurchaseUpdates(
                    false
            );

        } catch (
                Exception ignored
        ) {
            /*
             * The Amazon Appstore may not be available
             * when this APK is launched outside Amazon.
             */
        }
    }
        }
