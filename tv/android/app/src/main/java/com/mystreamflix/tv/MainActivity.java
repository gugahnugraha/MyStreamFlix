package com.mystreamflix.tv;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

public class MainActivity extends Activity {

    private WebView mWebView;
    private long mLastBackPress = 0;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Enable Hardware Acceleration & Immersive Sticky Fullscreen
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        applyImmersiveMode();

        // Initialize TV WebView
        mWebView = new WebView(this);
        setContentView(mWebView);

        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setLoadsImagesAutomatically(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        // Android TV Custom User-Agent
        String defaultUa = settings.getUserAgentString();
        settings.setUserAgentString(defaultUa + " MyStreamFlixTV/1.0.0 (AndroidTV; Leanback)");

        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return false;
            }
        });

        mWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                return super.onConsoleMessage(consoleMessage);
            }
        });

        // Load the bundled MyStreamFlix TV client
        mWebView.loadUrl("file:///android_asset/index.html");
    }

    private void applyImmersiveMode() {
        View decorView = getWindow().getDecorView();
        int uiOptions = View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN;
        decorView.setSystemUiVisibility(uiOptions);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            applyImmersiveMode();
        }
    }

    /**
     * D-Pad Remote Key Forwarder to WebView
     */
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (mWebView != null) {
            switch (keyCode) {
                case KeyEvent.KEYCODE_DPAD_UP:
                    dispatchJsKey("ArrowUp", 38);
                    return true;
                case KeyEvent.KEYCODE_DPAD_DOWN:
                    dispatchJsKey("ArrowDown", 40);
                    return true;
                case KeyEvent.KEYCODE_DPAD_LEFT:
                    dispatchJsKey("ArrowLeft", 37);
                    return true;
                case KeyEvent.KEYCODE_DPAD_RIGHT:
                    dispatchJsKey("ArrowRight", 39);
                    return true;
                case KeyEvent.KEYCODE_DPAD_CENTER:
                case KeyEvent.KEYCODE_ENTER:
                    dispatchJsKey("Enter", 13);
                    return true;
                case KeyEvent.KEYCODE_BACK:
                    handleBackPress();
                    return true;
                case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:
                case KeyEvent.KEYCODE_MEDIA_PLAY:
                case KeyEvent.KEYCODE_MEDIA_PAUSE:
                    dispatchJsKey("MediaPlayPause", 179);
                    return true;
            }
        }
        return super.onKeyDown(keyCode, event);
    }

    private void dispatchJsKey(String keyName, int keyCode) {
        if (mWebView == null) return;
        String js = String.format(
            "window.dispatchEvent(new KeyboardEvent('keydown', { key: '%s', code: '%s', keyCode: %d, bubbles: true }));",
            keyName, keyName, keyCode
        );
        mWebView.evaluateJavascript(js, null);
    }

    private void handleBackPress() {
        long now = System.currentTimeMillis();
        // Forward back button to JavaScript Spatial Navigation first
        dispatchJsKey("Escape", 27);

        // If double pressed within 2 seconds at top level, exit application
        if (now - mLastBackPress < 2000) {
            finish();
        } else {
            mLastBackPress = now;
        }
    }

    @Override
    protected void onDestroy() {
        if (mWebView != null) {
            mWebView.destroy();
            mWebView = null;
        }
        super.onDestroy();
    }
}
