package app.lovable.playermusic;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;

/** Serviço de mídia em primeiro plano: notificação fixa + controles na tela bloqueada. */
public class MediaPlaybackService extends Service {
    static final String ACTION_UPDATE = "pm.UPDATE";
    static final String CHANNEL = "player_music_playback";
    private MediaSessionCompat session;
    private PowerManager.WakeLock wakeLock;

    @Override
    public void onCreate() {
        super.onCreate();
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, "Reprodução", NotificationManager.IMPORTANCE_LOW);
            ch.setDescription("Controles da música que está tocando");
            getSystemService(NotificationManager.class).createNotificationChannel(ch);
        }
        session = new MediaSessionCompat(this, "PlayerMusic");
        session.setCallback(new MediaSessionCompat.Callback() {
            @Override public void onPlay() { MediaPlaybackPlugin.emit("play"); }
            @Override public void onPause() { MediaPlaybackPlugin.emit("pause"); }
            @Override public void onSkipToNext() { MediaPlaybackPlugin.emit("next"); }
            @Override public void onSkipToPrevious() { MediaPlaybackPlugin.emit("previous"); }
            @Override public void onStop() { MediaPlaybackPlugin.emit("pause"); }
        });
        session.setActive(true);
        wakeLock = ((PowerManager) getSystemService(POWER_SERVICE)).newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "PlayerMusic:playback");
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) return START_NOT_STICKY;
        String a = intent.getAction();
        if ("play".equals(a) || "pause".equals(a) || "next".equals(a) || "previous".equals(a)) {
            MediaPlaybackPlugin.emit(a);
            return START_NOT_STICKY;
        }
        String title = intent.getStringExtra("title");
        String artist = intent.getStringExtra("artist");
        boolean playing = intent.getBooleanExtra("playing", false);
        long pos = intent.getLongExtra("position", 0), dur = intent.getLongExtra("duration", 0);
        Bitmap artwork = null;
        String artworkBase64 = intent.getStringExtra("artworkBase64");
        if (artworkBase64 != null && !artworkBase64.isEmpty() && artworkBase64.length() < 1400000) {
            try { byte[] imageBytes = Base64.decode(artworkBase64, Base64.DEFAULT); artwork = BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.length); }
            catch (IllegalArgumentException ignored) { artwork = null; }
        }

        session.setMetadata(new MediaMetadataCompat.Builder()
            .putString(MediaMetadataCompat.METADATA_KEY_TITLE, title)
            .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, artist)
            .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, dur)
            .putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, artwork).build());
        session.setPlaybackState(new PlaybackStateCompat.Builder()
            .setActions(PlaybackStateCompat.ACTION_PLAY | PlaybackStateCompat.ACTION_PAUSE | PlaybackStateCompat.ACTION_PLAY_PAUSE
                | PlaybackStateCompat.ACTION_SKIP_TO_NEXT | PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS)
            .setState(playing ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED, pos, playing ? 1f : 0f).build());

        Intent open = new Intent(this, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent content = PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_IMMUTABLE);
        Notification n = new NotificationCompat.Builder(this, CHANNEL)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title).setContentText(artist)
            .setLargeIcon(artwork)
            .setContentIntent(content)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(playing)
            .addAction(android.R.drawable.ic_media_previous, "Anterior", pi("previous", 1))
            .addAction(playing ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play, playing ? "Pausar" : "Tocar", pi(playing ? "pause" : "play", 2))
            .addAction(android.R.drawable.ic_media_next, "Próxima", pi("next", 3))
            .setStyle(new androidx.media.app.NotificationCompat.MediaStyle().setMediaSession(session.getSessionToken()).setShowActionsInCompactView(0, 1, 2))
            .build();
        ServiceCompat.startForeground(this, 1, n, Build.VERSION.SDK_INT >= 29 ? ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK : 0);

        // Keep the foreground service and CPU awake while a playback session is
        // active, including the short gap between tracks. Android may suspend the
        // WebView after the ended/pause events when the screen is off; that prevents
        // the JS queue from selecting and starting the next track.
        // The service is released explicitly by MediaPlaybackPlugin.stop().
        if (!wakeLock.isHeld()) wakeLock.acquire(6 * 60 * 60 * 1000L);
        return START_NOT_STICKY;
    }

    private PendingIntent pi(String action, int code) {
        Intent i = new Intent(this, MediaPlaybackService.class).setAction(action);
        return PendingIntent.getService(this, code, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    @Override
    public void onDestroy() {
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        session.release();
        super.onDestroy();
    }

    @Override public IBinder onBind(Intent intent) { return null; }
}
