import CarPlay

/**
 * Converts JavaScript templates to CarPlay templates
 */
public class CarPlayTemplateBuilder {
  
  static func buildTemplate(from screenConfig: [String: Any], screenName: String, params: [String: Any]?) throws -> CPTemplate {
    print("[CarPlay] buildTemplate called: screenName=\(screenName)")
    guard let templateConfig = screenConfig["template"] as? [String: Any] else {
      print("[CarPlay] buildTemplate error: Template not found in screen config")
      throw NSError(domain: "CarPlayModule", code: 4, userInfo: [NSLocalizedDescriptionKey: "Template not found in screen config"])
    }
    
    guard let templateType = templateConfig["type"] as? String else {
      print("[CarPlay] buildTemplate error: Template type not specified")
      throw NSError(domain: "CarPlayModule", code: 5, userInfo: [NSLocalizedDescriptionKey: "Template type not specified"])
    }
    
    print("[CarPlay] Template type detected: \(templateType)")
    switch templateType {
    case "ListTemplate":
      print("[CarPlay] Building ListTemplate")
      return try buildListTemplate(from: templateConfig, screenName: screenName)
    case "MessageTemplate":
      print("[CarPlay] Building MessageTemplate")
      return try buildMessageTemplate(from: templateConfig, screenName: screenName)
    default:
      print("[CarPlay] buildTemplate error: Unknown template type: \(templateType)")
      throw NSError(domain: "CarPlayModule", code: 6, userInfo: [NSLocalizedDescriptionKey: "Unknown template type: \(templateType)"])
    }
  }
  
  private static func buildListTemplate(from config: [String: Any], screenName: String) throws -> CPListTemplate {
    let title = config["title"] as? String ?? "List"
    print("[CarPlay] buildListTemplate called: title=\(title), screenName=\(screenName)")
    
    var sections: [CPListSection] = []
    
    // Handle items array (simplified format)
    if let items = config["items"] as? [[String: Any]] {
      print("[CarPlay] Processing \(items.count) items for ListTemplate")
      let listItems = items.enumerated().map { index, itemConfig -> CPListItem in
        let itemId = "\(screenName)_item_\(index)"
        print("[CarPlay] Creating list item \(index) with itemId: \(itemId)")
        return createListItem(from: itemConfig, screenName: screenName, itemId: itemId)
      }
      
      let header = config["header"] as? String
      let section = CPListSection(items: listItems, header: header, sectionIndexTitle: nil)
      sections.append(section)
      print("[CarPlay] Created section with \(listItems.count) items")
    }
    
    // Handle itemLists format
    if let itemLists = config["itemLists"] as? [[String: Any]] {
      print("[CarPlay] Processing \(itemLists.count) itemLists for ListTemplate")
      for (listIndex, itemList) in itemLists.enumerated() {
        if let items = itemList["items"] as? [[String: Any]] {
          print("[CarPlay] Processing \(items.count) items in itemList \(listIndex)")
          let listItems = items.enumerated().map { itemIndex, itemConfig -> CPListItem in
            let itemId = "\(screenName)_list_\(listIndex)_item_\(itemIndex)"
            print("[CarPlay] Creating list item \(itemIndex) in list \(listIndex) with itemId: \(itemId)")
            return createListItem(from: itemConfig, screenName: screenName, itemId: itemId)
          }
          
          let header = itemList["header"] as? String
          let section = CPListSection(items: listItems, header: header, sectionIndexTitle: nil)
          sections.append(section)
          print("[CarPlay] Created section \(listIndex) with \(listItems.count) items")
        }
      }
    }
    
    let template = CPListTemplate(title: title, sections: sections)
    
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
    print("[CarPlay] createListItem called: itemId=\(itemId), title=\(title), screenName=\(screenName)")
    
    let item = CPListItem(text: title, detailText: texts.first)
    
    // Add additional text lines if available
    if texts.count > 1 {
      item.detailText = texts.joined(separator: "\n")
    }
    
    // Set up tap handler
    print("[CarPlay] Setting up tap handler for itemId: \(itemId)")
    item.handler = { [weak item] _, completion in
      print("[CarPlay] List item tapped: itemId=\(itemId), screenName=\(screenName)")
      // Include itemId in the data sent to JS
      var dataWithId = itemConfig
      dataWithId["id"] = itemId
      print("[CarPlay] Sending user interaction with data including id: \(dataWithId)")
      CarPlaySession.shared.sendUserInteraction(action: "rowPress", screen: screenName, data: dataWithId)
      completion()
    }
    
    print("[CarPlay] List item created successfully: \(itemId)")
    return item
  }
}

// Extension to CarPlaySession for sending user interactions
extension CarPlaySession {
  func sendUserInteraction(action: String, screen: String, data: [String: Any]) {
    print("[CarPlay] sendUserInteraction called: action=\(action), screen=\(screen)")
    print("[CarPlay] User interaction data: \(data)")
    let itemId = data["id"] as? String
    print("[CarPlay] Extracted itemId from data: \(itemId ?? "nil")")
    
    let eventData: [String: Any] = [
      "action": action,
      "screen": screen,
      "data": data
    ]
    print("[CarPlay] Sending onUserInteraction event with structure: \(eventData)")
    sendEventToJS("onUserInteraction", data: eventData)
  }
}
