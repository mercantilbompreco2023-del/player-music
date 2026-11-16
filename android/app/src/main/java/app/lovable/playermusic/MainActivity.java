package app.lovable.playermusic;

import android.os.Bundle;
import android.os.Build;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MediaPlaybackPlugin.class);
        registerPlugin(FolderPickerPlugin.class);
        registerPlugin(PhoneMusicLibraryPlugin.class);
        registerPlugin(LibraryExportPlugin.class);
        super.onCreate(savedInstanceState);

        // Keep the WebView renderer at foreground priority while the media
        // foreground service is active. This reduces the chance that Android
        // kills the renderer during the short gap between consecutive tracks
        // when the screen is locked, before the next HTMLAudioElement source starts.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && getBridge() != null
                && getBridge().getWebView() != null) {
            getBridge().getWebView().setRendererPriorityPolicy(
                WebView.RENDERER_PRIORITY_BOUND, true
            );
        }
    }
}
