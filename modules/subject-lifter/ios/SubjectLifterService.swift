import UIKit
import Vision
import CoreImage
import CoreImage.CIFilterBuiltins
import ImageIO

/**
 * Service class for Apple Vision Subject Lifting (Background Removal)
 *
 * Key points:
 * - Vision generates a low-res mask (pixel buffer) that must be scaled/aligned correctly.
 * - Manual per-pixel loops are very easy to get wrong (bytesPerRow alignment => "striped" artifacts).
 * - We use Core Image to scale the mask (Lanczos) and blend it as alpha.
 */
@available(iOS 16.0, *)
class SubjectLifterService {
  static let shared = SubjectLifterService()

  private let ciContext: CIContext

  private init() {
    ciContext = CIContext(options: [
      .useSoftwareRenderer: false,
      .highQualityDownsample: true
    ])
  }
  
  // MARK: - Public Interface
  
  /// Check if Subject Lifting is supported on this device
  static func isSupported() -> Bool {
    #if targetEnvironment(simulator)
    // Vision segmentation uses on-device ML runtime that isn't available on Simulator.
    return false
    #else
    return true
    #endif
  }
  
  /// Lift subject from image (remove background) - async version
  /// - Parameter imageUri: File URI or path to source image
  /// - Returns: File URI to processed image with transparent background
  func liftSubjectAsync(from imageUri: String) async throws -> String {
    print("[SubjectLifterService] Starting liftSubjectAsync for: \(imageUri)")
    
    // Validate input
    guard !imageUri.isEmpty else {
      throw SubjectLifterError.invalidInput("Image URI is empty")
    }
    
    // Load image from URI
    print("[SubjectLifterService] Loading image...")
    let image = try loadImage(from: imageUri)
    print("[SubjectLifterService] Image loaded: \(image.size.width)x\(image.size.height)")
    
    // Process image using Vision framework
    print("[SubjectLifterService] Processing with Vision framework...")
    let processedImage = try await processWithVision(image)
    print("[SubjectLifterService] Processing complete")
    
    // Save result to temporary file
    print("[SubjectLifterService] Saving result...")
    let outputUri = try saveImage(processedImage)
    print("[SubjectLifterService] Saved to: \(outputUri)")
    
    return outputUri
  }
  
  /// Synchronous wrapper for liftSubjectAsync (called from module)
  func liftSubject(from imageUri: String) throws -> String {
    print("[SubjectLifterService] liftSubject called")
    
    var result: String?
    var error: Error?
    
    let semaphore = DispatchSemaphore(value: 0)
    
    // Run async code in a detached task to avoid blocking main thread
    Task.detached {
      do {
        result = try await self.liftSubjectAsync(from: imageUri)
      } catch let e {
        error = e
      }
      semaphore.signal()
    }
    
    print("[SubjectLifterService] Waiting for async task...")
    semaphore.wait()
    print("[SubjectLifterService] Async task completed")
    
    if let error = error {
      throw error
    }
    
    guard let finalResult = result else {
      throw SubjectLifterError.processingFailed("No result returned")
    }
    
    return finalResult
  }
  
  // MARK: - Private Methods
  
  private func loadImage(from uri: String) throws -> UIImage {
    // Clean up URI (remove file:// prefix if present)
    var path = uri
    if uri.hasPrefix("file://") {
      path = String(uri.dropFirst(7))
    }
    
    // URL decode if needed
    if let decoded = path.removingPercentEncoding {
      path = decoded
    }
    
    print("[SubjectLifterService] Trying to load from path: \(path)")
    
    // Try loading as file path
    if FileManager.default.fileExists(atPath: path) {
      guard let image = UIImage(contentsOfFile: path) else {
        throw SubjectLifterError.invalidInput("Cannot load image from path: \(path)")
      }
      return image
    }
    
    // Try loading as URL
    if let url = URL(string: uri), let data = try? Data(contentsOf: url) {
      guard let image = UIImage(data: data) else {
        throw SubjectLifterError.invalidInput("Cannot decode image data from URL")
      }
      return image
    }
    
    throw SubjectLifterError.invalidInput("Cannot load image from URI: \(uri)")
  }
  
