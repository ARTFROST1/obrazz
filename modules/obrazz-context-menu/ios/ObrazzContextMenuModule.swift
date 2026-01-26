import ExpoModulesCore

public class ObrazzContextMenuModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ObrazzContextMenu")

    View(ObrazzContextMenuView.self) {
      Events("onAction", "onMenuWillShow", "onMenuDidHide")

      Prop("actions") { (view: ObrazzContextMenuView, actions: [ObrazzContextMenuAction]) in
        view.actions = actions
      }

      Prop("menuTitle") { (view: ObrazzContextMenuView, title: String?) in
        view.menuTitle = title ?? ""
      }

      Prop("enabled") { (view: ObrazzContextMenuView, enabled: Bool?) in
        view.enabled = enabled ?? true
        view.syncInteraction()
      }
    }
  }
}
