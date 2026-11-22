package ar.cygosc.eventosvelez;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Abre los ajustes de notificaciones de la app. Cuando el usuario ya rechazó los avisos, Android no vuelve a mostrar
// el cartel de permiso y la única forma de activarlos es desde ahí.
@CapacitorPlugin(name = "Ajustes")
public class AjustesPlugin extends Plugin {
    @PluginMethod
    public void abrirAvisos(PluginCall call) {
        String paquete = getContext().getPackageName();
        Intent intent;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, paquete);
        } else {
            intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", paquete, null));
        }
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getActivity().startActivity(intent);
        call.resolve();
    }
}
