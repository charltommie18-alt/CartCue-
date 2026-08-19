package com.cartcue.app;

import android.os.Bundle;

import com.amazon.device.iap.PurchasingService;
import com.getcapacitor.BridgeActivity;

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
         * Amazon recommends checking purchase
         * updates when the app resumes so that
         * subscription changes, renewals and
         * cancellations are not missed.
         */
        try {
            PurchasingService.getPurchaseUpdates(
                    false
            );
        } catch (
                Exception ignored
        ) {
            // Amazon Appstore may not be available
            // in some environments.
        }
    }
        }
