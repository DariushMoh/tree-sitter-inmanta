/**
 * Tree-sitter grammar for the Inmanta configuration modelling language.
 * Derived from src/inmanta/parser/plyInmantaLex.py and plyInmantaParser.py.
 */

module.exports = grammar({
  name: "inmanta",
  extras: ($) => [/\s/, $.comment],
  rules: {
    comment: ($) => /#[^\n]*/,
    // ── Non-keyword terminals ──────────────────────────────────────────────────

    // Uppercase-first identifier (entity/class names)
    CID: ($) => /[A-Z][a-zA-Z_0-9-]*/,

    // Lowercase/underscore-first identifier
    ID: ($) => /[a-z_][a-zA-Z_0-9-]*/,

    INT: ($) => /-?[0-9]+/,
    FLOAT: ($) => /-?[0-9]*\.[0-9]+/,

    // Module separator
    SEP: ($) => "::",

    STRING: ($) => /("([^"\\\n]|\\.)*")|('([^'\\\n]|\\.)*')/,
    FSTRING: ($) => /(f"([^"\\\n]|\\.)*")|(f'([^'\\\n]|\\.)*')/,
    RSTRING: ($) => /(r"([^"\\\n]|\\.)*")|(r'([^'\\\n]|\\.)*')/,

    // 3-5 double-quote delimiters per the PLY lexer
    MLS: ($) => /"{3,5}[\s\S]*?"{3,5}/,

    CMP_OP: ($) => choice("==", "!=", "<=", ">=", "<", ">"),
    REL: ($) => choice("--", "->", "<-"),
    PEQ: ($) => "+=",
    DOUBLE_STAR: ($) => "**",
    PLUS_OP: ($) => "+",
    MINUS_OP: ($) => "-",
    DIVISION_OP: ($) => "/",
    MOD: ($) => "%",

    // REGEX includes the 'matching' keyword — PLY tokenises them together to
    // distinguish matching /pattern/ from two consecutive division operators.
    REGEX: ($) => /matching\s+\/([^\/\\\n]|\\.)+\//,

    // ── Keyword terminals ──────────────────────────────────────────────────────

    AND: ($) => "and",
    AS: ($) => "as",
    DEFINED: ($) => "defined",
    DICT: ($) => "dict",
    ELIF: ($) => "elif",
    ELSE: ($) => "else",
    END: ($) => "end",
    ENTITY: ($) => "entity",
    EXTENDS: ($) => "extends",
    FALSE: ($) => "false",
    FOR: ($) => "for",
    IF: ($) => "if",
    IMPLEMENT: ($) => "implement",
    IMPLEMENTATION: ($) => "implementation",
    IMPORT: ($) => "import",
    IN: ($) => "in",
    INDEX: ($) => "index",
    IS: ($) => "is",
    MATCHING: ($) => "matching",
    NOT: ($) => "not",
    NULL: ($) => "null",
    OR: ($) => "or",
    PARENTS: ($) => "parents",
    TRUE: ($) => "true",
    TYPEDEF: ($) => "typedef",
    UNDEF: ($) => "undef",
    USING: ($) => "using",
    WHEN: ($) => "when",

    main: ($) =>
      choice(seq($.head, optional($.body)), seq(optional($.head), $.body)),
    empty: ($) => choice(),
    head: ($) => choice($.empty, $.MLS),
    body: ($) => seq(repeat($.top_stmt), choice($.empty, $.top_stmt)),
    top_stmt: ($) =>
      choice(
        $.entity_def,
        $.implement_def,
        $.implementation_def,
        $.relation,
        $.statement,
        $.typedef,
        $.index,
        $.import,
      ),
    import: ($) =>
      choice(seq($.IMPORT, $.ns_ref), seq($.IMPORT, $.ns_ref, $.AS, $.ID)),
    statement: ($) =>
      choice($.assign, $.for, $.if, seq($.expression, optional($.empty))),
    stmt_list: ($) => seq(repeat($.statement), choice($.empty, $.statement)),
    assign: ($) =>
      choice(seq($.var_ref, "=", $.operand), seq($.var_ref, $.PEQ, $.operand)),
    for: ($) => seq($.FOR, $.ID, $.IN, $.operand, ":", $.block),
    if: ($) => seq($.IF, $.if_body, $.END),
    if_body: ($) =>
      seq($.expression, ":", optional($.stmt_list), optional($.if_next)),
    if_next: ($) =>
      choice(
        $.empty,
        seq($.ELSE, ":", optional($.stmt_list)),
        seq($.ELIF, $.if_body),
      ),
    entity_def: ($) =>
      choice(
        seq($.ENTITY, $.CID, ":", $.entity_body_outer),
        seq($.ENTITY, $.ID, ":", $.entity_body_outer),
        seq(
          $.ENTITY,
          $.CID,
          $.EXTENDS,
          $.class_ref_list,
          ":",
          $.entity_body_outer,
        ),
        seq(
          $.ENTITY,
          $.ID,
          $.EXTENDS,
          $.class_ref_list,
          ":",
          $.entity_body_outer,
        ),
      ),
    entity_body_outer: ($) =>
      choice(
        seq($.MLS, $.entity_body, $.END),
        seq($.entity_body, $.END),
        $.END,
        seq($.MLS, $.END),
      ),
    entity_body: ($) => repeat1($.attr),
    attr_base_type: ($) => $.ns_ref,
    attr_type_multi: ($) => seq($.attr_base_type, "[", "]"),
    attr_type_opt: ($) =>
      choice(seq($.attr_type_multi, "?"), seq($.attr_base_type, "?")),
    attr_type: ($) =>
      choice($.attr_type_opt, $.attr_type_multi, $.attr_base_type),
    attr: ($) =>
      choice(
        seq($.attr_type, $.CID, optional($.empty)),
        seq($.attr_type, $.CID, "=", $.constant),
        seq($.attr_type, $.CID, "=", $.constant_list),
        seq($.attr_type, $.CID, "=", $.UNDEF),
        seq($.attr_type, $.ID),
        seq($.attr_type, $.ID, "=", $.constant),
        seq($.attr_type, $.ID, "=", $.constant_list),
        seq($.attr_type, $.ID, "=", $.UNDEF),
        seq($.DICT, optional($.empty), $.CID, optional($.empty)),
        seq($.DICT, optional($.empty), $.CID, "=", $.map_def),
        seq($.DICT, optional($.empty), $.CID, "=", $.NULL),
        seq($.DICT, "?", $.CID, optional($.empty)),
        seq($.DICT, "?", $.CID, "=", $.map_def),
        seq($.DICT, "?", $.CID, "=", $.NULL),
        seq($.DICT, $.ID),
        seq($.DICT, $.ID, "=", $.map_def),
        seq($.DICT, $.ID, "=", $.NULL),
        seq($.DICT, "?", $.ID),
        seq($.DICT, "?", $.ID, "=", $.map_def),
        seq($.DICT, "?", $.ID, "=", $.NULL),
      ),
    implement_ns_list: ($) =>
      seq(choice($.ns_ref, $.PARENTS), repeat(seq(",", $.implement_ns_list))),
    implement_def: ($) =>
      choice(
        seq(
          $.IMPLEMENT,
          $.class_ref,
          $.USING,
          $.implement_ns_list,
          optional($.empty),
        ),
        seq($.IMPLEMENT, $.class_ref, $.USING, $.implement_ns_list, $.MLS),
        seq(
          $.IMPLEMENT,
          $.class_ref,
          $.USING,
          $.implement_ns_list,
          $.WHEN,
          $.expression,
          optional($.empty),
        ),
        seq(
          $.IMPLEMENT,
          $.class_ref,
          $.USING,
          $.implement_ns_list,
          $.WHEN,
          $.expression,
          $.MLS,
        ),
      ),
    implementation_def: ($) =>
      seq($.IMPLEMENTATION, $.ID, $.FOR, $.class_ref, $.implementation),
    implementation: ($) => seq($.implementation_head, $.block),
    implementation_head: ($) => choice(":", seq(":", $.MLS)),
    block: ($) => seq(optional($.stmt_list), $.END),
    relation: ($) =>
      choice(
        seq($.relation_def, $.MLS),
        seq($.relation_def, optional($.empty)),
      ),
    relation_def: ($) =>
      choice(
        seq(
          $.class_ref,
          ".",
          $.ID,
          $.multi,
          $.REL,
          $.class_ref,
          ".",
          $.ID,
          $.multi,
        ),
        seq($.class_ref, ".", $.ID, $.multi, $.REL, $.class_ref),
        seq(
          $.class_ref,
          ".",
          $.ID,
          $.multi,
          optional($.operand_list),
          $.class_ref,
          ".",
          $.ID,
          $.multi,
        ),
        seq(
          $.class_ref,
          ".",
          $.ID,
          $.multi,
          optional($.operand_list),
          $.class_ref,
        ),
      ),
    multi: ($) =>
      choice(
        seq("[", $.INT, "]"),
        seq("[", $.INT, ":", "]"),
        seq("[", $.INT, ":", $.INT, "]"),
        seq("[", ":", $.INT, "]"),
      ),
    typedef: ($) =>
      choice(
        seq($.typedef_inner, optional($.empty)),
        seq($.typedef_inner, $.MLS),
      ),
    typedef_inner: ($) =>
      choice(
        seq($.TYPEDEF, $.ID, $.AS, $.ns_ref, $.MATCHING, $.expression),
        seq($.TYPEDEF, $.ID, $.AS, $.ns_ref, $.REGEX),
        seq($.TYPEDEF, $.CID, $.AS, $.constructor),
      ),
    index: ($) => seq($.INDEX, $.class_ref, "(", $.id_list, ")"),
    expression: ($) =>
      choice(
        $.boolean_expression,
        $.constant,
        $.function_call,
        seq($.var_ref, optional($.empty)),
        $.constructor,
        $.list_def,
        $.list_comprehension,
        $.map_def,
        seq($.map_lookup, optional($.empty)),
        $.index_lookup,
        $.conditional_expression,
        $.arithmetic_expression,
        seq("(", $.expression, ")"),
      ),
    boolean_expression: ($) =>
      choice(
        seq($.expression, $.CMP_OP, $.expression),
        seq($.expression, $.IN, $.expression),
        seq($.expression, $.AND, $.expression),
        seq($.expression, $.OR, $.expression),
        seq($.expression, $.NOT, $.IN, $.expression),
        seq($.NOT, $.expression),
        seq($.var_ref, ".", $.ID, $.IS, $.DEFINED),
        seq($.ID, $.IS, $.DEFINED),
        seq($.map_lookup, $.IS, $.DEFINED),
      ),
    arithmetic_expression: ($) =>
      choice(
        seq($.expression, $.PLUS_OP, $.expression),
        seq($.expression, $.MINUS_OP, $.expression),
        seq($.expression, $.DIVISION_OP, $.expression),
        seq($.expression, "*", $.expression),
        seq($.expression, $.MOD, $.expression),
        seq($.expression, $.DOUBLE_STAR, $.expression),
      ),
    operand: ($) => seq($.expression, optional($.empty)),
    map_lookup: ($) =>
      seq(
        choice(
          seq($.attr_ref, "[", $.operand, "]"),
          seq($.var_ref, "[", $.operand, "]"),
        ),
        repeat(seq("[", $.operand, "]")),
      ),
    constructor: ($) => seq($.class_ref, "(", optional($.param_list), ")"),
    function_call: ($) =>
      choice(
        seq($.ns_ref, "(", optional($.function_param_list), ")"),
        seq($.attr_ref, "(", optional($.function_param_list), ")"),
      ),
    list_def: ($) => seq("[", optional($.operand_list), "]"),
    list_comprehension: ($) =>
      seq(
        "[",
        $.expression,
        $.list_comprehension_for,
        optional($.list_comprehension_guard),
        "]",
      ),
    list_comprehension_for_empty: ($) => $.empty,
    list_comprehension_for: ($) =>
      seq(
        repeat(seq($.FOR, $.ID, $.IN, $.expression)),
        $.FOR,
        $.ID,
        $.IN,
        $.expression,
        optional($.list_comprehension_for_empty),
      ),
    list_comprehension_guard: ($) =>
      seq(
        repeat(seq($.IF, $.expression)),
        choice($.empty, seq($.IF, $.expression)),
      ),
    dict_key: ($) => choice($.RSTRING, $.STRING),
    pair_list: ($) =>
      seq(
        repeat(seq($.dict_key, ":", $.operand, ",")),
        choice(
          seq(
            $.dict_key,
            ":",
            $.operand,
            optional($.empty),
            optional($.pair_list_empty),
          ),
          $.pair_list_empty,
          seq($.dict_key, ":", $.operand, ","),
        ),
      ),
    pair_list_empty: ($) => $.empty,
    map_def: ($) => seq("{", optional($.pair_list), "}"),
    index_lookup: ($) =>
      choice(
        seq($.class_ref, "[", optional($.param_list), "]"),
        seq($.attr_ref, "[", optional($.param_list), "]"),
      ),
    conditional_expression: ($) =>
      seq($.expression, "?", $.expression, ":", $.expression),
    constant: ($) =>
      choice(
        $.INT,
        $.FLOAT,
        $.NULL,
        $.REGEX,
        $.TRUE,
        $.FALSE,
        $.STRING,
        $.FSTRING,
        $.RSTRING,
        $.MLS,
      ),
    constant_list: ($) => seq("[", optional($.constants), "]"),
    constants: ($) =>
      seq(
        repeat(seq($.constant, ",")),
        choice($.constant, seq($.constant, ",")),
      ),
    wrapped_kwargs: ($) => seq($.DOUBLE_STAR, $.operand),
    param_list_element: ($) =>
      choice(seq($.ID, "=", $.operand), $.wrapped_kwargs),
    param_list: ($) =>
      seq(
        repeat(seq($.param_list_element, ",")),
        choice(
          $.param_list_empty,
          seq(
            $.param_list_element,
            optional($.empty),
            optional($.param_list_empty),
          ),
          seq($.param_list_element, ","),
        ),
      ),
    param_list_empty: ($) => $.empty,
    function_param_list_element: ($) => choice($.param_list_element, $.operand),
    function_param_list: ($) =>
      seq(
        repeat(seq($.function_param_list_element, ",")),
        choice(
          $.function_param_list_empty,
          seq(
            $.function_param_list_element,
            optional($.empty),
            optional($.function_param_list_empty),
          ),
          seq($.function_param_list_element, ","),
        ),
      ),
    function_param_list_empty: ($) => $.empty,
    operand_list: ($) =>
      seq(
        repeat(seq($.operand, ",")),
        choice($.operand, $.empty, seq($.operand, ",")),
      ),
    var_ref: ($) =>
      choice(
        seq($.attr_ref, optional($.empty)),
        seq($.ns_ref, optional($.empty)),
      ),
    attr_ref: ($) => seq($.var_ref, ".", $.ID),
    class_ref: ($) =>
      choice($.CID, seq($.ns_ref, $.SEP, $.CID), seq($.var_ref, ".", $.CID)),
    class_ref_list: ($) =>
      seq(
        repeat(choice(seq($.class_ref, ","), seq($.var_ref, ","))),
        choice($.class_ref, $.var_ref),
      ),
    ns_ref: ($) => seq($.ID, repeat(seq($.SEP, $.ID))),
    id_list: ($) => seq(repeat(seq($.ID, ",")), $.ID),
  },
});