  /// Process image using Vision framework for subject segmentation
  private func processWithVision(_ image: UIImage) async throws -> UIImage {
    guard let cgImage = image.cgImage else {
      throw SubjectLifterError.processingFailed("Cannot get CGImage")
    }

    let exifOrientation = self.exifOrientation(for: image.imageOrientation)

    if #available(iOS 17.0, *) {
      // Better than person segmentation: can detect "foreground instances" (often works for clothing/product)
      return try await processWithForegroundInstanceMask(cgImage: cgImage, exifOrientation: exifOrientation)
    }

    // iOS 16 fallback: person segmentation only
    return try await processWithPersonSegmentation(cgImage: cgImage, exifOrientation: exifOrientation)
  }

  @available(iOS 17.0, *)
  private func processWithForegroundInstanceMask(cgImage: CGImage, exifOrientation: CGImagePropertyOrientation) async throws -> UIImage {
    print("[SubjectLifterService] Using iOS 17+ VNGenerateForegroundInstanceMaskRequest")

    let request = VNGenerateForegroundInstanceMaskRequest()
    let handler = VNImageRequestHandler(cgImage: cgImage, orientation: exifOrientation, options: [:])

    return try await withCheckedThrowingContinuation { continuation in
      DispatchQueue.global(qos: .userInitiated).async {
        do {
          try handler.perform([request])

          guard let observation = request.results?.first else {
            continuation.resume(throwing: SubjectLifterError.noSubjectFound("No foreground detected"))
            return
          }

          let instances = observation.allInstances
          guard !instances.isEmpty else {
            continuation.resume(throwing: SubjectLifterError.noSubjectFound("No instances found"))
            return
          }

          do {
            // API returns a pixel buffer mask (often low-res). We'll scale/blend it safely with Core Image.
            let maskBuffer = try observation.generateScaledMaskForImage(forInstances: instances, from: handler)

            guard let result = self.applyMaskWithCoreImage(maskBuffer: maskBuffer, to: cgImage, exifOrientation: exifOrientation) else {
              continuation.resume(throwing: SubjectLifterError.processingFailed("Failed to apply mask"))
              return
            }

            continuation.resume(returning: result)
          } catch {
            continuation.resume(throwing: SubjectLifterError.processingFailed("Mask generation failed: \(error.localizedDescription)"))
          }
        } catch {
          continuation.resume(throwing: SubjectLifterError.processingFailed("Vision processing failed: \(error.localizedDescription)"))
        }
      }
    }
  }

  private func processWithPersonSegmentation(cgImage: CGImage, exifOrientation: CGImagePropertyOrientation) async throws -> UIImage {
    print("[SubjectLifterService] Using VNGeneratePersonSegmentationRequest")

    let request = VNGeneratePersonSegmentationRequest()
    request.qualityLevel = .accurate
    request.outputPixelFormat = kCVPixelFormatType_OneComponent8

    let handler = VNImageRequestHandler(cgImage: cgImage, orientation: exifOrientation, options: [:])

    return try await withCheckedThrowingContinuation { continuation in
      DispatchQueue.global(qos: .userInitiated).async {
        do {
          try handler.perform([request])

          guard let observation = request.results?.first else {
            continuation.resume(throwing: SubjectLifterError.noSubjectFound("No person detected"))
            return
          }

          let maskBuffer = observation.pixelBuffer

          guard let result = self.applyMaskWithCoreImage(maskBuffer: maskBuffer, to: cgImage, exifOrientation: exifOrientation) else {
            continuation.resume(throwing: SubjectLifterError.processingFailed("Failed to apply mask"))
            return
          }

          continuation.resume(returning: result)
        } catch {
          continuation.resume(throwing: SubjectLifterError.processingFailed("Vision processing failed: \(error.localizedDescription)"))
        }
      }
    }
  }

  /// Apply segmentation mask using Core Image.
  /// This avoids bytesPerRow/alignment issues that can cause "striped" artifacts.
  private func applyMaskWithCoreImage(maskBuffer: CVPixelBuffer, to cgImage: CGImage, exifOrientation: CGImagePropertyOrientation) -> UIImage? {
    let originalCI = CIImage(cgImage: cgImage).oriented(exifOrientation)
    var maskCI = CIImage(cvPixelBuffer: maskBuffer)

    // Scale mask to match image size (mask is often much smaller)
    let scaleX = originalCI.extent.width / maskCI.extent.width
    let scaleY = originalCI.extent.height / maskCI.extent.height
    let uniformScale = scaleY
    let aspectRatio = scaleX / scaleY

    let lanczos = CIFilter.lanczosScaleTransform()
    lanczos.inputImage = maskCI
    lanczos.scale = Float(uniformScale)
    lanczos.aspectRatio = Float(aspectRatio)

    guard let scaledMask = lanczos.outputImage else {
      return nil
    }

    maskCI = scaledMask.cropped(to: originalCI.extent)

    // Convert luminance mask to alpha mask
    let maskToAlpha = CIFilter.maskToAlpha()
    maskToAlpha.inputImage = maskCI

    guard let alphaMask = maskToAlpha.outputImage else {
      return nil
    }

    // Blend foreground with transparent background using alpha mask
    let transparentBG = CIImage(color: CIColor(red: 0, green: 0, blue: 0, alpha: 0)).cropped(to: originalCI.extent)
    let blend = CIFilter.blendWithAlphaMask()
    blend.inputImage = originalCI
    blend.backgroundImage = transparentBG
    blend.maskImage = alphaMask

    guard let outputCI = blend.outputImage else {
      return nil
    }

    guard let outputCG = ciContext.createCGImage(outputCI, from: originalCI.extent) else {
      return nil
    }

    // Pixels are already oriented "up" because we oriented originalCI before compositing.
    return UIImage(cgImage: outputCG, scale: 1.0, orientation: .up)
  }

  private func exifOrientation(for uiOrientation: UIImage.Orientation) -> CGImagePropertyOrientation {
    switch uiOrientation {
    case .up: return .up
    case .down: return .down
    case .left: return .left
    case .right: return .right
    case .upMirrored: return .upMirrored
    case .downMirrored: return .downMirrored
    case .leftMirrored: return .leftMirrored
    case .rightMirrored: return .rightMirrored
    @unknown default: return .up
    }
  }
  
  private func saveImage(_ image: UIImage) throws -> String {
    // Get temporary directory
    let tempDir = FileManager.default.temporaryDirectory
    let filename = "subject_lifted_\(UUID().uuidString).png"
    let fileURL = tempDir.appendingPathComponent(filename)
    
    // Convert to PNG data (preserves transparency)
    guard let pngData = image.pngData() else {
      throw SubjectLifterError.processingFailed("Cannot encode image as PNG")
    }
    
    // Write to file
    try pngData.write(to: fileURL)
    
    return fileURL.absoluteString
  }
}

// MARK: - Error Types

enum SubjectLifterError: Error, LocalizedError {
  case invalidInput(String)
  case noSubjectFound(String)
  case processingFailed(String)
  case unsupported(String)
  
  var errorDescription: String? {
    switch self {
    case .invalidInput(let message):
      return "Invalid input: \(message)"
    case .noSubjectFound(let message):
      return "No subject found: \(message)"
    case .processingFailed(let message):
      return "Processing failed: \(message)"
    case .unsupported(let message):
      return "Unsupported: \(message)"
    }
  }
}
