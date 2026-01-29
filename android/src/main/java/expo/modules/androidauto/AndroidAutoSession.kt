package expo.modules.androidauto

import androidx.car.app.CarContext
import androidx.car.app.Screen
import androidx.car.app.Session
import androidx.car.app.model.*
import androidx.car.app.model.Action
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner

/**
 * Android Auto Session that manages screens and templates
 */
class AndroidAutoSession : Session(), DefaultLifecycleObserver {
    private val screenStack = mutableListOf<String>()
    private var currentScreenName: String? = null

    init {
        // Register this session as a lifecycle observer to receive onCreate/onDestroy callbacks
        lifecycle.addObserver(this)
    }

    override fun onCreateScreen(intent: android.content.Intent): Screen {
        val registeredScreens = AndroidAutoCarAppService.getRegisteredScreens()
        android.util.Log.d("AndroidAuto", "[Session] onCreateScreen - registered screens: ${registeredScreens.keys}")
        
        // Find the root screen: prefer "root", then "main", then first registered
        val rootScreenName = registeredScreens.keys.firstOrNull { it == "root" } 
            ?: registeredScreens.keys.firstOrNull { it == "main" }
            ?: registeredScreens.keys.firstOrNull()
        
        if (rootScreenName == null) {
            android.util.Log.e("AndroidAuto", "No screens registered!")
            // Return a default screen if no screens are registered
            return DefaultScreen(carContext, "No screens registered")
        }

        android.util.Log.d("AndroidAuto", "[Session] Selected root screen: $rootScreenName")
        val screenConfig = registeredScreens[rootScreenName]
        currentScreenName = rootScreenName
        screenStack.add(rootScreenName)
        AndroidAutoCarAppService.sendEventToJS("onScreenChanged", rootScreenName)
        
        return try {
            createCarScreen(rootScreenName, screenConfig!!)
        } catch (e: Exception) {
            android.util.Log.e("AndroidAuto", "Error creating car screen", e)
            DefaultScreen(carContext, "Error: ${e.message}")
        }
    }

    fun getCurrentScreenName(): String? = currentScreenName

    fun refreshCurrentScreen() {
        android.util.Log.d("AndroidAuto", "[Session] Refreshing current screen")
        try {
            // Get the top screen and invalidate it to refresh
            val screenManager = carContext.getCarService(androidx.car.app.ScreenManager::class.java)
            val topScreen = screenManager.top
            if (topScreen is AndroidAutoScreen) {
                // If screens are now registered, update the screen config
                val registeredScreens = AndroidAutoCarAppService.getRegisteredScreens()
                val currentName = currentScreenName ?: "main"
                val screenConfig = registeredScreens[currentName] ?: registeredScreens["root"] ?: registeredScreens.values.firstOrNull()
                
                if (screenConfig != null) {
                    android.util.Log.d("AndroidAuto", "[Session] Updating screen with config: ${screenConfig["name"]}")
                    topScreen.updateFullConfig(screenConfig)
                }
            } else if (topScreen is DefaultScreen) {
                // Replace the default screen with a proper screen if we have one now
                val registeredScreens = AndroidAutoCarAppService.getRegisteredScreens()
                val rootScreenName = registeredScreens.keys.firstOrNull { it == "main" || it == "root" }
                    ?: registeredScreens.keys.firstOrNull()
                
                if (rootScreenName != null) {
                    val screenConfig = registeredScreens[rootScreenName]!!
                    currentScreenName = rootScreenName
                    android.util.Log.d("AndroidAuto", "[Session] Replacing default screen with: $rootScreenName, config keys: ${screenConfig.keys}")
                    
                    // Push the new screen on top (we can't easily pop the root)
                    val newScreen = createCarScreen(rootScreenName, screenConfig)
                    screenManager.push(newScreen)
                    screenStack.add(rootScreenName)
                } else {
                    android.util.Log.e("AndroidAuto", "[Session] No main/root screen found in registered screens: ${registeredScreens.keys}")
                }
            } else {
                android.util.Log.d("AndroidAuto", "[Session] Top screen is neither AndroidAutoScreen nor DefaultScreen: ${topScreen::class.java.simpleName}")
            }
        } catch (e: Exception) {
            android.util.Log.e("AndroidAuto", "[Session] Error refreshing screen", e)
        }
    }

