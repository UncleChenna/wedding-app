// Native review of synthetic memories samples; run after RUN_MEMORIES_PDF_REVIEW=1 tests.
import Foundation
import PDFKit

guard CommandLine.arguments.count == 2,
      let document = PDFDocument(url: URL(fileURLWithPath: CommandLine.arguments[1])),
      document.pageCount > 0 else {
    fatalError("Expected a readable memories PDF")
}
for index in 0..<document.pageCount {
    guard let page = document.page(at: index) else { fatalError("Missing page") }
    let bounds = page.bounds(for: .mediaBox)
    guard abs(bounds.width - 595.28) < 0.1, abs(bounds.height - 841.89) < 0.1 else {
        fatalError("Expected A4 media box")
    }
    guard (page.string ?? "").contains("\(index + 1) / \(document.pageCount)") else {
        fatalError("Missing page number on page \(index + 1)")
    }
}
let text = document.string ?? ""
for sentinel in ["PRIVATE", "private@example.test"] {
    guard !text.contains(sentinel) else { fatalError("Private fixture data in PDF") }
}
print("PASS: \(document.pageCount) A4 pages with readable page numbers and no private fixture data")
