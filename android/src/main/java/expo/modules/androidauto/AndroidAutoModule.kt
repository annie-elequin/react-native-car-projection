package expo.modules.androidauto

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import android.os.Handler
import android.os.Looper
import androidx.core.os.bundleOf
import org.json.JSONObject
import org.json.JSONArray

/**
 * Main Expo module for Android Auto integration
 */
class AndroidAutoModule : Module() {
  
  // Helper function to parse JSON string to Map
  private fun parseJsonToMap(jsonString: String): Map<String, Any> {
    val jsonObject = JSONObject(jsonString)
    return jsonObjectToMap(jsonObject)
  }
  
  private fun jsonObjectToMap(jsonObject: JSONObject): Map<String, Any> {
    val map = mutableMapOf<String, Any>()
    val keys = jsonObject.keys()
    while (keys.hasNext()) {
      val key = keys.next()
      val value = jsonObject.get(key)
      map[key] = convertJsonValue(value)
    }
    return map
  }
  
  private fun jsonArrayToList(jsonArray: JSONArray): List<Any> {
    val list = mutableListOf<Any>()
    for (i in 0 until jsonArray.length()) {
      list.add(convertJsonValue(jsonArray.get(i)))
    }
    return list
  }
  
  private fun convertJsonValue(value: Any): Any {
    return when (value) {
      is JSONObject -> jsonObjectToMap(value)
      is JSONArray -> jsonArrayToList(value)
      JSONObject.NULL -> "" // Convert null to empty string
      else -> value
    }
  }
  
  // Public method to send events from outside the Module class
  // This ensures we use the Module's own sendEvent method
  fun sendEventToJS(eventName: String, data: Any?) {
    // Convert data to appropriate format for sendEvent
    // Expo Modules sendEvent accepts Map<String, Any?> or Bundle? on Android
    // We need to handle both cases and call the appropriate overload
    android.util.Log.d("AndroidAuto", "[Module] Sending event '$eventName' from Module class")
    android.util.Log.d("AndroidAuto", "[Module] Input data: $data")
    android.util.Log.d("AndroidAuto", "[Module] Input data type: ${data?.javaClass?.simpleName ?: "null"}")
    android.util.Log.d("AndroidAuto", "[Module] Current thread: ${Thread.currentThread().name}")
    android.util.Log.d("AndroidAuto", "[Module] Is main thread: ${Looper.getMainLooper().thread == Thread.currentThread()}")
    android.util.Log.d("AndroidAuto", "[Module] appContext: ${appContext}")
    android.util.Log.d("AndroidAuto", "[Module] reactContext: ${appContext.reactContext}")
    android.util.Log.d("AndroidAuto", "[Module] hasActiveReactInstance: ${appContext.hasActiveReactInstance}")
    
    // Always post to main thread to ensure React Native bridge is ready
    // Even if we're already on main thread, posting ensures proper event delivery
    val handler = Handler(Looper.getMainLooper())
    handler.post {
      try {
        android.util.Log.d("AndroidAuto", "[Module] Posting via Handler to main thread")
        android.util.Log.d("AndroidAuto", "[Module] About to call sendEvent with: $eventName")
        android.util.Log.d("AndroidAuto", "[Module] Module instance: $this@AndroidAutoModule")
        
        // Handle different data types and call appropriate sendEvent overload
        when (data) {
          is android.os.Bundle -> {
            android.util.Log.d("AndroidAuto", "[Module] Sending Bundle")
            this@AndroidAutoModule.sendEvent(eventName, data)
          }
          is Map<*, *> -> {
            @Suppress("UNCHECKED_CAST")
            val mapData = data as Map<String, Any?>
            android.util.Log.d("AndroidAuto", "[Module] Sending Map: $mapData")
            this@AndroidAutoModule.sendEvent(eventName, mapData)
          }
          is String -> {
            val mapData = mapOf("value" to data)
            android.util.Log.d("AndroidAuto", "[Module] Sending String as Map: $mapData")
            this@AndroidAutoModule.sendEvent(eventName, mapData)
          }
          null -> {
            android.util.Log.d("AndroidAuto", "[Module] Sending null as empty Map")
            this@AndroidAutoModule.sendEvent(eventName, emptyMap<String, Any?>())
          }
          else -> {
            val mapData = mapOf("value" to data)
            android.util.Log.d("AndroidAuto", "[Module] Sending other type as Map: $mapData")
            this@AndroidAutoModule.sendEvent(eventName, mapData)
          }
        }
        
        android.util.Log.d("AndroidAuto", "[Module] ✓ sendEvent call completed for '$eventName'")
      } catch (e: Exception) {
        android.util.Log.e("AndroidAuto", "[Module] ✗ Error in sendEvent: ${e.message}", e)
        e.printStackTrace()
      }
    }
  }
  
