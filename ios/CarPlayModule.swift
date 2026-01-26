import ExpoModulesCore
import CarPlay

/**
 * Main Expo module for CarPlay integration
 */
public class CarPlayModule: Module {
  public func definition() -> ModuleDefinition {
    Name("CarPlay")

    // Define events that can be sent to JavaScript
    Events("onSessionStarted", "onSessionEnded", "onScreenChanged", "onUserInteraction")

    // Initialize the module
    OnCreate {
      CarPlaySession.shared.setModuleInstance(self)
    }

    // Register a screen with template
    AsyncFunction("registerScreen") { (screenConfig: [String: Any]) -> Void in
      try CarPlaySession.shared.registerScreen(screenConfig: screenConfig)
    }

    // Start CarPlay session
    AsyncFunction("startSession") { () -> Void in
      CarPlaySession.shared.initialize()
    }

    // Navigate to a specific screen
    AsyncFunction("navigateToScreen") { (screenName: String, params: [String: Any]?) -> Void in
      try CarPlaySession.shared.navigateToScreen(screenName: screenName, params: params)
    }

    // Update a screen's template
    AsyncFunction("updateScreen") { (screenName: String, template: [String: Any]) -> Void in
      try CarPlaySession.shared.updateScreen(screenName: screenName, template: template)
    }

    // Get current screen name
    AsyncFunction("getCurrentScreen") { () -> String? in
      return CarPlaySession.shared.getCurrentScreenName()
    }

    // Check if CarPlay is connected
    AsyncFunction("isConnected") { () -> Bool in
      return CarPlaySession.shared.isConnected()
    }

    // Finish the session
    AsyncFunction("finishSession") { () -> Void in
      CarPlaySession.shared.finishSession()
    }

    // Pop back one screen
    AsyncFunction("popScreen") { () -> Void in
      CarPlaySession.shared.popScreen()
    }

    // Pop to root screen
    AsyncFunction("popToRoot") { () -> Void in
      CarPlaySession.shared.popToRoot()
    }
  }
}