    fun navigateToScreen(screenName: String, params: Map<String, Any>?) {
        android.util.Log.e("AndroidAuto", "Trying to navigate to screen: $screenName")
        val registeredScreens = AndroidAutoCarAppService.getRegisteredScreens()
        val screenConfig = registeredScreens[screenName]
        
        if (screenConfig == null) {
            android.util.Log.e("AndroidAuto", "Screen '$screenName' not found in registered screens")
            throw IllegalArgumentException("Screen '$screenName' not found")
        }

        currentScreenName = screenName
        screenStack.add(screenName)
        
        val screen = createCarScreen(screenName, screenConfig, params)
        carContext.getCarService(androidx.car.app.ScreenManager::class.java).push(screen)
        AndroidAutoCarAppService.sendEventToJS("onScreenChanged", screenName)
    }

    fun updateScreen(screenName: String, template: Map<String, Any>) {
        if (currentScreenName == screenName) {
            // Update the current screen template
            val currentScreen = carContext.getCarService(androidx.car.app.ScreenManager::class.java).top
            if (currentScreen is AndroidAutoScreen) {
                currentScreen.updateTemplate(template)
            }
        }
    }

    fun popScreen() {
        if (screenStack.size > 1) {
            screenStack.removeLastOrNull()
            carContext.getCarService(androidx.car.app.ScreenManager::class.java).pop()
            
            currentScreenName = screenStack.lastOrNull()
            AndroidAutoCarAppService.sendEventToJS("onScreenChanged", currentScreenName)
        }
    }

    fun popToRoot() {
        while (screenStack.size > 1) {
            screenStack.removeLastOrNull()
            carContext.getCarService(androidx.car.app.ScreenManager::class.java).pop()
        }
        
        currentScreenName = screenStack.firstOrNull()
        AndroidAutoCarAppService.sendEventToJS("onScreenChanged", currentScreenName)
    }

    fun finish() {
        carContext.finishCarApp()
    }

    private fun createCarScreen(screenName: String, screenConfig: Map<String, Any>, params: Map<String, Any>? = null): Screen {
        return AndroidAutoScreen(carContext, screenName, screenConfig, params)
    }

    override fun onCreate(owner: LifecycleOwner) {
        super.onCreate(owner)
        android.util.Log.d("AndroidAuto", "[Session] onCreate lifecycle callback")
    }

    override fun onStart(owner: LifecycleOwner) {
        super.onStart(owner)
        android.util.Log.d("AndroidAuto", "[Session] onStart - session is now active and connected")
        AndroidAutoCarAppService.setSessionActive(true)
        AndroidAutoCarAppService.sendEventToJS("onSessionStarted", null)
    }

    override fun onStop(owner: LifecycleOwner) {
        super.onStop(owner)
        android.util.Log.d("AndroidAuto", "[Session] onStop - session is disconnecting")
        AndroidAutoCarAppService.setSessionActive(false)
        AndroidAutoCarAppService.sendEventToJS("onSessionEnded", null)
    }

    override fun onDestroy(owner: LifecycleOwner) {
        super.onDestroy(owner)
        android.util.Log.d("AndroidAuto", "[Session] onDestroy - session is being destroyed")
        // Ensure we're marked as inactive
        AndroidAutoCarAppService.setSessionActive(false)
    }
}

/**
 * Individual Car Screen implementation
 */
