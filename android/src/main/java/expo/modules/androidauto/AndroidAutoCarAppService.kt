package expo.modules.androidauto

import androidx.car.app.CarAppService
import androidx.car.app.Session
import androidx.car.app.validation.HostValidator
import android.content.Intent

/**
 * Android Auto Car App Service - entry point for Android Auto
 */
class AndroidAutoCarAppService : CarAppService() {
    
    companion object {
        private val registeredScreens = mutableMapOf<String, Map<String, Any>>()
        private var currentSession: AndroidAutoSession? = null
        private var moduleInstance: AndroidAutoModule? = null
        private var isSessionActive = false

        fun initialize() {
            // Initialize the service if needed
        }

        fun registerScreen(screenConfig: Map<String, Any>) {
            val name = screenConfig["name"] as? String 
                ?: throw IllegalArgumentException("Screen name is required")
            val isFirstMainScreen = (name == "main" || name == "root") && !registeredScreens.containsKey("main") && !registeredScreens.containsKey("root")
            registeredScreens[name] = screenConfig
            android.util.Log.d("AndroidAuto", "[Service] Registered screen: $name, total screens: ${registeredScreens.size}, isFirstMainScreen: $isFirstMainScreen")
            
            // If this is the first main/root screen and we have an active session, refresh to replace DefaultScreen
            if (isFirstMainScreen && currentSession != null && isSessionActive) {
                android.util.Log.d("AndroidAuto", "[Service] First main screen registered with active session, refreshing display")
                // Use a handler to ensure this runs on the main thread
                android.os.Handler(android.os.Looper.getMainLooper()).post {
                    currentSession?.refreshCurrentScreen()
                }
            }
        }

        fun getRegisteredScreens(): Map<String, Map<String, Any>> = registeredScreens

        fun navigateToScreen(screenName: String, params: Map<String, Any>? = null) {
            currentSession?.navigateToScreen(screenName, params)
                ?: android.util.Log.e("AndroidAuto", "Cannot navigate: no active session")
        }

        fun updateScreen(screenName: String, template: Map<String, Any>) {
            currentSession?.updateScreen(screenName, template)
        }

        fun getCurrentScreen(): String? {
            return currentSession?.getCurrentScreenName()
        }

        fun isConnected(): Boolean {
            return isSessionActive
        }

        fun finishSession() {
            currentSession?.finish()
        }

        fun popScreen() {
            currentSession?.popScreen()
        }

        fun popToRoot() {
            currentSession?.popToRoot()
        }

        fun sendEventToJS(eventName: String, data: Any?) {
            try {
                if (moduleInstance == null) {
                    android.util.Log.e("AndroidAuto", "Cannot send event '$eventName': moduleInstance is null")
                    return
                }
                
                android.util.Log.d("AndroidAuto", "[Service] Calling Module.sendEventToJS for '$eventName'")
                // Call the Module's own method to send events (ensures we use Module's sendEvent)
                moduleInstance?.sendEventToJS(eventName, data)
                android.util.Log.d("AndroidAuto", "[Service] Module.sendEventToJS call completed")
            } catch (e: Exception) {
                android.util.Log.e("AndroidAutoCarAppService", "Failed to send event to JS: ${e.message}", e)
                e.printStackTrace()
            }
        }

        fun setModuleInstance(module: AndroidAutoModule) {
            moduleInstance = module
        }

        fun setCurrentSession(session: AndroidAutoSession?) {
            currentSession = session
        }

        fun setSessionActive(active: Boolean) {
            isSessionActive = active
        }
    }

    override fun createHostValidator(): HostValidator {
        return if (applicationInfo.flags and android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE != 0) {
            HostValidator.ALLOW_ALL_HOSTS_VALIDATOR
        } else {
            HostValidator.Builder(applicationContext)
                .addAllowedHosts(androidx.car.app.R.array.hosts_allowlist_sample)
                .build()
        }
    }

    override fun onCreateSession(): Session {
        android.util.Log.d("AndroidAuto", "[Service] onCreateSession called")
        val session = AndroidAutoSession()
        setCurrentSession(session)
        // Don't set active here - let the session's lifecycle observer handle it
        // This ensures isConnected() only returns true when the session is fully ready
        return session
    }

    // onNewIntent is not available in current CarAppService API

    override fun onDestroy() {
        super.onDestroy()
        setCurrentSession(null)
        setSessionActive(false)
    }
}

