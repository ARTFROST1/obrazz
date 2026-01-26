import ExpoModulesCore

struct ObrazzContextMenuAction: Record {
  @Field
  var id: String = ""

  @Field
  var title: String = ""

  @Field
  var systemIcon: String?

  @Field
  var destructive: Bool = false

  @Field
  var disabled: Bool = false
}
