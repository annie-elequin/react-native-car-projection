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
    print("[CarPlay] templateApplicationScene didConnect called")
    self.interfaceController = interfaceController
    CarPlaySession.shared.onCarPlayConnected(interfaceController: interfaceController)
    print("[CarPlay] CarPlay connection completed")
  }
  
  public func templateApplicationScene(_ templateApplicationScene: CPTemplateApplicationScene,
                                      didDisconnect interfaceController: CPInterfaceController) {
    print("[CarPlay] templateApplicationScene didDisconnect called")
    self.interfaceController = nil
    CarPlaySession.shared.onCarPlayDisconnected()
    print("[CarPlay] CarPlay disconnection completed")
  }
}
