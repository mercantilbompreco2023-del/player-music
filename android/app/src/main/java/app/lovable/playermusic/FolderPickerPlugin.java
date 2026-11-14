package app.lovable.playermusic;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;
import androidx.activity.result.ActivityResult;
import androidx.documentfile.provider.DocumentFile;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

/** Seletor de pasta do Android (somente leitura da pasta escolhida e subpastas). */
@CapacitorPlugin(name = "FolderPicker")
public class FolderPickerPlugin extends Plugin {

    @PluginMethod
    public void pick(PluginCall call) {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        startActivityForResult(call, i, "picked");
    }

    @ActivityCallback
    private void picked(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
            call.reject("cancelado", "CANCELLED");
            return;
        }
        Uri tree = result.getData().getData();
        new Thread(() -> {
            try {
                DocumentFile root = DocumentFile.fromTreeUri(getContext(), tree);
                JSArray files = new JSArray();
                walk(root, "", files);
                JSObject o = new JSObject();
                o.put("name", root != null && root.getName() != null ? root.getName() : "pasta");
                o.put("files", files);
                call.resolve(o);
            } catch (Exception e) {
                call.reject("Não foi possível ler a pasta.");
            }
        }).start();
    }

    private void walk(DocumentFile dir, String prefix, JSArray out) {
        if (dir == null) return;
        for (DocumentFile f : dir.listFiles()) {
            String name = f.getName() == null ? "" : f.getName();
            String path = prefix.isEmpty() ? name : prefix + "/" + name;
            if (f.isDirectory()) walk(f, path, out);
            else if (f.isFile()) {
                JSObject o = new JSObject();
                o.put("uri", f.getUri().toString());
                o.put("path", path);
                o.put("name", name);
                o.put("type", f.getType() == null ? "" : f.getType());
                o.put("size", f.length());
                out.put(o);
            }
        }
    }

    @PluginMethod
    public void read(PluginCall call) {
        String uri = call.getString("uri");
        if (uri == null) { call.reject("Arquivo inválido."); return; }
        new Thread(() -> {
            try (InputStream in = getContext().getContentResolver().openInputStream(Uri.parse(uri))) {
                ByteArrayOutputStream bos = new ByteArrayOutputStream();
                byte[] buf = new byte[65536];
                int n;
                while ((n = in.read(buf)) > 0) bos.write(buf, 0, n);
                JSObject o = new JSObject();
                o.put("data", Base64.encodeToString(bos.toByteArray(), Base64.NO_WRAP));
                call.resolve(o);
            } catch (Exception e) {
                call.reject("Erro ao ler o arquivo.");
            }
        }).start();
    }
}
