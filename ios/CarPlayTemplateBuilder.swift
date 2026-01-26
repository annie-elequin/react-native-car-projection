import CarPlay

/**
 * Converts JavaScript templates to CarPlay templates
 */
public class CarPlayTemplateBuilder {
  
  static func buildTemplate(from screenConfig: [String: Any], screenName: String, params: [String: Any]?) throws -> CPTemplate {
    guard let templateConfig = screenConfig["template"] as? [String: Any] else {
      throw NSError(domain: "CarPlayModule", code: 4, userInfo: [NSLocalizedDescriptionKey: "Template not found in screen config"])
    }
    
    guard let templateType = templateConfig["type"] as? String else {
      throw NSError(domain: "CarPlayModule", code: 5, userInfo: [NSLocalizedDescriptionKey: "Template type not specified"])
    }
    
    switch templateType {
    case "ListTemplate":
      return try buildListTemplate(from: templateConfig, screenName: screenName)
    case "MessageTemplate":
      return try buildMessageTemplate(from: templateConfig, screenName: screenName)
    default:
      throw NSError(domain: "CarPlayModule", code: 6, userInfo: [NSLocalizedDescriptionKey: "Unknown template type: \(templateType)"])
    }
  }
  
  private static func buildListTemplate(from config: [String: Any], screenName: String) throws -> CPListTemplate {
    let title = config["title"] as? String ?? "List"
    
    var sections: [CPListSection] = []
    
    // Handle items array (simplified format)
    if let items = config["items"] as? [[String: Any]] {
      let listItems = items.enumerated().map { index, itemConfig -> CPListItem in
        createListItem(from: itemConfig, screenName: screenName, itemId: "\(screenName)_item_\(index)")
      }
      
      let header = config["header"] as? String
      let section = CPListSection(items: listItems, header: header, sectionIndexTitle: nil)
      sections.append(section)
    }
    
    // Handle itemLists format
    if let itemLists = config["itemLists"] as? [[String: Any]] {
      for (listIndex, itemList) in itemLists.enumerated() {
        if let items = itemList["items"] as? [[String: Any]] {
          let listItems = items.enumerated().map { itemIndex, itemConfig -> CPListItem in
            createListItem(from: itemConfig, screenName: screenName, itemId: "\(screenName)_list_\(listIndex)_item_\(itemIndex)")
          }
          
          let header = itemList["header"] as? String
          let section = CPListSection(items: listItems, header: header, sectionIndexTitle: nil)
          sections.append(section)
        }
      }
    }
    
    let template = CPListTemplate(title: title, sections: sections)
    
    // Add header action if present
    if let headerAction = config["headerAction"] as? [String: Any] {
      template.tabBarTemplate = nil // Clear tab bar if we have header action
      // Note: CarPlay doesn't support header actions the same way Android Auto does
      // This would need to be handled differently
    }
    
    return template
  }
  
  private static func buildMessageTemplate(from config: [String: Any], screenName: String) throws -> CPInformationTemplate {
    let title = config["title"] as? String ?? "Message"
    let message = config["message"] as? String ?? ""
    
    var items: [CPInformationItem] = []
    items.append(CPInformationItem(title: title, detail: message))
    
    var actions: [CPTextButton] = []
    
    // Add header action if present
    if let headerAction = config["headerAction"] as? [String: Any],
       let actionTitle = headerAction["title"] as? String {
      let action = CPTextButton(title: actionTitle) { _ in
        CarPlaySession.shared.sendUserInteraction(action: "actionPress", screen: screenName, data: headerAction)
      }
      actions.append(action)
    }
    
    // Add action strip if present
    if let actionStrip = config["actionStrip"] as? [[String: Any]] {
      for actionConfig in actionStrip {
        if let actionTitle = actionConfig["title"] as? String {
          let action = CPTextButton(title: actionTitle) { _ in
            CarPlaySession.shared.sendUserInteraction(action: "actionPress", screen: screenName, data: actionConfig)
          }
          actions.append(action)
        }
      }
    }
    
    return CPInformationTemplate(title: title, layout: .twoColumn, items: items, actions: actions)
  }
  
  private static func createListItem(from itemConfig: [String: Any], screenName: String, itemId: String) -> CPListItem {
    let title = itemConfig["title"] as? String ?? "Item"
    let texts = itemConfig["texts"] as? [String] ?? []
    
    let item = CPListItem(text: title, detailText: texts.first)
    
    // Add additional text lines if available
    if texts.count > 1 {
      item.detailText = texts.joined(separator: "\n")
    }
    
    // Set up tap handler
    item.handler = { [weak item] _, completion in
      CarPlaySession.shared.sendUserInteraction(action: "rowPress", screen: screenName, data: itemConfig)
      completion()
    }
    
    return item
  }
}

// Extension to CarPlaySession for sending user interactions
extension CarPlaySession {
  func sendUserInteraction(action: String, screen: String, data: [String: Any]) {
    let eventData: [String: Any] = [
      "action": action,
      "screen": screen,
      "data": data
    ]
    sendEventToJS("onUserInteraction", data: eventData)
  }
}
