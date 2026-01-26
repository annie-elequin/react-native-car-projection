import ExpoModulesCore
import CarPlay

/**
 * CarPlay Session that manages screens and templates
 */
public class CarPlaySession: NSObject, CPInterfaceControllerDelegate {
  public static let shared = CarPlaySession()
  
  private var moduleInstance: CarPlayModule?
  private var interfaceController: CPInterfaceController?
  private var registeredScreens: [String: [String: Any]] = [:]
  private var screenStack: [String] = []
  private var currentScreenName: String?
  private var isSessionActive = false
  
  private override init() {
    super.init()
  }
  
  func setModuleInstance(_ module: CarPlayModule) {
    self.moduleInstance = module
  }
  
  func initialize() {
    // Session initialization happens when CarPlay connects
    // This method can be used to prepare the service
  }
  
  func registerScreen(screenConfig: [String: Any]) throws {
    guard let name = screenConfig["name"] as? String else {
      print("[CarPlay] registerScreen error: Screen name is required")
      throw NSError(domain: "CarPlayModule", code: 1, userInfo: [NSLocalizedDescriptionKey: "Screen name is required"])
    }
    let template = screenConfig["template"] as? [String: Any]
    let templateType = template?["type"] as? String ?? "unknown"
    print("[CarPlay] registerScreen called: name=\(name), templateType=\(templateType)")
    registeredScreens[name] = screenConfig
    print("[CarPlay] Screen registered successfully. Total screens: \(registeredScreens.count)")
  }
  
  func getRegisteredScreens() -> [String: [String: Any]] {
    return registeredScreens
  }
  
  func navigateToScreen(screenName: String, params: [String: Any]?) throws {
    print("[CarPlay] navigateToScreen called: screenName=\(screenName), params=\(params ?? [:])")
    print("[CarPlay] Available screens: \(registeredScreens.keys.joined(separator: ", "))")
    
    guard let screenConfig = registeredScreens[screenName] else {
      print("[CarPlay] navigateToScreen error: Screen '\(screenName)' not found")
      throw NSError(domain: "CarPlayModule", code: 2, userInfo: [NSLocalizedDescriptionKey: "Screen '\(screenName)' not found"])
    }
    
    guard let interfaceController = interfaceController else {
      print("[CarPlay] navigateToScreen error: CarPlay interface controller not available")
      throw NSError(domain: "CarPlayModule", code: 3, userInfo: [NSLocalizedDescriptionKey: "CarPlay interface controller not available"])
    }
    
    print("[CarPlay] Screen found, navigating...")
    currentScreenName = screenName
    screenStack.append(screenName)
    print("[CarPlay] Screen stack after push: \(screenStack.joined(separator: " -> "))")
    
    let template = try CarPlayTemplateBuilder.buildTemplate(from: screenConfig, screenName: screenName, params: params)
    interfaceController.pushTemplate(template, animated: true)
    print("[CarPlay] Template pushed to interface controller")
    
    sendEventToJS("onScreenChanged", data: screenName)
  }
  
  func updateScreen(screenName: String, template: [String: Any]) throws {
    if currentScreenName == screenName {
      guard let interfaceController = interfaceController else {
        throw NSError(domain: "CarPlayModule", code: 3, userInfo: [NSLocalizedDescriptionKey: "CarPlay interface controller not available"])
      }
      
      // Update the current screen template
      let updatedTemplate = try CarPlayTemplateBuilder.buildTemplate(from: ["name": screenName, "template": template], screenName: screenName, params: nil)
      interfaceController.pushTemplate(updatedTemplate, animated: true)
    }
  }
  
  func getCurrentScreenName() -> String? {
    return currentScreenName
  }
  
  func isConnected() -> Bool {
    return isSessionActive && interfaceController != nil
  }
  
  func finishSession() {
    // CarPlay doesn't have a direct "finish" method
    // The session ends when the car disconnects
    popToRoot()
  }
  
  func popScreen() {
    print("[CarPlay] popScreen called. Current stack size: \(screenStack.count)")
    guard let interfaceController = interfaceController, screenStack.count > 1 else {
      print("[CarPlay] popScreen: Cannot pop - stack size is \(screenStack.count)")
      return
    }
    
    screenStack.removeLast()
    print("[CarPlay] Screen stack after pop: \(screenStack.joined(separator: " -> "))")
    interfaceController.popTemplate(animated: true)
    
    currentScreenName = screenStack.last
    print("[CarPlay] Popped to screen: \(currentScreenName ?? "nil")")
    sendEventToJS("onScreenChanged", data: currentScreenName)
  }
  
