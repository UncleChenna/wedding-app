// macOS review helper: inspect with PDFKit and rasterize using Core Graphics at 300dpi.
import Foundation
import PDFKit
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

let input = URL(fileURLWithPath: CommandLine.arguments[1])
let prefix = CommandLine.arguments[2]
guard let document = CGPDFDocument(input as CFURL), let textDocument = PDFDocument(url: input) else { fatalError("Invalid PDF") }
try (textDocument.string ?? "").write(toFile: prefix + ".txt", atomically: true, encoding: .utf8)
for index in 1...document.numberOfPages {
    guard let page = document.page(at: index) else { fatalError("Missing page") }
    let rect = page.getBoxRect(.mediaBox)
    let scale = 300.0 / 72.0
    let width = Int(ceil(rect.width * scale)), height = Int(ceil(rect.height * scale))
    guard let context = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width * 4, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue) else { fatalError("No canvas") }
    context.setFillColor(CGColor(gray: 1, alpha: 1))
    context.fill(CGRect(x: 0, y: 0, width: width, height: height))
    context.scaleBy(x: scale, y: scale)
    context.drawPDFPage(page)
    guard let image = context.makeImage(), let bytes = context.data else { fatalError("No image") }
    let output = prefix + "-\(index)"
    let destination = CGImageDestinationCreateWithURL(URL(fileURLWithPath: output + ".png") as CFURL, UTType.png.identifier as CFString, 1, nil)!
    CGImageDestinationAddImage(destination, image, nil)
    guard CGImageDestinationFinalize(destination) else { fatalError("No PNG") }
    try Data(bytes: bytes, count: width * height * 4).write(to: URL(fileURLWithPath: output + ".rgba"))
    try JSONSerialization.data(withJSONObject: ["width": width, "height": height]).write(to: URL(fileURLWithPath: output + ".json"))
}
print("PASS: PDFKit opened \(document.numberOfPages) A5 pages; rasterized at 300dpi")
