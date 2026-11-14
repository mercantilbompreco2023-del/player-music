package app.lovable.playermusic;

import android.Manifest;
import android.content.Intent;
import android.os.Build;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

/** Ponte entre o player (página) e o serviço de mídia nativo. */
@CapacitorPlugin(name = "MediaPlayback", permissions = { @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS }) })
public class MediaPlaybackPlugin extends Plugin {
    static MediaPlaybackPlugin instance;

    @Override
    public void load() { instance = this; }

    static void emit(String action) {
        if (instance == null) return;
        JSObject o = new JSObject();
        o.put("action", action);
        instance.notifyListeners("action", o);
    }

    @PluginMethod
    public void update(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33 && getPermissionState("notifications") != com.getcapacitor.PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "afterPermission");
            return;
        }
        startService(call);
    }

    @com.getcapacitor.annotation.PermissionCallback
    private void afterPermission(PluginCall call) { startService(call); }

    private void startService(PluginCall call) {
        Intent i = new Intent(getContext(), MediaPlaybackService.class);
        i.setAction(MediaPlaybackService.ACTION_UPDATE);
        i.putExtra("title", call.getString("title", "Player Music"));
        i.putExtra("artist", call.getString("artist", ""));
        i.putExtra("playing", Boolean.TRUE.equals(call.getBoolean("isPlaying", false)));
        i.putExtra("position", (long) (call.getDouble("position", 0.0) * 1000));
        i.putExtra("duration", (long) (call.getDouble("duration", 0.0) * 1000));
        ContextCompat.startForegroundService(getContext(), i);
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getContext().stopService(new Intent(getContext(), MediaPlaybackService.class));
        call.resolve();
    }
}