  override fun definition() = ModuleDefinition {
    Name("AndroidAuto")

    // Define events that can be sent to JavaScript
    Events("onSessionStarted", "onSessionEnded", "onScreenChanged", "onUserInteraction", "onTestEvent", "onMediaBrowserConnected", "onMediaPlay", "onMediaPause", "onMediaStop", "onMediaSkipToNext", "onMediaSkipToPrevious", "onMediaSeekTo", "onMediaPlayFromId")

    // Initialize the module
    OnCreate {
      android.util.Log.d("AndroidAuto", "[Module] OnCreate called - setting module instance")
      android.util.Log.d("AndroidAuto", "[Module] Module instance: $this")
      AndroidAutoCarAppService.setModuleInstance(this@AndroidAutoModule)

      this@AndroidAutoModule.sendEvent("onTestEvent", bundleOf("value" to "Test from OnCreate"))

      // Test sending an event immediately to see if it works
      android.util.Log.d("AndroidAuto", "[Module] Testing event send from OnCreate...")
      try {
        val handler = Handler(Looper.getMainLooper())
        handler.postDelayed({
          android.util.Log.d("AndroidAuto", "[Module] Sending test event from OnCreate")
          this@AndroidAutoModule.sendEvent("onTestEvent", mapOf("value" to "Test from OnCreate"))
          android.util.Log.d("AndroidAuto", "[Module] Test event sent from OnCreate")
        }, 3000)
      } catch (e: Exception) {
        android.util.Log.e("AndroidAuto", "[Module] Error in OnCreate test: ${e.message}", e)
      }
    }

    // Register a screen with template
    // Accept JSON string to avoid Expo type conversion issues with nested objects
    AsyncFunction("registerScreen") { screenConfigJson: String, promise: Promise ->
      try {
        val screenConfig = parseJsonToMap(screenConfigJson)
        AndroidAutoCarAppService.registerScreen(screenConfig)
        promise.resolve(null)
      } catch (e: Exception) {
        android.util.Log.e("AndroidAuto", "[Module] registerScreen error: ${e.message}", e)
        promise.reject("REGISTER_SCREEN_ERROR", "Failed to register screen: ${e.message}", e)
      }
    }

    // Start Android Auto session
    AsyncFunction("startSession") { promise: Promise ->
      try {
        // The session starts automatically when connected to Android Auto
        // This method can be used to initialize or prepare the service
        AndroidAutoCarAppService.initialize()
        promise.resolve(null)
      } catch (e: Exception) {
        promise.reject("START_SESSION_ERROR", "Failed to start session: ${e.message}", e)
      }
    }

    // Navigate to a specific screen - must run on main thread for ScreenManager
    AsyncFunction("navigateToScreen") { screenName: String, params: Map<String, Any>?, promise: Promise ->
      val mainHandler = Handler(Looper.getMainLooper())
      mainHandler.post {
        try {
          AndroidAutoCarAppService.navigateToScreen(screenName, params)
          promise.resolve(null)
        } catch (e: Exception) {
          promise.reject("NAVIGATE_ERROR", "Failed to navigate to screen: ${e.message}", e)
        }
      }
    }

    // Update a screen's template
    AsyncFunction("updateScreen") { screenName: String, template: Map<String, Any>, promise: Promise ->
      try {
        AndroidAutoCarAppService.updateScreen(screenName, template)
        promise.resolve(null)
      } catch (e: Exception) {
        promise.reject("UPDATE_SCREEN_ERROR", "Failed to update screen: ${e.message}", e)
      }
    }

    // Get current screen name
    AsyncFunction("getCurrentScreen") { promise: Promise ->
      try {
        val currentScreen = AndroidAutoCarAppService.getCurrentScreen()
        promise.resolve(currentScreen)
      } catch (e: Exception) {
        promise.reject("GET_CURRENT_SCREEN_ERROR", "Failed to get current screen: ${e.message}", e)
      }
    }

    // Check if Android Auto is connected
    AsyncFunction("isConnected") { promise: Promise ->
      try {
        val isConnected = AndroidAutoCarAppService.isConnected()
        promise.resolve(isConnected)
      } catch (e: Exception) {
        promise.reject("IS_CONNECTED_ERROR", "Failed to check connection status: ${e.message}", e)
      }
    }

    // Finish the session
    AsyncFunction("finishSession") { promise: Promise ->
      try {
        AndroidAutoCarAppService.finishSession()
        promise.resolve(null)
      } catch (e: Exception) {
        promise.reject("FINISH_SESSION_ERROR", "Failed to finish session: ${e.message}", e)
      }
    }

    // Pop back one screen - must run on main thread for ScreenManager
    AsyncFunction("popScreen") { promise: Promise ->
      val mainHandler = Handler(Looper.getMainLooper())
      mainHandler.post {
        try {
          AndroidAutoCarAppService.popScreen()
          promise.resolve(null)
        } catch (e: Exception) {
          promise.reject("POP_SCREEN_ERROR", "Failed to pop screen: ${e.message}", e)
        }
      }
    }

    // Pop to root screen - must run on main thread for ScreenManager
    AsyncFunction("popToRoot") { promise: Promise ->
      val mainHandler = Handler(Looper.getMainLooper())
      mainHandler.post {
        try {
          AndroidAutoCarAppService.popToRoot()
          promise.resolve(null)
        } catch (e: Exception) {
          promise.reject("POP_TO_ROOT_ERROR", "Failed to pop to root: ${e.message}", e)
        }
      }
    }

    // Send a simple test event (just a string) to verify event mechanism works
    // Use the same approach as onScreenChanged (which works) - use sendEventToJS
    // SIMPLEST TEST - exactly like onScreenChanged
    // onScreenChanged does: AndroidAutoCarAppService.sendEventToJS("onScreenChanged", rootScreenName)
    AsyncFunction("sendTestEvent") { message: String, promise: Promise ->
      try {
        android.util.Log.d("AndroidAuto", "[TEST] Sending: $message");
        AndroidAutoCarAppService.sendEventToJS("onTestEvent", message)
        android.util.Log.d("AndroidAuto", "[TEST] sendEventToJS called");
        promise.resolve(null)
      } catch (e: Exception) {
        android.util.Log.e("AndroidAuto", "[TEST] Error: ${e.message}", e)
        promise.reject("SEND_TEST_EVENT_ERROR", "Failed: ${e.message}", e)
      }
    }

    // Configure the MediaBrowserService to use an external media session (e.g., track-player).
    // Call this at app startup so Android Auto can route audio when it connects.
    // If packageName is blank, uses the app's own package.
    AsyncFunction("configureMediaSession") { packageName: String, serviceName: String, promise: Promise ->
      try {
        val pkg = if (packageName.isBlank()) appContext.reactContext?.packageName ?: "" else packageName
        AndroidAutoMediaBrowserService.configure(pkg, serviceName)
        promise.resolve(null)
      } catch (e: Exception) {
        android.util.Log.e("AndroidAuto", "[Module] configureMediaSession error: ${e.message}", e)
        promise.reject("CONFIGURE_MEDIA_SESSION_ERROR", "Failed to configure media session: ${e.message}", e)
      }
    }

    // Update MediaBrowserService MediaSession playback state and metadata so Android Auto
    // sees our app as the active media source and routes audio. Call when TrackPlayer state/track changes.
    AsyncFunction("updateMediaPlaybackState") { stateStr: String, positionSeconds: Double, durationSeconds: Double, title: String?, artist: String?, promise: Promise ->
      try {
        val state = when (stateStr.lowercase()) {
          "playing" -> android.support.v4.media.session.PlaybackStateCompat.STATE_PLAYING
          "paused" -> android.support.v4.media.session.PlaybackStateCompat.STATE_PAUSED
          "stopped", "none" -> android.support.v4.media.session.PlaybackStateCompat.STATE_STOPPED
          "buffering" -> android.support.v4.media.session.PlaybackStateCompat.STATE_BUFFERING
          "error" -> android.support.v4.media.session.PlaybackStateCompat.STATE_ERROR
          else -> android.support.v4.media.session.PlaybackStateCompat.STATE_NONE
        }
        val positionMs = (positionSeconds * 1000).toLong()
        val durationMs = (durationSeconds * 1000).toLong()
        AndroidAutoMediaBrowserService.updatePlaybackState(state, positionMs, durationMs, title ?: "", artist ?: "")
        promise.resolve(null)
      } catch (e: Exception) {
        android.util.Log.e("AndroidAuto", "[Module] updateMediaPlaybackState error: ${e.message}", e)
        promise.reject("UPDATE_MEDIA_PLAYBACK_STATE_ERROR", e.message, e)
      }
    }

    // Set the MediaBrowser browse tree so Android Auto can show available items (playlists, tracks).
    // JSON shape: { "__ROOT__": [ { "id", "title", "playable", "browsable", ... }, ... ], "parentId": [ ... ], ... }
    AsyncFunction("setMediaBrowseTree") { json: String, promise: Promise ->
      try {
        val tree = parseJsonToMap(json)
        AndroidAutoMediaBrowserService.setBrowseTree(tree)
        promise.resolve(null)
      } catch (e: Exception) {
        android.util.Log.e("AndroidAuto", "[Module] setMediaBrowseTree error: ${e.message}", e)
        promise.reject("SET_MEDIA_BROWSE_TREE_ERROR", "Failed to set media browse tree: ${e.message}", e)
      }
    }

  }
}
