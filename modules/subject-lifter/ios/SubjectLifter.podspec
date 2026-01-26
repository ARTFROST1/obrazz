Pod::Spec.new do |s|
  s.name           = 'SubjectLifter'
  s.version        = '1.0.0'
  s.summary        = 'Apple VisionKit Subject Lifting (Background Removal) for Expo'
  s.description    = 'Expo Native Module for removing image backgrounds using Apple VisionKit'
  s.author         = ''
  s.homepage       = 'https://github.com/artfrost/obrazz'
  s.platform       = :ios, '16.0'
  s.source         = { git: '' }
  s.static_framework = true
  
  s.dependency 'ExpoModulesCore'
  
  # Include Swift files from current directory
  s.source_files = '*.swift'
  
  # Add VisionKit framework
  s.frameworks = 'VisionKit', 'UIKit', 'CoreImage'
end
