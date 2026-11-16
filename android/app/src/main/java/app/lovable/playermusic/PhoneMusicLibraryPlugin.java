package app.lovable.playermusic;
import android.Manifest;
import android.content.ContentUris;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.util.Base64;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

/** Acesso somente leitura à biblioteca de áudio indexada pelo Android. */
@CapacitorPlugin(name = "PhoneMusicLibrary", permissions = {
    @Permission(alias = "audio", strings = { Manifest.permission.READ_MEDIA_AUDIO }),
    @Permission(alias = "legacyAudio", strings = { Manifest.permission.READ_EXTERNAL_STORAGE })
})
public class PhoneMusicLibraryPlugin extends Plugin {
    @PluginMethod
    public void list(PluginCall call) {
        String permission = Build.VERSION.SDK_INT >= 33 ? Manifest.permission.READ_MEDIA_AUDIO : Manifest.permission.READ_EXTERNAL_STORAGE;
        if (ContextCompat.checkSelfPermission(getContext(), permission) != PackageManager.PERMISSION_GRANTED) {
            requestPermissionForAlias(Build.VERSION.SDK_INT >= 33 ? "audio" : "legacyAudio", call, "afterAudioPermission");
            return;
        }
        listGranted(call);
    }
    @com.getcapacitor.annotation.PermissionCallback
    private void afterAudioPermission(PluginCall call) {
        String permission = Build.VERSION.SDK_INT >= 33 ? Manifest.permission.READ_MEDIA_AUDIO : Manifest.permission.READ_EXTERNAL_STORAGE;
        if (ContextCompat.checkSelfPermission(getContext(), permission) != PackageManager.PERMISSION_GRANTED) {
            call.reject("Permissão para acessar as músicas do aparelho não concedida.", "PERMISSION_DENIED"); return;
        }
        listGranted(call);
    }
    private void listGranted(PluginCall call) {
        new Thread(() -> {
            Cursor cursor = null;
            try {
                Uri collection = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
                String[] projection = { MediaStore.Audio.Media._ID, MediaStore.Audio.Media.DISPLAY_NAME, MediaStore.Audio.Media.TITLE, MediaStore.Audio.Media.ARTIST, MediaStore.Audio.Media.ALBUM, MediaStore.Audio.Media.MIME_TYPE, MediaStore.Audio.Media.SIZE };
                cursor = getContext().getContentResolver().query(collection, projection, MediaStore.Audio.Media.IS_MUSIC + " != 0", null, MediaStore.Audio.Media.ARTIST + " COLLATE NOCASE ASC, " + MediaStore.Audio.Media.TITLE + " COLLATE NOCASE ASC");
                JSArray tracks = new JSArray();
                if (cursor != null) while (cursor.moveToNext()) {
                    long id = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID));
                    JSObject item = new JSObject();
                    item.put("uri", ContentUris.withAppendedId(collection, id).toString());
                    item.put("name", cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DISPLAY_NAME)));
                    item.put("title", cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE)));
                    item.put("artist", cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST)));
                    item.put("album", cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM)));
                    item.put("type", cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.MIME_TYPE)));
                    item.put("size", cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.SIZE)));
                    tracks.put(item);
                }
                JSObject result = new JSObject(); result.put("tracks", tracks); call.resolve(result);
            } catch (Exception e) { call.reject("Não foi possível consultar as músicas do aparelho.", e); }
            finally { if (cursor != null) cursor.close(); }
        }).start();
    }
    @PluginMethod
    public void read(PluginCall call) {
        String value = call.getString("uri");
        if (value == null) { call.reject("Arquivo inválido."); return; }
        new Thread(() -> {
            try (InputStream in = getContext().getContentResolver().openInputStream(Uri.parse(value)); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                if (in == null) throw new IllegalStateException("Arquivo indisponível");
                byte[] buffer = new byte[65536]; int count;
                while ((count = in.read(buffer)) != -1) out.write(buffer, 0, count);
                JSObject result = new JSObject(); result.put("data", Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)); call.resolve(result);
            } catch (Exception e) { call.reject("Falha ao ler o arquivo de áudio: " + (e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage()), "AUDIO_FILE_READ_FAILED", e); }
        }).start();
    }
}
