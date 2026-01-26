import ExpoModulesCore
import UIKit

final class ObrazzContextMenuView: ExpoView, UIContextMenuInteractionDelegate {
  let onAction = EventDispatcher()
  let onMenuWillShow = EventDispatcher()
  let onMenuDidHide = EventDispatcher()

  var actions: [ObrazzContextMenuAction] = []
  var menuTitle: String = ""
  var enabled: Bool = true

  private var contextMenuInteraction: UIContextMenuInteraction?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    syncInteraction()
  }

  func syncInteraction() {
    if enabled {
      if contextMenuInteraction == nil {
        let interaction = UIContextMenuInteraction(delegate: self)
        addInteraction(interaction)
        contextMenuInteraction = interaction
      }
    } else {
      if let interaction = contextMenuInteraction {
        removeInteraction(interaction)
        contextMenuInteraction = nil
      }
    }
  }

  // MARK: UIContextMenuInteractionDelegate

  func contextMenuInteraction(
    _ interaction: UIContextMenuInteraction,
    configurationForMenuAtLocation location: CGPoint
  ) -> UIContextMenuConfiguration? {
    if !enabled || actions.isEmpty {
      return nil
    }

    return UIContextMenuConfiguration(identifier: nil, previewProvider: nil) { _ in
      let children: [UIMenuElement] = self.actions.map { action in
        var attributes: UIMenuElement.Attributes = []
        if action.destructive {
          attributes.insert(.destructive)
        }
        if action.disabled {
          attributes.insert(.disabled)
        }

        let image = action.systemIcon.flatMap { UIImage(systemName: $0) }

        return UIAction(
          title: action.title,
          image: image,
          identifier: nil,
          discoverabilityTitle: nil,
          attributes: attributes,
          state: .off
        ) { _ in
          self.onAction([
            "id": action.id
          ])
        }
      }

      return UIMenu(title: self.menuTitle, children: children)
    }
  }

  func contextMenuInteraction(
    _ interaction: UIContextMenuInteraction,
    willDisplayMenuFor configuration: UIContextMenuConfiguration,
    animator: UIContextMenuInteractionAnimating?
  ) {
    onMenuWillShow([:])
  }

  func contextMenuInteraction(
    _ interaction: UIContextMenuInteraction,
    willEndFor configuration: UIContextMenuConfiguration,
    animator: UIContextMenuInteractionAnimating?
  ) {
    animator?.addCompletion {
      self.onMenuDidHide([:])
    }
  }
}
