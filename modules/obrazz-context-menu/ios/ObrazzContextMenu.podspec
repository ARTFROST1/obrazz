Pod::Spec.new do |s|
  s.name           = 'ObrazzContextMenu'
  s.version        = '1.0.0'
  s.summary        = 'Native iOS UIContextMenuInteraction wrapper for Expo'
  s.description    = 'Expo Native View that attaches UIContextMenuInteraction to enable native iOS context menus without breaking tap/scroll.'
  s.author         = ''
  s.homepage       = 'https://github.com/artfrost/obrazz'
  s.platform       = :ios, '16.0'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Include Swift files from current directory
  s.source_files = '*.swift'

  s.frameworks = 'UIKit'
end
