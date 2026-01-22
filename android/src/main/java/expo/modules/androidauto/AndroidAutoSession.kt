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

    override fun onCreateScreen(intent: android.content.Intent): Screen {
        val registeredScreens = AndroidAutoCarAppService.getRegisteredScreens()
        
        // Find the root screen (first registered screen or one named "root")
        val rootScreenName = registeredScreens.keys.firstOrNull { it == "root" } 
            ?: registeredScreens.keys.firstOrNull()
        
        if (rootScreenName == null) {
            // Return a default screen if no screens are registered
            return DefaultScreen(carContext, "No screens registered")
        }

        currentScreenName = rootScreenName
        screenStack.add(rootScreenName)
        AndroidAutoCarAppService.sendEventToJS("onScreenChanged", rootScreenName)
        
        return createCarScreen(rootScreenName, registeredScreens[rootScreenName]!!)
    }

    fun getCurrentScreenName(): String? = currentScreenName

    fun navigateToScreen(screenName: String, params: Map<String, Any>?) {
        val registeredScreens = AndroidAutoCarAppService.getRegisteredScreens()
        val screenConfig = registeredScreens[screenName] 
            ?: throw IllegalArgumentException("Screen '$screenName' not found")

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
        AndroidAutoCarAppService.sendEventToJS("onSessionStarted", null)
    }

    override fun onDestroy(owner: LifecycleOwner) {
        super.onDestroy(owner)
        AndroidAutoCarAppService.sendEventToJS("onSessionEnded", null)
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
        val template = screenConfig["template"] as? Map<String, Any>
            ?: return createDefaultTemplate()

        return when (template["type"] as? String) {
            "ListTemplate" -> createListTemplate(template)
            "MessageTemplate" -> createMessageTemplate(template)
            else -> createDefaultTemplate()
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
            
            items.forEach { itemConfig ->
                itemListBuilder.addItem(createRow(itemConfig))
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
        val title = rowConfig["title"] as? String ?: "Row"
        val rowBuilder = Row.Builder().setTitle(title)

        // Add texts
        val texts = rowConfig["texts"] as? List<String>
        if (texts != null && texts.isNotEmpty()) {
            texts.forEachIndexed { index, text ->
                when (index) {
                    0 -> rowBuilder.addText(text)
                    else -> rowBuilder.addText(text)
                }
            }
        }

        // Add click listener
        val hasOnPress = rowConfig["onPress"] != null
        if (hasOnPress) {
            rowBuilder.setOnClickListener {
                AndroidAutoCarAppService.sendEventToJS("onUserInteraction", mapOf(
                    "action" to "rowPress",
                    "screen" to screenName,
                    "data" to rowConfig
                ))
            }
        }

        // Metadata functionality removed for now due to API changes
        // The Place.builder API has changed in newer Car App Library versions

        return rowBuilder.build()
    }

    private fun createAction(actionConfig: Map<String, Any>): Action {
        val title = actionConfig["title"] as? String ?: "Action"
        val actionBuilder = Action.Builder().setTitle(title)

        // Add click listener
        val hasOnPress = actionConfig["onPress"] != null
        if (hasOnPress) {
            actionBuilder.setOnClickListener {
                AndroidAutoCarAppService.sendEventToJS("onUserInteraction", mapOf(
                    "action" to "actionPress",
                    "screen" to screenName,
                    "data" to actionConfig
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

