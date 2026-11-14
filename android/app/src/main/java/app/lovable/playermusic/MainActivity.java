package app.lovable.playermusic;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MediaPlaybackPlugin.class);
        registerPlugin(FolderPickerPlugin.class);
        registerPlugin(LibraryExportPlugin.class);
        registerPlugin(MediaScanPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
