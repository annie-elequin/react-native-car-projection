import UIKit
import CarPlay

/**
 * CarPlay Scene Delegate - handles CarPlay scene lifecycle
 */
@available(iOS 14.0, *)
public class CarPlaySceneDelegate: UIResponder, CPTemplateApplicationSceneDelegate {
  
  public var interfaceController: CPInterfaceController?
  
  public func templateApplicationScene(_ templateApplicationScene: CPTemplateApplicationScene,
                                      didConnect interfaceController: CPInterfaceController) {
    self.interfaceController = interfaceController
    CarPlaySession.shared.setInterfaceController(interfaceController)
    CarPlaySession.shared.onCarPlayConnected(interfaceController: interfaceController)
  }
  
  public func templateApplicationScene(_ templateApplicationScene: CPTemplateApplicationScene,
                                      didDisconnect interfaceController: CPInterfaceController) {
    self.interfaceController = nil
    CarPlaySession.shared.onCarPlayDisconnected()
  }
}
