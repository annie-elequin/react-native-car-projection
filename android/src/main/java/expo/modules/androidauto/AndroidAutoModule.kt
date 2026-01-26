package expo.modules.androidauto

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import android.os.Handler
import android.os.Looper

/**
 * Main Expo module for Android Auto integration
 */
class AndroidAutoModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AndroidAuto")

    // Define events that can be sent to JavaScript
    Events("onSessionStarted", "onSessionEnded", "onScreenChanged", "onUserInteraction")

    // Initialize the module
    OnCreate {
      AndroidAutoCarAppService.setModuleInstance(this@AndroidAutoModule)
    }

    // Register a screen with template
    AsyncFunction("registerScreen") { screenConfig: Map<String, Any>, promise: Promise ->
      try {
        AndroidAutoCarAppService.registerScreen(screenConfig)
        promise.resolve(null)
      } catch (e: Exception) {
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
  }
}

