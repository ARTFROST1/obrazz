import ExpoModulesCore
import UIKit
import Vision

/**
 * Expo Native Module for Subject Lifting (Background Removal) using Apple Vision
 * 
 * Requires iOS 16+ and Vision framework
 */
public class SubjectLifterModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SubjectLifter")

    // Check if Vision Subject Lifting is available
    AsyncFunction("isAvailable") { () -> Bool in
      if #available(iOS 16.0, *) {
        return SubjectLifterService.isSupported()
      }
      return false
    }

    // Lift subject from image (remove background)
    AsyncFunction("liftSubject") { (imageUri: String, promise: Promise) in
      guard #available(iOS 16.0, *) else {
        promise.reject("UNAVAILABLE", "Vision Subject Lifting requires iOS 16+")
        return
      }

      print("[SubjectLifterModule] liftSubject called with: \(imageUri)")
      
      // Use Task.detached to avoid blocking any thread
      Task.detached {
        do {
          let resultUri = try await SubjectLifterService.shared.liftSubjectAsync(from: imageUri)
          print("[SubjectLifterModule] Success, returning: \(resultUri)")
          promise.resolve(resultUri)
        } catch {
          print("[SubjectLifterModule] Error: \(error.localizedDescription)")
          promise.reject("SUBJECT_LIFT_FAILED", error.localizedDescription)
        }
      }
    }

    // Get iOS version info (for debugging)
    Function("getSystemInfo") { () -> [String: Any] in
      return [
        "iosVersion": UIDevice.current.systemVersion,
        "isVisionAvailable": {
          if #available(iOS 16.0, *) {
            return SubjectLifterService.isSupported()
          }
          return false
        }()
      ]
    }
  }
}
