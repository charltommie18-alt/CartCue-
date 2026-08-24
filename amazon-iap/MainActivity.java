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

        /*
         * Amazon recommends requesting user data,
         * validating the subscription SKUs, and
         * synchronizing purchase updates when the
         * app resumes.
         */
        try {
            PurchasingService.getUserData();

            Set<String> productSkus =
                    new HashSet<>();

            // Parent subscription SKU.
            productSkus.add(
                    "CartCue_monthly_sub"
            );

            // Monthly child/term SKU that is
            // actually purchased.
            productSkus.add(
                    "CartCue_monthly_term"
            );

            PurchasingService.getProductData(
                    productSkus
            );

            PurchasingService.getPurchaseUpdates(
                    false
            );
        } catch (
                Exception ignored
        ) {
            // Amazon Appstore may not be available
            // in some non-Amazon environments.
        }
    }
        }
