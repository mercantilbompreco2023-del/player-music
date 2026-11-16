package app.lovable.playermusic;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

/** Widget Android com atalhos para os controles da sessão de mídia do Player Music. */
public class PlayerMusicWidgetProvider extends AppWidgetProvider {
    static final String PREFS = "player_music_widget";
    static final String TITLE = "title";
    static final String ARTIST = "artist";
    static final String PLAYING = "playing";

    static void refresh(Context context, String title, String artist, boolean playing) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putString(TITLE, title == null || title.isEmpty() ? "Player Music" : title)
            .putString(ARTIST, artist == null ? "Sua música" : artist)
            .putBoolean(PLAYING, playing).apply();
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName component = new ComponentName(context, PlayerMusicWidgetProvider.class);
        int[] ids = manager.getAppWidgetIds(component);
        for (int id : ids) updateOne(context, manager, id);
    }

    private static void updateOne(Context context, AppWidgetManager manager, int id) {
        android.content.SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String title = prefs.getString(TITLE, "Player Music");
        String artist = prefs.getString(ARTIST, "Abra o aplicativo para tocar");
        boolean playing = prefs.getBoolean(PLAYING, false);
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.player_music_widget);
        views.setTextViewText(R.id.widget_title, title);
        views.setTextViewText(R.id.widget_artist, artist);
        views.setImageViewResource(R.id.widget_play, playing ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play);
        views.setOnClickPendingIntent(R.id.widget_previous, action(context, "previous", 101));
        views.setOnClickPendingIntent(R.id.widget_play, action(context, playing ? "pause" : "play", 102));
        views.setOnClickPendingIntent(R.id.widget_next, action(context, "next", 103));
        Intent open = new Intent(context, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        views.setOnClickPendingIntent(R.id.widget_open, PendingIntent.getActivity(context, 104, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));
        manager.updateAppWidget(id, views);
    }

    private static PendingIntent action(Context context, String action, int requestCode) {
        Intent intent = new Intent(context, MediaPlaybackService.class).setAction(action);
        return PendingIntent.getService(context, requestCode, intent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    @Override public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) updateOne(context, manager, id);
    }
}