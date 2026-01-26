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
      throw NSError(domain: "CarPlayModule", code: 1, userInfo: [NSLocalizedDescriptionKey: "Screen name is required"])
    }
    registeredScreens[name] = screenConfig
  }
  
  func getRegisteredScreens() -> [String: [String: Any]] {
    return registeredScreens
  }
  
  func navigateToScreen(screenName: String, params: [String: Any]?) throws {
    guard let screenConfig = registeredScreens[screenName] else {
      throw NSError(domain: "CarPlayModule", code: 2, userInfo: [NSLocalizedDescriptionKey: "Screen '\(screenName)' not found"])
    }
    
    guard let interfaceController = interfaceController else {
      throw NSError(domain: "CarPlayModule", code: 3, userInfo: [NSLocalizedDescriptionKey: "CarPlay interface controller not available"])
    }
    
    currentScreenName = screenName
    screenStack.append(screenName)
    
    let template = try CarPlayTemplateBuilder.buildTemplate(from: screenConfig, screenName: screenName, params: params)
    interfaceController.pushTemplate(template, animated: true)
    
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
    guard let interfaceController = interfaceController, screenStack.count > 1 else {
      return
    }
    
    screenStack.removeLast()
    interfaceController.popTemplate(animated: true)
    
    currentScreenName = screenStack.last
    sendEventToJS("onScreenChanged", data: currentScreenName)
  }
  
  func popToRoot() {
    guard let interfaceController = interfaceController else {
      return
    }
    
    while screenStack.count > 1 {
      screenStack.removeLast()
      interfaceController.popTemplate(animated: true)
    }
    
    currentScreenName = screenStack.first
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
    self.interfaceController = interfaceController
    interfaceController.delegate = self
    isSessionActive = true
    
    // Find root screen
    let rootScreenName = registeredScreens.keys.first { $0 == "root" } ?? registeredScreens.keys.first
    
    if let rootScreenName = rootScreenName, let screenConfig = registeredScreens[rootScreenName] {
      do {
        currentScreenName = rootScreenName
        screenStack = [rootScreenName]
        
        let rootTemplate = try CarPlayTemplateBuilder.buildTemplate(from: screenConfig, screenName: rootScreenName, params: nil)
        interfaceController.setRootTemplate(rootTemplate, animated: true)
        
        sendEventToJS("onSessionStarted", data: nil)
        sendEventToJS("onScreenChanged", data: rootScreenName)
      } catch {
        print("[CarPlay] Error creating root template: \(error)")
      }
    }
  }
  
  func onCarPlayDisconnected() {
    isSessionActive = false
    interfaceController = nil
    currentScreenName = nil
    screenStack = []
    sendEventToJS("onSessionEnded", data: nil)
  }
  
  private func sendEventToJS(_ eventName: String, data: Any?) {
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
    
    moduleInstance.sendEvent(eventName, eventData)
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