class AndroidAutoScreen(
    carContext: CarContext,
    private val screenName: String,
    private var screenConfig: Map<String, Any>,
    private val params: Map<String, Any>? = null
) : Screen(carContext) {

    override fun onGetTemplate(): Template {
        android.util.Log.d("AndroidAuto", "onGetTemplate called for screen: $screenName")
        val template = screenConfig["template"] as? Map<String, Any>
        if (template == null) {
            android.util.Log.w("AndroidAuto", "No template found, using default")
            return createDefaultTemplate()
        }

        val templateType = template["type"] as? String
        android.util.Log.d("AndroidAuto", "Template type for screen $screenName: $templateType")
        android.util.Log.d("AndroidAuto", "Template keys: ${template.keys.joinToString()}")
        
        return try {
            when (templateType) {
                "ListTemplate" -> {
                    android.util.Log.d("AndroidAuto", "Creating ListTemplate")
                    createListTemplate(template)
                }
                "MessageTemplate" -> {
                    android.util.Log.d("AndroidAuto", "Creating MessageTemplate")
                    createMessageTemplate(template)
                }
                "PaneTemplate" -> {
                    android.util.Log.d("AndroidAuto", "Creating PaneTemplate")
                    createPaneTemplate(template)
                }
                else -> {
                    android.util.Log.w("AndroidAuto", "Unknown template type: $templateType, using default")
                    createDefaultTemplate()
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("AndroidAuto", "Error creating template for type: $templateType", e)
            e.printStackTrace()
            createDefaultTemplate()
        }
    }

    fun updateTemplate(newTemplate: Map<String, Any>) {
        screenConfig = screenConfig.toMutableMap().apply {
            put("template", newTemplate)
        }
        invalidate() // This will trigger onGetTemplate() to be called again
    }

    fun updateFullConfig(newConfig: Map<String, Any>) {
        screenConfig = newConfig
        invalidate() // This will trigger onGetTemplate() to be called again
    }

    private fun createListTemplate(templateConfig: Map<String, Any>): ListTemplate {
        val builder = ListTemplate.Builder()

        // Set title
        val title = templateConfig["title"] as? String ?: "List"
        builder.setTitle(title)

        // Set loading state
        val isLoading = templateConfig["isLoading"] as? Boolean ?: false
        builder.setLoading(isLoading)

        // Add header action if present
        val headerAction = templateConfig["headerAction"] as? Map<String, Any>
        if (headerAction != null) {
            builder.setHeaderAction(createAction(headerAction, isHeaderAction = true))
        }

        // Add action strip if present
        val actionStrip = templateConfig["actionStrip"] as? List<Map<String, Any>>
        if (actionStrip != null) {
            val actionStripBuilder = ActionStrip.Builder()
            actionStrip.forEach { actionConfig ->
                actionStripBuilder.addAction(createAction(actionConfig))
            }
            builder.setActionStrip(actionStripBuilder.build())
        }

        // Add items - simplified to use direct items array instead of itemLists
        val items = templateConfig["items"] as? List<Map<String, Any>> ?: emptyList()
        if (items.isNotEmpty()) {
            val itemListBuilder = ItemList.Builder()
            
            items.forEachIndexed { index, itemConfig ->
                try {
                    itemListBuilder.addItem(createRow(itemConfig))
                } catch (e: Exception) {
                    android.util.Log.e("AndroidAuto", "Error creating row for item $index", e)
                    e.printStackTrace()
                    throw e
                }
            }

            builder.setSingleList(itemListBuilder.build())
        }

        return builder.build()
    }

    private fun createMessageTemplate(templateConfig: Map<String, Any>): MessageTemplate {
        val builder = MessageTemplate.Builder(
            templateConfig["message"] as? String ?: "Message"
        )

        // Set title
        val title = templateConfig["title"] as? String ?: "Message"
        builder.setTitle(title)

        // Add header action if present
        val headerAction = templateConfig["headerAction"] as? Map<String, Any>
        if (headerAction != null) {
            builder.setHeaderAction(createAction(headerAction, isHeaderAction = true))
        }

        // Add action strip if present
        val actionStrip = templateConfig["actionStrip"] as? List<Map<String, Any>>
        if (actionStrip != null) {
            val actionStripBuilder = ActionStrip.Builder()
            actionStrip.forEach { actionConfig ->
                actionStripBuilder.addAction(createAction(actionConfig))
            }
            builder.setActionStrip(actionStripBuilder.build())
        }

        return builder.build()
    }

    private fun createPaneTemplate(templateConfig: Map<String, Any>): PaneTemplate {
        val paneBuilder = Pane.Builder()

        // Add rows to the pane
        val rows = templateConfig["rows"] as? List<Map<String, Any>> ?: emptyList()
        rows.forEach { rowConfig ->
            // PaneTemplate rows cannot have click listeners
            paneBuilder.addRow(createRow(rowConfig, allowClickListener = false))
        }

        // Add actions to the pane (these appear as buttons)
        val actions = templateConfig["actions"] as? List<Map<String, Any>> ?: emptyList()
        actions.forEach { actionConfig ->
            paneBuilder.addAction(createAction(actionConfig))
        }

        // Set loading state
        val isLoading = templateConfig["isLoading"] as? Boolean ?: false
        paneBuilder.setLoading(isLoading)

        val builder = PaneTemplate.Builder(paneBuilder.build())

        // Set title
        val title = templateConfig["title"] as? String ?: "Details"
        builder.setTitle(title)

        // Add header action if present
        val headerAction = templateConfig["headerAction"] as? Map<String, Any>
        if (headerAction != null) {
            builder.setHeaderAction(createAction(headerAction, isHeaderAction = true))
        }

        // Add action strip if present
        val actionStrip = templateConfig["actionStrip"] as? List<Map<String, Any>>
        if (actionStrip != null) {
            val actionStripBuilder = ActionStrip.Builder()
            actionStrip.forEach { actionConfig ->
                actionStripBuilder.addAction(createAction(actionConfig))
            }
            builder.setActionStrip(actionStripBuilder.build())
        }

        return builder.build()
    }

    private fun createRow(rowConfig: Map<String, Any>, allowClickListener: Boolean = true): Row {
        android.util.Log.d("AndroidAuto", "createRow called with keys: ${rowConfig.keys.joinToString()}, allowClickListener: $allowClickListener")
        val title = rowConfig["title"] as? String ?: "Row"
        android.util.Log.d("AndroidAuto", "Row title: $title")
        val rowBuilder = Row.Builder().setTitle(title)

        // Add texts
        val texts = rowConfig["texts"] as? List<String>
        if (texts != null && texts.isNotEmpty()) {
            android.util.Log.d("AndroidAuto", "Adding ${texts.size} text lines")
            texts.forEachIndexed { index, text ->
                when (index) {
                    0 -> rowBuilder.addText(text)
                    else -> rowBuilder.addText(text)
                }
            }
        }

        // Add click listener - only if allowed (not allowed for PaneTemplate rows)
        val itemId = rowConfig["id"] as? String
        android.util.Log.d("AndroidAuto", "Row itemId: $itemId")
        if (itemId != null && allowClickListener) {
            rowBuilder.setOnClickListener {
                android.util.Log.d("AndroidAuto", "Row clicked: $itemId on screen: $screenName")
                // Create a clean map with only serializable data
                val serializableData = mutableMapOf<String, Any>()
                rowConfig.forEach { (key, value) ->
                    // Only include primitive types and collections of primitives
                    when (value) {
                        is String, is Number, is Boolean -> serializableData[key] = value
                        is List<*> -> {
                            // Only include lists of primitives
                            val cleanList = value.filterIsInstance<String>()
                            if (cleanList.size == value.size) {
                                serializableData[key] = cleanList
                            }
                        }
                    }
                }
                // Always include id
                serializableData["id"] = itemId
                
                android.util.Log.d("AndroidAuto", "Preparing to send onUserInteraction event")
                // Flatten the event data structure for better Expo Modules compatibility
                val eventData = mutableMapOf<String, Any?>(
                    "action" to "rowPress",
                    "screen" to screenName
                )
                // Add all data fields directly to the event map (flattened)
                eventData.putAll(serializableData)
                android.util.Log.d("AndroidAuto", "Event data (flattened): $eventData")
                AndroidAutoCarAppService.sendEventToJS("onUserInteraction", eventData)
            }
        }

        android.util.Log.d("AndroidAuto", "Building row")
        return rowBuilder.build()
    }

    private fun createAction(actionConfig: Map<String, Any>, isHeaderAction: Boolean = false): Action {
        val title = actionConfig["title"] as? String ?: "Action"
        
        // For header actions, use standard actions when the title matches
        if (isHeaderAction) {
            val lowerTitle = title.lowercase()
            if (lowerTitle == "back" || lowerTitle.contains("back")) {
                return Action.BACK
            }
            if (lowerTitle == "app icon" || lowerTitle == "app_icon") {
                return Action.APP_ICON
            }
        }
        
        val actionBuilder = Action.Builder().setTitle(title)

        // Add click listener - check for id instead of onPress
        val actionId = actionConfig["id"] as? String
        if (actionId != null) {
            actionBuilder.setOnClickListener {
                // Send only serializable data (no functions)
                val serializableData = actionConfig.filterKeys { it != "onPress" }
                AndroidAutoCarAppService.sendEventToJS("onUserInteraction", mapOf(
                    "action" to "actionPress",
                    "screen" to screenName,
                    "data" to serializableData
                ))
            }
        }

        // Add icon if present
        val icon = actionConfig["icon"] as? Map<String, Any>
        if (icon != null) {
            // Handle icon creation - simplified for now
            actionBuilder.setIcon(CarIcon.ALERT)
        }

        // Add background color if present - using primary color as fallback since custom colors have API changes
        val backgroundColor = actionConfig["backgroundColor"] as? Map<String, Any>
        if (backgroundColor != null) {
            // Use CarColor.PRIMARY for now - custom color creation API has changed
            actionBuilder.setBackgroundColor(CarColor.PRIMARY)
        }

        return actionBuilder.build()
    }

    private fun createDefaultTemplate(): MessageTemplate {
        return MessageTemplate.Builder("Welcome to Android Auto")
            .setTitle("React Native Android Auto")
            .build()
    }
}

/**
 * Default screen shown when no screens are registered
 */
class DefaultScreen(carContext: CarContext, private val message: String) : Screen(carContext) {
    override fun onGetTemplate(): Template {
        return MessageTemplate.Builder(message)
            .setTitle("Android Auto")
            .build()
    }
}

