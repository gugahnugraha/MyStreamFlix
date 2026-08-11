package com.mystreamflix.app;

import android.app.Activity;
import android.os.Build;
import android.view.View;

import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * ImmersiveModePlugin toggles Android immersive fullscreen (hides the status bar
 * and the system navigation bar) so the media player controls are never blocked
 * by Android system UI on mobile / Android APK builds.
 */
@CapacitorPlugin(name = "ImmersiveMode")
public class ImmersiveModePlugin extends Plugin {

    private static volatile boolean immersiveActive = false;
    private static volatile ImmersiveModePlugin instance = null;

    @Override
    public void load() {
        instance = this;
    }

    public static boolean isImmersiveActive() {
        return immersiveActive;
    }

    public static void onImmersiveExitedByBack(Activity activity) {
        immersiveActive = false;
        ImmersiveModePlugin plugin = instance;
        if (plugin != null) {
            try {
                plugin.notifyListeners(
                    "immersiveStateChange",
                    new JSObject().put("isFullscreen", false)
                );
            } catch (Exception ignore) {
            }
        }
    }

    @PluginMethod
    public void enable(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity unavailable");
            return;
        }
        activity.runOnUiThread(() -> {
            enterImmersive(activity);
            immersiveActive = true;
            notifyListeners("immersiveStateChange", new JSObject().put("isFullscreen", true));
            call.resolve();
        });
    }

    @PluginMethod
    public void disable(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity unavailable");
            return;
        }
        activity.runOnUiThread(() -> {
            exitImmersive(activity);
            immersiveActive = false;
            notifyListeners("immersiveStateChange", new JSObject().put("isFullscreen", false));
            call.resolve();
        });
    }

    public static void enterImmersive(Activity activity) {
        if (activity == null) return;
        View decor = activity.getWindow().getDecorView();
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsControllerCompat controller = ViewCompat.getWindowInsetsController(decor);
            if (controller != null) {
                controller.hide(WindowInsetsCompat.Type.systemBars());
                controller.setSystemBarsBehavior(
                    WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                );
            }
        } else {
            decor.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    | View.SYSTEM_UI_FLAG_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            );
        }
    }

    public static void exitImmersive(Activity activity) {
        if (activity == null) return;
        View decor = activity.getWindow().getDecorView();
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsControllerCompat controller = ViewCompat.getWindowInsetsController(decor);
            if (controller != null) {
                controller.show(WindowInsetsCompat.Type.systemBars());
            }
        } else {
            decor.setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
        }
    }
}
