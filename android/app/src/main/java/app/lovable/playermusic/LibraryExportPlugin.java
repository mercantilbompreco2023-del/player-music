package app.lovable.playermusic;

import android.app.Activity;
import android.content.Intent;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/** Saves metadata through Android's document picker, without storage-wide access. */
@CapacitorPlugin(name = "LibraryExport")
public class LibraryExportPlugin extends Plugin {
    @PluginMethod
    public void save(PluginCall call) {
        if (call.getString("csv") == null) {
            call.reject("Lista inválida.");
            return;
        }
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("text/csv");
        intent.putExtra(Intent.EXTRA_TITLE, "player-music-biblioteca.csv");
        startActivityForResult(call, intent, "saved");
    }

    @ActivityCallback
    private void saved(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
            JSObject response = new JSObject();
            response.put("cancelled", true);
            call.resolve(response);
            return;
        }
        new Thread(() -> {
            try (OutputStream output = getContext().getContentResolver().openOutputStream(result.getData().getData(), "wt")) {
                String csv = call.getString("csv");
                if (output == null || csv == null) throw new java.io.IOException();
                output.write(csv.getBytes(StandardCharsets.UTF_8));
                JSObject response = new JSObject();
                response.put("cancelled", false);
                call.resolve(response);
            } catch (Exception error) {
                call.reject("Não foi possível salvar a lista. Escolha outro local e tente novamente.");
            }
        }).start();
    }
}