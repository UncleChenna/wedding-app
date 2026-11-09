// Review the synthetic gate-list print preview with macOS PDFKit; no production data.
import Foundation
import PDFKit
import AppKit

guard CommandLine.arguments.count == 4,
      let document = PDFDocument(url: URL(fileURLWithPath: CommandLine.arguments[1])),
      document.pageCount > 0 else { fatalError("Expected a readable PDF, names JSON and output directory") }
let names = try JSONDecoder().decode([String].self, from: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[2])))
let output = CommandLine.arguments[3]
try FileManager.default.createDirectory(atPath: output, withIntermediateDirectories: true)
let normalize: (String) -> String = { $0.components(separatedBy: .whitespacesAndNewlines).joined() }
let fullText = normalize(document.string ?? "")
for name in names { guard fullText.contains(normalize(name)) else { fatalError("A companion is missing from the PDF") } }
for index in 0..<document.pageCount {
    guard let page = document.page(at: index) else { fatalError("Missing page") }
    let bounds = page.bounds(for: .mediaBox)
    guard abs(bounds.width - 595.28) < 1, abs(bounds.height - 841.89) < 1 else { fatalError("Page is not A4") }
    for character in 0..<page.numberOfCharacters {
        let rect = page.characterBounds(at: character)
        if rect.isEmpty { continue }
        guard rect.minX >= -1, rect.maxX <= bounds.width + 1, rect.minY >= -1, rect.maxY <= bounds.height + 1 else { fatalError("Printed text exceeds page bounds") }
    }
    let thumbnail = page.thumbnail(of: NSSize(width: bounds.width * 1.5, height: bounds.height * 1.5), for: .mediaBox)
    guard let tiff = thumbnail.tiffRepresentation, let bitmap = NSBitmapImageRep(data: tiff), let png = bitmap.representation(using: .png, properties: [:]) else { fatalError("Cannot rasterize page") }
    try png.write(to: URL(fileURLWithPath: "\(output)/page-\(index + 1).png"))
}
try (document.string ?? "").write(toFile: "\(output)/text.txt", atomically: true, encoding: .utf8)
print("PASS: \(document.pageCount) A4 pages, every expected companion present, all text within page bounds; previews rasterized")
