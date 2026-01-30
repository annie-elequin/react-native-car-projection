package expo.modules.androidauto

import android.os.Bundle
import android.util.Log
import androidx.media.MediaBrowserServiceCompat
import android.support.v4.media.MediaBrowserCompat
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * MediaBrowserService that enables Android Auto to discover and connect to the app
 * for media playback. When Android Auto connects, audio can route to the car automatically.
 *
 * This service creates its own MediaSessionCompat and forwards media commands (play, pause, etc.)
 * to JavaScript via AndroidAutoCarAppService.sendEventToJS(). The app should handle these
 * events and control the actual media player (e.g., react-native-track-player).
 *
 * Configure the target media session package/service via configure() for documentation
 * or future sync with an external player.
 */
class AndroidAutoMediaBrowserService : MediaBrowserServiceCompat() {

    private var mediaSession: MediaSessionCompat? = null

    companion object {
        private const val TAG = "AndroidAuto"
        private const val DEBUG_LOG_FILE = "androidauto_mediabrowser_debug.log"

        private var mediaSessionPackage: String? = null
        private var mediaSessionService: String? = null

        @Volatile
        private var currentSession: MediaSessionCompat? = null

        private fun logToFile(context: android.content.Context, message: String) {
            try {
                val dir = context.getExternalFilesDir(null) ?: context.filesDir
                val file = File(dir, DEBUG_LOG_FILE)
                val ts = SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS", Locale.US).format(Date())
                file.appendText("$ts $message\n")
            } catch (_: Exception) { }
        }

        /**
         * Configure which package/service hosts the actual MediaSession (e.g., track-player).
         * Stored for reference; this service uses its own session and forwards commands to JS.
         */
        fun configure(packageName: String, serviceName: String) {
            mediaSessionPackage = packageName
            mediaSessionService = serviceName
            Log.d(TAG, "[MediaBrowserService] Configured: $packageName / $serviceName")
        }

        /**
         * Update playback state and metadata so Android Auto sees our app as the active media source.
         * Call from JS when TrackPlayer state or track changes.
         */
        fun updatePlaybackState(
            state: Int,
            positionMs: Long,
            durationMs: Long,
            title: String?,
            artist: String?
        ) {
            val session = currentSession ?: return
            val playbackState = PlaybackStateCompat.Builder()
                .setState(state, positionMs, 1f)
                .setActions(
                    PlaybackStateCompat.ACTION_PLAY or
                        PlaybackStateCompat.ACTION_PAUSE or
                        PlaybackStateCompat.ACTION_STOP or
                        PlaybackStateCompat.ACTION_SEEK_TO or
                        PlaybackStateCompat.ACTION_SKIP_TO_NEXT or
                        PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
                )
                .build()
            session.setPlaybackState(playbackState)
            val metadataBuilder = MediaMetadataCompat.Builder()
            if (!title.isNullOrBlank()) metadataBuilder.putString(MediaMetadataCompat.METADATA_KEY_TITLE, title)
            if (!artist.isNullOrBlank()) metadataBuilder.putString(MediaMetadataCompat.METADATA_KEY_ARTIST, artist)
            if (durationMs > 0) metadataBuilder.putLong(MediaMetadataCompat.METADATA_KEY_DURATION, durationMs)
            session.setMetadata(metadataBuilder.build())
        }
    }

    override fun onCreate() {
        super.onCreate()
        Log.i(TAG, "[MediaBrowserService] onCreate - service starting")
        logToFile(this, "[MediaBrowserService] onCreate - service starting")

        val session = MediaSessionCompat(this, TAG).apply {
            setFlags(
                MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS or
                    MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS
            )
            setCallback(MediaSessionCallback())
            setPlaybackState(
                PlaybackStateCompat.Builder()
                    .setState(PlaybackStateCompat.STATE_NONE, 0L, 1f)
                    .build()
            )
            isActive = true
        }
        mediaSession = session
        currentSession = session

        sessionToken = session.sessionToken
        Log.d(TAG, "[MediaBrowserService] onCreate - session token set")
    }

    override fun onGetRoot(
        clientPackageName: String,
        clientUid: Int,
        rootHints: Bundle?
    ): BrowserRoot? {
        val msg = "[MediaBrowserService] onGetRoot - Android Auto connected from $clientPackageName (uid=$clientUid)"
        Log.w(TAG, msg)
        logToFile(this, msg)
        AndroidAutoCarAppService.sendEventToJS("onMediaBrowserConnected", null)
        return BrowserRoot("__ROOT__", null)
    }

    override fun onLoadChildren(
        parentId: String,
        result: MediaBrowserServiceCompat.Result<MutableList<MediaBrowserCompat.MediaItem>>
    ) {
        Log.d(TAG, "[MediaBrowserService] onLoadChildren parentId=$parentId")
        result.sendResult(mutableListOf())
    }

    override fun onDestroy() {
        super.onDestroy()
        currentSession = null
        mediaSession?.release()
        mediaSession = null
    }

    private inner class MediaSessionCallback : MediaSessionCompat.Callback() {
        override fun onPlay() {
            Log.d(TAG, "[MediaBrowserService] onPlay - forwarding to JS")
            AndroidAutoCarAppService.sendEventToJS("onMediaPlay", null)
        }

        override fun onPause() {
            Log.d(TAG, "[MediaBrowserService] onPause - forwarding to JS")
            AndroidAutoCarAppService.sendEventToJS("onMediaPause", null)
        }

        override fun onStop() {
            Log.d(TAG, "[MediaBrowserService] onStop - forwarding to JS")
            AndroidAutoCarAppService.sendEventToJS("onMediaStop", null)
        }

        override fun onSkipToNext() {
            Log.d(TAG, "[MediaBrowserService] onSkipToNext - forwarding to JS")
            AndroidAutoCarAppService.sendEventToJS("onMediaSkipToNext", null)
        }

        override fun onSkipToPrevious() {
            Log.d(TAG, "[MediaBrowserService] onSkipToPrevious - forwarding to JS")
            AndroidAutoCarAppService.sendEventToJS("onMediaSkipToPrevious", null)
        }

        override fun onSeekTo(pos: Long) {
            Log.d(TAG, "[MediaBrowserService] onSeekTo $pos - forwarding to JS")
            AndroidAutoCarAppService.sendEventToJS("onMediaSeekTo", mapOf("position" to pos))
        }
    }
}
