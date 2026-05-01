import XCTest
import SwiftTreeSitter
import TreeSitterInmantazed

final class TreeSitterInmantazedTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_inmantazed())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Inmantazed grammar")
    }
}
