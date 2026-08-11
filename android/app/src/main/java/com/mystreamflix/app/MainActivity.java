package com.mystreamflix.app;

import android.os.Bundle;

import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ImmersiveModePlugin.class);
        super.onCreate(savedInstanceState);

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (ImmersiveModePlugin.isImmersiveActive()) {
                    ImmersiveModePlugin.exitImmersive(MainActivity.this);
                    ImmersiveModePlugin.onImmersiveExitedByBack(MainActivity.this);
                    return;
                }
                setEnabled(false);
                getOnBackPressedDispatcher().onBackPressed();
            }
        });
    }
}