  func popToRoot() {
    print("[CarPlay] popToRoot called. Current stack size: \(screenStack.count), stack: \(screenStack.joined(separator: " -> "))")
    guard let interfaceController = interfaceController else {
      print("[CarPlay] popToRoot: Interface controller not available")
      return
    }
    
    while screenStack.count > 1 {
      screenStack.removeLast()
      interfaceController.popTemplate(animated: true)
    }
    
    currentScreenName = screenStack.first
    print("[CarPlay] Popped to root screen: \(currentScreenName ?? "nil")")
    sendEventToJS("onScreenChanged", data: currentScreenName)
  }
  
  func setInterfaceController(_ controller: CPInterfaceController?) {
    self.interfaceController = controller
    controller?.delegate = self
  }
  
  func setSessionActive(_ active: Bool) {
    self.isSessionActive = active
  }
  
  func onCarPlayConnected(interfaceController: CPInterfaceController) {
    print("[CarPlay] onCarPlayConnected called")
    self.interfaceController = interfaceController
    interfaceController.delegate = self
    isSessionActive = true
    print("[CarPlay] Session activated. Registered screens: \(registeredScreens.keys.joined(separator: ", "))")
    
    // Find root screen
    let rootScreenName = registeredScreens.keys.first { $0 == "root" } ?? registeredScreens.keys.first
    print("[CarPlay] Root screen name: \(rootScreenName ?? "nil")")
    
    if let rootScreenName = rootScreenName, let screenConfig = registeredScreens[rootScreenName] {
      do {
        currentScreenName = rootScreenName
        screenStack = [rootScreenName]
        print("[CarPlay] Setting root template for: \(rootScreenName)")
        
        let rootTemplate = try CarPlayTemplateBuilder.buildTemplate(from: screenConfig, screenName: rootScreenName, params: nil)
        interfaceController.setRootTemplate(rootTemplate, animated: true)
        print("[CarPlay] Root template set successfully")
        
        sendEventToJS("onSessionStarted", data: nil)
        sendEventToJS("onScreenChanged", data: rootScreenName)
      } catch {
        print("[CarPlay] Error creating root template: \(error)")
      }
    } else {
      print("[CarPlay] No root screen found or screen config missing")
    }
  }
  
  func onCarPlayDisconnected() {
    print("[CarPlay] onCarPlayDisconnected called")
    isSessionActive = false
    interfaceController = nil
    currentScreenName = nil
    screenStack = []
    print("[CarPlay] Session deactivated and cleaned up")
    sendEventToJS("onSessionEnded", data: nil)
  }
  
  private func sendEventToJS(_ eventName: String, data: Any?) {
    print("[CarPlay] sendEventToJS called: eventName=\(eventName)")
    print("[CarPlay] Event data type: \(type(of: data))")
    print("[CarPlay] Event data: \(data ?? "nil")")
    
    guard let moduleInstance = moduleInstance else {
      print("[CarPlay] Cannot send event: moduleInstance is null")
      return
    }
    
    let eventData: [String: Any?] = {
      if let data = data as? [String: Any] {
        return data
      } else if let data = data {
        return ["value": data]
      } else {
        return [:]
      }
    }()
    
    print("[CarPlay] Sending event to JS with data: \(eventData)")
    moduleInstance.sendEvent(eventName, eventData)
    print("[CarPlay] Event sent successfully")
  }
  
  // MARK: - CPInterfaceControllerDelegate
  
  public func templateWillAppear(_ aTemplate: CPTemplate, animated: Bool) {
    // Template is appearing
  }
  
  public func templateDidAppear(_ aTemplate: CPTemplate, animated: Bool) {
    // Template appeared
  }
  
  public func templateWillDisappear(_ aTemplate: CPTemplate, animated: Bool) {
    // Template is disappearing
  }
  
  public func templateDidDisappear(_ aTemplate: CPTemplate, animated: Bool) {
    // Template disappeared
  }
}
