package com.cartcue.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {

        // Register CartCue's native Amazon IAP plugin
        // BEFORE Capacitor initializes the WebView.
        registerPlugin(AmazonIAPPlugin.class);

        super.onCreate(savedInstanceState);
    }
}
