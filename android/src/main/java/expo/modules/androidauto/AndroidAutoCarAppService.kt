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
            android.util.Log.d("AndroidAuto", "registerScreen called")
            val name = screenConfig["name"] as? String 
                ?: throw IllegalArgumentException("Screen name is required")
            android.util.Log.d("AndroidAuto", "Registering screen: $name")
            
            // Log template type
            val template = screenConfig["template"] as? Map<String, Any>
            if (template != null) {
                android.util.Log.d("AndroidAuto", "Template type: ${template["type"]}")
                val items = template["items"] as? List<*>
                android.util.Log.d("AndroidAuto", "Items count: ${items?.size ?: 0}")
            }
            
            registeredScreens[name] = screenConfig
            android.util.Log.d("AndroidAuto", "Screen registered successfully. Total screens: ${registeredScreens.size}")
        }

        fun getRegisteredScreens(): Map<String, Map<String, Any>> = registeredScreens

        fun navigateToScreen(screenName: String, params: Map<String, Any>? = null) {
            currentSession?.navigateToScreen(screenName, params)
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
                moduleInstance?.sendEvent(eventName, mapOf("data" to data))
            } catch (e: Exception) {
                // Log error but don't crash
                android.util.Log.e("AndroidAutoCarAppService", "Failed to send event to JS: ${e.message}")
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

