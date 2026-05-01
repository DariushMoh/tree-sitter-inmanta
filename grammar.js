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

    cid: ($) => /[A-Z][a-zA-Z_0-9-]*/,
    id: ($) => /[a-z_][a-zA-Z_0-9-]*/,

    integer: ($) => /-?[0-9]+/,
    float: ($) => /-?[0-9]*\.[0-9]+/,

    sep: ($) => "::",

    string: ($) => /("([^"\\\n]|\\.)*")|('([^'\\\n]|\\.)*')/,
    fstring: ($) => /(f"([^"\\\n]|\\.)*")|(f'([^'\\\n]|\\.)*')/,
    rstring: ($) => /(r"([^"\\\n]|\\.)*")|(r'([^'\\\n]|\\.)*')/,
    mls: ($) => /"{3,5}[\s\S]*?"{3,5}/,

    cmp_op: ($) => choice("==", "!=", "<=", ">=", "<", ">"),
    rel: ($) => choice("--", "->", "<-"),
    peq: ($) => "+=",
    double_star: ($) => "**",
    plus_op: ($) => "+",
    minus_op: ($) => "-",
    division_op: ($) => "/",
    mod: ($) => "%",

    regex: ($) => /matching\s+\/([^\/\\\n]|\\.)+\//,

    // ── Keyword terminals ──────────────────────────────────────────────────────

    and: ($) => "and",
    as: ($) => "as",
    defined: ($) => "defined",
    dict: ($) => "dict",
    elif: ($) => "elif",
    else: ($) => "else",
    end: ($) => "end",
    entity: ($) => "entity",
    extends: ($) => "extends",
    false: ($) => "false",
    for: ($) => "for",
    if: ($) => "if",
    implement: ($) => "implement",
    implementation: ($) => "implementation",
    import: ($) => "import",
    in: ($) => "in",
    index: ($) => "index",
    is: ($) => "is",
    matching: ($) => "matching",
    not: ($) => "not",
    null: ($) => "null",
    or: ($) => "or",
    parents: ($) => "parents",
    true: ($) => "true",
    typedef: ($) => "typedef",
    undef: ($) => "undef",
    using: ($) => "using",
    when: ($) => "when",

    // ── Structural rules ───────────────────────────────────────────────────────

    main: ($) =>
      choice(seq($.head, optional($.body)), seq(optional($.head), $.body)),
    empty: ($) => choice(),
    head: ($) => choice($.empty, $.mls),
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
      choice(seq($.import, $.ns_ref), seq($.import, $.ns_ref, $.as, $.id)),
    statement: ($) =>
      choice($.assign, $.for, $.if, seq($.expression, optional($.empty))),
    stmt_list: ($) => seq(repeat($.statement), choice($.empty, $.statement)),
    assign: ($) =>
      choice(seq($.var_ref, "=", $.operand), seq($.var_ref, $.peq, $.operand)),
    for: ($) => seq($.for, $.id, $.in, $.operand, ":", $.block),
    if: ($) => seq($.if, $.if_body, $.end),
    if_body: ($) =>
      seq($.expression, ":", optional($.stmt_list), optional($.if_next)),
    if_next: ($) =>
      choice(
        $.empty,
        seq($.else, ":", optional($.stmt_list)),
        seq($.elif, $.if_body),
      ),
    entity_def: ($) =>
      choice(
        seq($.entity, $.cid, ":", $.entity_body_outer),
        seq($.entity, $.id, ":", $.entity_body_outer),
        seq(
          $.entity,
          $.cid,
          $.extends,
          $.class_ref_list,
          ":",
          $.entity_body_outer,
        ),
        seq(
          $.entity,
          $.id,
          $.extends,
          $.class_ref_list,
          ":",
          $.entity_body_outer,
        ),
      ),
    entity_body_outer: ($) =>
      choice(
        seq($.mls, $.entity_body, $.end),
        seq($.entity_body, $.end),
        $.end,
        seq($.mls, $.end),
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
        seq($.attr_type, $.cid, optional($.empty)),
        seq($.attr_type, $.cid, "=", $.constant),
        seq($.attr_type, $.cid, "=", $.constant_list),
        seq($.attr_type, $.cid, "=", $.undef),
        seq($.attr_type, $.id),
        seq($.attr_type, $.id, "=", $.constant),
        seq($.attr_type, $.id, "=", $.constant_list),
        seq($.attr_type, $.id, "=", $.undef),
        seq($.dict, optional($.empty), $.cid, optional($.empty)),
        seq($.dict, optional($.empty), $.cid, "=", $.map_def),
        seq($.dict, optional($.empty), $.cid, "=", $.null),
        seq($.dict, "?", $.cid, optional($.empty)),
        seq($.dict, "?", $.cid, "=", $.map_def),
        seq($.dict, "?", $.cid, "=", $.null),
        seq($.dict, $.id),
        seq($.dict, $.id, "=", $.map_def),
        seq($.dict, $.id, "=", $.null),
        seq($.dict, "?", $.id),
        seq($.dict, "?", $.id, "=", $.map_def),
        seq($.dict, "?", $.id, "=", $.null),
      ),
    implement_ns_list: ($) =>
      seq(choice($.ns_ref, $.parents), repeat(seq(",", $.implement_ns_list))),
    implement_def: ($) =>
      choice(
        seq(
          $.implement,
          $.class_ref,
          $.using,
          $.implement_ns_list,
          optional($.empty),
        ),
        seq($.implement, $.class_ref, $.using, $.implement_ns_list, $.mls),
        seq(
          $.implement,
          $.class_ref,
          $.using,
          $.implement_ns_list,
          $.when,
          $.expression,
          optional($.empty),
        ),
        seq(
          $.implement,
          $.class_ref,
          $.using,
          $.implement_ns_list,
          $.when,
          $.expression,
          $.mls,
        ),
      ),
    implementation_def: ($) =>
      seq($.implementation, $.id, $.for, $.class_ref, $.implementation),
    implementation: ($) => seq($.implementation_head, $.block),
    implementation_head: ($) => choice(":", seq(":", $.mls)),
    block: ($) => seq(optional($.stmt_list), $.end),
    relation: ($) =>
      choice(
        seq($.relation_def, $.mls),
        seq($.relation_def, optional($.empty)),
      ),
    relation_def: ($) =>
      choice(
        seq(
          $.class_ref,
          ".",
          $.id,
          $.multi,
          $.rel,
          $.class_ref,
          ".",
          $.id,
          $.multi,
        ),
        seq($.class_ref, ".", $.id, $.multi, $.rel, $.class_ref),
        seq(
          $.class_ref,
          ".",
          $.id,
          $.multi,
          optional($.operand_list),
          $.class_ref,
          ".",
          $.id,
          $.multi,
        ),
        seq(
          $.class_ref,
          ".",
          $.id,
          $.multi,
          optional($.operand_list),
          $.class_ref,
        ),
      ),
    multi: ($) =>
      choice(
        seq("[", $.integer, "]"),
        seq("[", $.integer, ":", "]"),
        seq("[", $.integer, ":", $.integer, "]"),
        seq("[", ":", $.integer, "]"),
      ),
    typedef: ($) =>
      choice(
        seq($.typedef_inner, optional($.empty)),
        seq($.typedef_inner, $.mls),
      ),
    typedef_inner: ($) =>
      choice(
        seq($.typedef, $.id, $.as, $.ns_ref, $.matching, $.expression),
        seq($.typedef, $.id, $.as, $.ns_ref, $.regex),
        seq($.typedef, $.cid, $.as, $.constructor),
      ),
    index: ($) => seq($.index, $.class_ref, "(", $.id_list, ")"),
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
        seq($.expression, $.cmp_op, $.expression),
        seq($.expression, $.in, $.expression),
        seq($.expression, $.and, $.expression),
        seq($.expression, $.or, $.expression),
        seq($.expression, $.not, $.in, $.expression),
        seq($.not, $.expression),
        seq($.var_ref, ".", $.id, $.is, $.defined),
        seq($.id, $.is, $.defined),
        seq($.map_lookup, $.is, $.defined),
      ),
    arithmetic_expression: ($) =>
      choice(
        seq($.expression, $.plus_op, $.expression),
        seq($.expression, $.minus_op, $.expression),
        seq($.expression, $.division_op, $.expression),
        seq($.expression, "*", $.expression),
        seq($.expression, $.mod, $.expression),
        seq($.expression, $.double_star, $.expression),
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
        repeat(seq($.for, $.id, $.in, $.expression)),
        $.for,
        $.id,
        $.in,
        $.expression,
        optional($.list_comprehension_for_empty),
      ),
    list_comprehension_guard: ($) =>
      seq(
        repeat(seq($.if, $.expression)),
        choice($.empty, seq($.if, $.expression)),
      ),
    dict_key: ($) => choice($.rstring, $.string),
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
        $.integer,
        $.float,
        $.null,
        $.regex,
        $.true,
        $.false,
        $.string,
        $.fstring,
        $.rstring,
        $.mls,
      ),
    constant_list: ($) => seq("[", optional($.constants), "]"),
    constants: ($) =>
      seq(
        repeat(seq($.constant, ",")),
        choice($.constant, seq($.constant, ",")),
      ),
    wrapped_kwargs: ($) => seq($.double_star, $.operand),
    param_list_element: ($) =>
      choice(seq($.id, "=", $.operand), $.wrapped_kwargs),
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
    attr_ref: ($) => seq($.var_ref, ".", $.id),
    class_ref: ($) =>
      choice($.cid, seq($.ns_ref, $.sep, $.cid), seq($.var_ref, ".", $.cid)),
    class_ref_list: ($) =>
      seq(
        repeat(choice(seq($.class_ref, ","), seq($.var_ref, ","))),
        choice($.class_ref, $.var_ref),
      ),
    ns_ref: ($) => seq($.id, repeat(seq($.sep, $.id))),
    id_list: ($) => seq(repeat(seq($.id, ",")), $.id),
  },
});
