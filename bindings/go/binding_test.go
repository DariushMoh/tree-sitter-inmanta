package tree_sitter_inmantazed_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_inmantazed "github.com/tree-sitter/tree-sitter-inmantazed/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_inmantazed.Language())
	if language == nil {
		t.Errorf("Error loading Inmantazed grammar")
	}
}
