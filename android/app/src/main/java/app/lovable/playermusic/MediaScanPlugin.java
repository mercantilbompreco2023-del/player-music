package app.lovable.playermusic;

import android.content.ContentUris;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.util.Base64;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

/**
 * Procura as músicas que já existem no aparelho (biblioteca de mídia do Android)
 * e lê o conteúdo de uma delas. Somente leitura: nada é modificado ou apagado.
 */
@CapacitorPlugin(
    name = "MediaScan",
    permissions = {
        @Permission(alias = "audio33", strings = { "android.permission.READ_MEDIA_AUDIO" }),
        @Permission(alias = "audioLegacy", strings = { "android.permission.READ_EXTERNAL_STORAGE" })
    }
)
public class MediaScanPlugin extends Plugin {

    private static final int MAX_ITEMS = 2000;

    @PluginMethod
    public void scan(PluginCall call) {
        String alias = Build.VERSION.SDK_INT >= 33 ? "audio33" : "audioLegacy";
        if (getPermissionState(alias) == PermissionState.GRANTED) {
            doScan(call);
            return;
        }
        requestPermissionForAlias(alias, call, "audioResult");
    }

    @PermissionCallback
    private void audioResult(PluginCall call) {
        if (call == null) return;
        String alias = Build.VERSION.SDK_INT >= 33 ? "audio33" : "audioLegacy";
        if (getPermissionState(alias) != PermissionState.GRANTED) {
            call.reject("O Android não permitiu ler as músicas do aparelho. Autorize o acesso em Configurações > Aplicativos > Player Music.", "PERMISSION_DENIED");
            return;
        }
        doScan(call);
    }

    private void doScan(PluginCall call) {
        new Thread(() -> {
            JSArray files = new JSArray();
            try {
                String[] proj = {
                    MediaStore.Audio.Media._ID,
                    MediaStore.Audio.Media.DISPLAY_NAME,
                    MediaStore.Audio.Media.ARTIST,
                    MediaStore.Audio.Media.ALBUM,
                    MediaStore.Audio.Media.DURATION,
                    MediaStore.Audio.Media.SIZE
                };
                Cursor c = getContext().getContentResolver().query(
                    MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
                    proj,
                    MediaStore.Audio.Media.IS_MUSIC + " != 0",
                    null,
                    MediaStore.Audio.Media.TITLE + " ASC"
                );
                if (c != null) {
                    try {
                        int iId = c.getColumnIndexOrThrow(MediaStore.Audio.Media._ID);
                        int iName = c.getColumnIndexOrThrow(MediaStore.Audio.Media.DISPLAY_NAME);
                        int iArtist = c.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST);
                        int iAlbum = c.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM);
                        int iDur = c.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION);
                        int iSize = c.getColumnIndexOrThrow(MediaStore.Audio.Media.SIZE);
                        while (c.moveToNext() && files.length() < MAX_ITEMS) {
                            long id = c.getLong(iId);
                            Uri uri = ContentUris.withAppendedId(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, id);
                            String name = c.getString(iName);
                            if (name == null || name.isEmpty()) name = "faixa " + id;
                            JSObject o = new JSObject();
                            o.put("uri", uri.toString());
                            o.put("name", name);
                            o.put("artist", safe(c.getString(iArtist)));
                            o.put("album", safe(c.getString(iAlbum)));
                            o.put("duration", c.getLong(iDur));
                            o.put("size", c.getLong(iSize));
                            files.put(o);
                        }
                    } finally {
                        c.close();
                    }
                }
                JSObject result = new JSObject();
                result.put("files", files);
                result.put("limit", MAX_ITEMS);
                call.resolve(result);
            } catch (Exception e) {
                call.reject("Não foi possível procurar as músicas do aparelho.");
            }
        }).start();
    }

    private String safe(String v) {
        if (v == null || v.isEmpty() || "<unknown>".equalsIgnoreCase(v)) return "";
        return v;
    }

    @PluginMethod
    public void read(PluginCall call) {
        String uri = call.getString("uri");
        if (uri == null) { call.reject("Arquivo inválido."); return; }
        new Thread(() -> {
            try (InputStream in = getContext().getContentResolver().openInputStream(Uri.parse(uri))) {
                if (in == null) { call.reject("Não foi possível abrir a música."); return; }
                ByteArrayOutputStream bos = new ByteArrayOutputStream();
                byte[] buf = new byte[65536];
                int n;
                while ((n = in.read(buf)) > 0) bos.write(buf, 0, n);
                JSObject o = new JSObject();
                o.put("data", Base64.encodeToString(bos.toByteArray(), Base64.NO_WRAP));
                call.resolve(o);
            } catch (Exception e) {
                call.reject("Erro ao ler a música.");
            }
        }).start();
    }
}
