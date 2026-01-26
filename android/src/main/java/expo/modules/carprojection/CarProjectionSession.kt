package expo.modules.carprojection

import androidx.car.app.CarContext
import androidx.car.app.Screen
import androidx.car.app.Session
import androidx.car.app.model.*
import androidx.car.app.model.Action
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner

/**
 * Car Projection Session that manages screens and templates for Android Auto
 */
class CarProjectionSession : Session(), DefaultLifecycleObserver {
    private val screenStack = mutableListOf<String>()
    private var currentScreenName: String? = null

    override fun onCreateScreen(intent: android.content.Intent): Screen {
        val registeredScreens = CarProjectionCarAppService.getRegisteredScreens()
        
        // Find the root screen (first registered screen or one named "root")
        val rootScreenName = registeredScreens.keys.firstOrNull { it == "root" } 
            ?: registeredScreens.keys.firstOrNull()
        
        if (rootScreenName == null) {
            android.util.Log.e("AndroidAuto", "No screens registered!")
            // Return a default screen if no screens are registered
            return DefaultScreen(carContext, "No screens registered")
        }

        val screenConfig = registeredScreens[rootScreenName]
        currentScreenName = rootScreenName
        screenStack.add(rootScreenName)
        CarProjectionCarAppService.sendEventToJS("onScreenChanged", rootScreenName)
        
        return try {
            createCarScreen(rootScreenName, screenConfig!!)
        } catch (e: Exception) {
            android.util.Log.e("AndroidAuto", "Error creating car screen", e)
            DefaultScreen(carContext, "Error: ${e.message}")
        }
    }

    fun getCurrentScreenName(): String? = currentScreenName

    fun navigateToScreen(screenName: String, params: Map<String, Any>?) {
        val registeredScreens = CarProjectionCarAppService.getRegisteredScreens()
        val screenConfig = registeredScreens[screenName]
        
        if (screenConfig == null) {
            android.util.Log.e("AndroidAuto", "Screen '$screenName' not found in registered screens")
            throw IllegalArgumentException("Screen '$screenName' not found")
        }

        currentScreenName = screenName
        screenStack.add(screenName)
        
        val screen = createCarScreen(screenName, screenConfig, params)
        carContext.getCarService(androidx.car.app.ScreenManager::class.java).push(screen)
        CarProjectionCarAppService.sendEventToJS("onScreenChanged", screenName)
    }

    fun updateScreen(screenName: String, template: Map<String, Any>) {
        if (currentScreenName == screenName) {
            // Update the current screen template
            val currentScreen = carContext.getCarService(androidx.car.app.ScreenManager::class.java).top
            if (currentScreen is CarProjectionScreen) {
                currentScreen.updateTemplate(template)
            }
        }
    }

    fun popScreen() {
        if (screenStack.size > 1) {
            screenStack.removeLastOrNull()
            carContext.getCarService(androidx.car.app.ScreenManager::class.java).pop()
            
            currentScreenName = screenStack.lastOrNull()
            CarProjectionCarAppService.sendEventToJS("onScreenChanged", currentScreenName)
        }
    }

    fun popToRoot() {
        while (screenStack.size > 1) {
            screenStack.removeLastOrNull()
            carContext.getCarService(androidx.car.app.ScreenManager::class.java).pop()
        }
        
        currentScreenName = screenStack.firstOrNull()
        CarProjectionCarAppService.sendEventToJS("onScreenChanged", currentScreenName)
    }

    fun finish() {
        carContext.finishCarApp()
    }

    private fun createCarScreen(screenName: String, screenConfig: Map<String, Any>, params: Map<String, Any>? = null): Screen {
        return CarProjectionScreen(carContext, screenName, screenConfig, params)
    }

    override fun onCreate(owner: LifecycleOwner) {
        super.onCreate(owner)
        CarProjectionCarAppService.sendEventToJS("onSessionStarted", null)
    }

    override fun onDestroy(owner: LifecycleOwner) {
        super.onDestroy(owner)
        CarProjectionCarAppService.sendEventToJS("onSessionEnded", null)
    }
}

/**
 * Individual Car Screen implementation
 */
class CarProjectionScreen(
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

        return try {
            when (template["type"] as? String) {
                "ListTemplate" -> createListTemplate(template)
                "MessageTemplate" -> createMessageTemplate(template)
                else -> {
                    android.util.Log.w("AndroidAuto", "Unknown template type: ${template["type"]}, using default")
                    createDefaultTemplate()
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("AndroidAuto", "Error creating template", e)
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
            builder.setHeaderAction(createAction(headerAction))
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
            builder.setHeaderAction(createAction(headerAction))
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

    private fun createRow(rowConfig: Map<String, Any>): Row {
        android.util.Log.d("AndroidAuto", "createRow called with keys: ${rowConfig.keys.joinToString()}")
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

        // Add click listener - check for id instead of onPress
        val itemId = rowConfig["id"] as? String
        android.util.Log.d("AndroidAuto", "Row itemId: $itemId")
        if (itemId != null) {
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
                val eventData = mapOf(
                    "action" to "rowPress",
                    "screen" to screenName,
                    "data" to serializableData
                )
                android.util.Log.d("AndroidAuto", "Event data: $eventData")
                CarProjectionCarAppService.sendEventToJS("onUserInteraction", eventData)
            }
        }

        android.util.Log.d("AndroidAuto", "Building row")
        return rowBuilder.build()
    }

    private fun createAction(actionConfig: Map<String, Any>): Action {
        val title = actionConfig["title"] as? String ?: "Action"
        val actionBuilder = Action.Builder().setTitle(title)

        // Add click listener - check for id instead of onPress
        val actionId = actionConfig["id"] as? String
        if (actionId != null) {
            actionBuilder.setOnClickListener {
                // Send only serializable data (no functions)
                val serializableData = actionConfig.filterKeys { it != "onPress" }
                CarProjectionCarAppService.sendEventToJS("onUserInteraction", mapOf(
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

