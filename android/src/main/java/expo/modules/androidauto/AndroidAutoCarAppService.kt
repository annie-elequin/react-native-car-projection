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
            registeredScreens[name] = screenConfig
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
        val session = AndroidAutoSession()
        setCurrentSession(session)
        setSessionActive(true)
        
        return session
    }

    // onNewIntent is not available in current CarAppService API

    override fun onDestroy() {
        super.onDestroy()
        setCurrentSession(null)
        setSessionActive(false)
    }
}

