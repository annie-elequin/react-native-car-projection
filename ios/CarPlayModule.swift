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
      print("[CarPlay] CarPlayModule OnCreate called")
      CarPlaySession.shared.setModuleInstance(self)
      print("[CarPlay] Module instance set on CarPlaySession")
    }

    // Register a screen with template
    AsyncFunction("registerScreen") { (screenConfig: [String: Any]) -> Void in
      print("[CarPlay] registerScreen function called from JS")
      do {
        try CarPlaySession.shared.registerScreen(screenConfig: screenConfig)
        print("[CarPlay] registerScreen completed successfully")
      } catch {
        print("[CarPlay] registerScreen error: \(error)")
        throw error
      }
    }

    // Start CarPlay session
    AsyncFunction("startSession") { () -> Void in
      print("[CarPlay] startSession function called from JS")
      CarPlaySession.shared.initialize()
      print("[CarPlay] startSession completed")
    }

    // Navigate to a specific screen
    AsyncFunction("navigateToScreen") { (screenName: String, params: [String: Any]?) -> Void in
      print("[CarPlay] navigateToScreen function called from JS: screenName=\(screenName), params=\(params ?? [:])")
      do {
        try CarPlaySession.shared.navigateToScreen(screenName: screenName, params: params)
        print("[CarPlay] navigateToScreen completed successfully")
      } catch {
        print("[CarPlay] navigateToScreen error: \(error)")
        throw error
      }
    }

    // Update a screen's template
    AsyncFunction("updateScreen") { (screenName: String, template: [String: Any]) -> Void in
      print("[CarPlay] updateScreen function called from JS: screenName=\(screenName)")
      do {
        try CarPlaySession.shared.updateScreen(screenName: screenName, template: template)
        print("[CarPlay] updateScreen completed successfully")
      } catch {
        print("[CarPlay] updateScreen error: \(error)")
        throw error
      }
    }

    // Get current screen name
    AsyncFunction("getCurrentScreen") { () -> String? in
      print("[CarPlay] getCurrentScreen function called from JS")
      let screenName = CarPlaySession.shared.getCurrentScreenName()
      print("[CarPlay] getCurrentScreen result: \(screenName ?? "nil")")
      return screenName
    }

    // Check if CarPlay is connected
    AsyncFunction("isConnected") { () -> Bool in
      print("[CarPlay] isConnected function called from JS")
      let connected = CarPlaySession.shared.isConnected()
      print("[CarPlay] isConnected result: \(connected)")
      return connected
    }

    // Finish the session
    AsyncFunction("finishSession") { () -> Void in
      print("[CarPlay] finishSession function called from JS")
      CarPlaySession.shared.finishSession()
      print("[CarPlay] finishSession completed")
    }

    // Pop back one screen
    AsyncFunction("popScreen") { () -> Void in
      print("[CarPlay] popScreen function called from JS")
      CarPlaySession.shared.popScreen()
      print("[CarPlay] popScreen completed")
    }

    // Pop to root screen
    AsyncFunction("popToRoot") { () -> Void in
      print("[CarPlay] popToRoot function called from JS")
      CarPlaySession.shared.popToRoot()
      print("[CarPlay] popToRoot completed")
    }
  }
}
