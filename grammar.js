module.exports = grammar({
  name: "inmanta",
  word: ($) => $.id,
  extras: ($) => [/\s/, $.comment],

  conflicts: ($) => [
    [$.head, $.constant],
    [$.typedef_stmt],
    [$.expression, $.boolean_expression],
    [$.expression, $.arithmetic_expression],
    [$.expression, $.conditional_expression],
    [$.var_ref, $.attr_ref],
    [$.var_ref, $.ns_ref],
    [$.class_ref, $.ns_ref],
    [$.class_ref, $.var_ref],
    [$.function_call, $.ns_ref],
    [$.function_call, $.attr_ref],
    [$.map_lookup, $.var_ref],
    [$.map_lookup, $.attr_ref],
    [$.index_lookup, $.class_ref],
    [$.index_lookup, $.attr_ref],
    [$.param_list, $.param_list_element],
    [$.function_param_list, $.function_param_list_element],
    [$.operand_list],
    [$.implement_ns_list],
    [$.class_ref_list],
    [$.relation],
    [$.implement_def],
    [$.param_list, $.param_list_empty],
    [$.function_param_list, $.function_param_list_empty],
    [$.implementation_head],
    [$.pair_list, $.pair_list_empty],
    [$.relation_def, $.index_lookup],
    [$.relation_def, $.constructor],
    [$.lookup_open, $.index_lookup],
  ],

  rules: {
    main: ($) => choice(seq($.head, optional($.body)), $.body),

    comment: ($) => /#[^\n]*/,

    // ── Non-keyword terminals ──────────────────────────────────────────────
    cid: ($) => /[A-Z][a-zA-Z_0-9-]*/,
    id: ($) => /[a-z_][a-zA-Z_0-9-]*/,
    integer: ($) => /-?[0-9]+/,
    float: ($) => /-?[0-9]*\.[0-9]+/,
    sep: ($) => "::",
    string: ($) => /("([^"\\\n]|\\.)*")|('([^'\\\n]|\\.)*')/,
    fstring: ($) => /(f"([^"\\\n]|\\.)*")|(f'([^'\\\n]|\\.)*')/,
    rstring: ($) => /(r"([^"\\\n]|\\.)*")|(r'([^'\\\n]|\\.)*')/,
    mls: ($) => /"{3,5}([^"]|"[^"]|""[^"])*"{3,5}/,
    cmp_op: ($) => choice("==", "!=", "<=", ">=", "<", ">"),
    rel: ($) => choice("--", "->", "<-"),
    peq: ($) => "+=",
    double_star: ($) => "**",
    plus_op: ($) => "+",
    minus_op: ($) => "-",
    division_op: ($) => "/",
    mod_op: ($) => "%",
    regex: ($) => /matching\s+\/([^\/\\\n]|\\.)+\//,

    // ── Keyword terminals ──────────────────────────────────────────────────
    // Note: dict_kw removed — dict is now part of attr_type_builtin
    and_kw: ($) => "and",
    as_kw: ($) => "as",
    defined_kw: ($) => "defined",
    elif_kw: ($) => "elif",
    else_kw: ($) => "else",
    end_kw: ($) => "end",
    entity_kw: ($) => "entity",
    extends_kw: ($) => "extends",
    false_kw: ($) => "false",
    for_kw: ($) => "for",
    if_kw: ($) => "if",
    implement_kw: ($) => "implement",
    implementation_kw: ($) => "implementation",
    import_kw: ($) => "import",
    in_kw: ($) => "in",
    index_kw: ($) => "index",
    is_kw: ($) => "is",
    matching_kw: ($) => "matching",
    not_kw: ($) => "not",
    null_kw: ($) => "null",
    or_kw: ($) => "or",
    parents_kw: ($) => "parents",
    true_kw: ($) => "true",
    typedef_kw: ($) => "typedef",
    undef_kw: ($) => "undef",
    using_kw: ($) => "using",
    when_kw: ($) => "when",

    // ── Structural rules ───────────────────────────────────────────────────
    head: ($) => $.mls,
    empty: ($) => choice(),
    body: ($) => repeat1($.top_stmt),
    top_stmt: ($) =>
      choice(
        $.entity_def,
        $.implement_def,
        $.implementation_def,
        $.relation,
        $.statement,
        $.typedef_stmt,
        $.index_stmt,
        $.import_stmt,
      ),

    import_stmt: ($) =>
      choice(
        seq($.import_kw, $.ns_ref),
        seq($.import_kw, $.ns_ref, $.as_kw, $.id),
        seq($.import_kw, $.id, repeat(seq($.sep, $.id)), $.sep, $.cid),
        seq(
          $.import_kw,
          $.id,
          repeat(seq($.sep, $.id)),
          $.sep,
          $.cid,
          $.as_kw,
          $.id,
        ),
      ),

    statement: ($) => choice($.assign, $.for_stmt, $.if_stmt, $.expression),

    stmt_list: ($) => repeat1($.statement),

    assign: ($) =>
      choice(seq($.var_ref, "=", $.operand), seq($.var_ref, $.peq, $.operand)),

    for_stmt: ($) => seq($.for_kw, $.id, $.in_kw, $.operand, ":", $.block),

    if_stmt: ($) => seq($.if_kw, $.if_body, $.end_kw),

    if_body: ($) =>
      seq($.expression, ":", optional($.stmt_list), optional($.if_next)),

    if_next: ($) =>
      choice(
        seq($.else_kw, ":", optional($.stmt_list)),
        seq($.elif_kw, $.if_body),
      ),

    entity_def: ($) =>
      choice(
        seq($.entity_kw, $.cid, ":", $.entity_body_outer),
        seq($.entity_kw, $.id, ":", $.entity_body_outer),
        seq(
          $.entity_kw,
          $.cid,
          $.extends_kw,
          $.class_ref_list,
          ":",
          $.entity_body_outer,
        ),
        seq(
          $.entity_kw,
          $.id,
          $.extends_kw,
          $.class_ref_list,
          ":",
          $.entity_body_outer,
        ),
      ),

    entity_body_outer: ($) =>
      choice(
        seq($.mls, $.entity_body, $.end_kw),
        seq($.entity_body, $.end_kw),
        $.end_kw,
        seq($.mls, $.end_kw),
      ),

    entity_body: ($) => repeat1($.attr),

    // dict included here so it gets @type.builtin like the other primitives
    attr_type_builtin: ($) =>
      choice("string", "int", "float", "bool", "list", "number", "dict"),
    attr_base_type: ($) => choice($.attr_type_builtin, $.ns_ref),
    attr_type_multi: ($) => seq($.attr_base_type, "[", "]"),
    attr_type_opt: ($) =>
      choice(seq($.attr_type_multi, "?"), seq($.attr_base_type, "?")),
    attr_type: ($) =>
      choice($.attr_type_opt, $.attr_type_multi, $.attr_base_type),

    attr: ($) =>
      choice(
        seq($.attr_type, $.cid),
        seq($.attr_type, $.cid, "=", $.constant),
        seq($.attr_type, $.cid, "=", $.constant_list),
        seq($.attr_type, $.cid, "=", $.undef_kw),
        seq($.attr_type, $.id),
        seq($.attr_type, $.id, "=", $.constant),
        seq($.attr_type, $.id, "=", $.constant_list),
        seq($.attr_type, $.id, "=", $.undef_kw),
      ),

    implement_ns_list: ($) =>
      prec.left(
        seq(
          choice($.ns_ref, $.parents_kw),
          repeat(seq(",", choice($.ns_ref, $.parents_kw))),
        ),
      ),

    implement_def: ($) =>
      choice(
        seq($.implement_kw, $.class_ref, $.using_kw, $.implement_ns_list),
        seq(
          $.implement_kw,
          $.class_ref,
          $.using_kw,
          $.implement_ns_list,
          $.mls,
        ),
        seq(
          $.implement_kw,
          $.class_ref,
          $.using_kw,
          $.implement_ns_list,
          $.when_kw,
          $.expression,
        ),
        seq(
          $.implement_kw,
          $.class_ref,
          $.using_kw,
          $.implement_ns_list,
          $.when_kw,
          $.expression,
          $.mls,
        ),
      ),

    implementation_def: ($) =>
      seq(
        $.implementation_kw,
        $.id,
        $.for_kw,
        $.class_ref,
        $.implementation_body,
      ),

    implementation_body: ($) => seq($.implementation_head, $.block),
    implementation_head: ($) => choice(":", seq(":", $.mls)),
    block: ($) => seq(optional($.stmt_list), $.end_kw),

    relation: ($) => choice(seq($.relation_def, $.mls), $.relation_def),

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
        seq($.arity_open, $.integer, $.arity_close),
        seq($.arity_open, $.integer, ":", $.arity_close),
        seq($.arity_open, $.integer, ":", $.integer, $.arity_close),
        seq($.arity_open, ":", $.integer, $.arity_close),
      ),

    arity_open: ($) => "[",
    arity_close: ($) => "]",

    typedef_stmt: ($) => choice($.typedef_inner, seq($.typedef_inner, $.mls)),

    typedef_inner: ($) =>
      choice(
        seq($.typedef_kw, $.id, $.as_kw, $.ns_ref, $.matching_kw, $.expression),
        seq($.typedef_kw, $.id, $.as_kw, $.ns_ref, $.regex),
        seq($.typedef_kw, $.cid, $.as_kw, $.constructor),
      ),

    index_stmt: ($) => seq($.index_kw, $.class_ref, "(", $.id_list, ")"),

    expression: ($) =>
      prec.left(
        choice(
          $.boolean_expression,
          $.constant,
          $.function_call,
          $.var_ref,
          $.constructor,
          $.list_def,
          $.list_comprehension,
          $.map_def,
          $.map_lookup,
          $.index_lookup,
          $.conditional_expression,
          $.arithmetic_expression,
          seq("(", $.expression, ")"),
        ),
      ),

    boolean_expression: ($) =>
      prec.left(
        choice(
          prec.left(1, seq($.expression, $.cmp_op, $.expression)),
          prec.left(1, seq($.expression, $.in_kw, $.expression)),
          prec.left(1, seq($.expression, $.and_kw, $.expression)),
          prec.left(1, seq($.expression, $.or_kw, $.expression)),
          prec.left(1, seq($.expression, $.not_kw, $.in_kw, $.expression)),
          prec.left(1, seq($.not_kw, $.expression)),
          seq($.var_ref, ".", $.id, $.is_kw, $.defined_kw),
          seq($.id, $.is_kw, $.defined_kw),
          seq($.map_lookup, $.is_kw, $.defined_kw),
        ),
      ),

    arithmetic_expression: ($) =>
      prec.left(
        choice(
          prec.left(2, seq($.expression, $.plus_op, $.expression)),
          prec.left(2, seq($.expression, $.minus_op, $.expression)),
          prec.left(2, seq($.expression, $.division_op, $.expression)),
          prec.left(3, seq($.expression, "*", $.expression)),
          prec.left(3, seq($.expression, $.mod_op, $.expression)),
          prec.left(4, seq($.expression, $.double_star, $.expression)),
        ),
      ),

    operand: ($) => $.expression,

    map_lookup: ($) =>
      prec.left(
        seq(
          choice(
            seq($.attr_ref, $.lookup_open, $.operand, $.lookup_close),
            seq($.var_ref, $.lookup_open, $.operand, $.lookup_close),
          ),
          repeat(seq($.lookup_open, $.operand, $.lookup_close)),
        ),
      ),

    lookup_open: ($) => "[",
    lookup_close: ($) => "]",

    constructor: ($) =>
      seq($.class_ref, $.call_open, optional($.param_list), $.call_close),

    function_call: ($) =>
      choice(
        seq(
          $.ns_ref,
          $.call_open,
          optional($.function_param_list),
          $.call_close,
        ),
        seq(
          $.attr_ref,
          $.call_open,
          optional($.function_param_list),
          $.call_close,
        ),
      ),

    call_open: ($) => "(",
    call_close: ($) => ")",

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
        repeat(seq($.for_kw, $.id, $.in_kw, $.expression)),
        $.for_kw,
        $.id,
        $.in_kw,
        $.expression,
        optional($.list_comprehension_for_empty),
      ),

    list_comprehension_guard: ($) =>
      seq(
        repeat(seq($.if_kw, $.expression)),
        choice($.empty, seq($.if_kw, $.expression)),
      ),

    dict_key: ($) => choice($.rstring, $.string),

    pair_list: ($) =>
      prec.left(
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
      ),

    pair_list_empty: ($) => $.empty,
    map_def: ($) => seq($.dict_open, optional($.pair_list), $.dict_close),
    dict_open: ($) => "{",
    dict_close: ($) => "}",

    index_lookup: ($) =>
      choice(
        seq($.class_ref, $.lookup_open, optional($.param_list), $.lookup_close),
        seq($.attr_ref, $.lookup_open, optional($.param_list), $.lookup_close),
      ),

    conditional_expression: ($) =>
      prec.left(seq($.expression, "?", $.expression, ":", $.expression)),

    constant: ($) =>
      choice(
        $.integer,
        $.float,
        $.null_kw,
        $.regex,
        $.true_kw,
        $.false_kw,
        $.string,
        $.fstring,
        $.rstring,
        $.mls,
      ),

    constant_list: ($) => seq("[", optional($.constants), "]"),

    constants: ($) =>
      prec.left(
        seq(
          repeat(seq($.constant, ",")),
          choice($.constant, seq($.constant, ",")),
        ),
      ),

    wrapped_kwargs: ($) => seq($.double_star, $.operand),

    param_list_element: ($) =>
      choice(seq($.id, "=", $.operand), $.wrapped_kwargs),

    param_list: ($) =>
      prec.left(
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
      ),

    param_list_empty: ($) => $.empty,

    function_param_list_element: ($) => choice($.param_list_element, $.operand),

    function_param_list: ($) =>
      prec.left(
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
      ),

    function_param_list_empty: ($) => $.empty,

    operand_list: ($) =>
      prec.left(
        seq(
          repeat(seq($.operand, ",")),
          choice($.operand, $.empty, seq($.operand, ",")),
        ),
      ),

    var_ref: ($) => prec.left(choice($.attr_ref, $.ns_ref)),

    attr_ref: ($) => prec.left(seq($.var_ref, ".", $.id)),

    class_ref: ($) =>
      prec.left(
        choice(
          $.cid,
          seq($.id, repeat(seq($.sep, $.id)), $.sep, $.cid),
          seq($.var_ref, ".", $.cid),
        ),
      ),

    class_ref_list: ($) =>
      prec.left(
        seq(
          repeat(choice(seq($.class_ref, ","), seq($.var_ref, ","))),
          choice($.class_ref, $.var_ref),
        ),
      ),

    ns_ref: ($) => prec.left(seq($.id, repeat(seq($.sep, $.id)))),

    id_list: ($) => seq(repeat(seq($.id, ",")), $.id),
  },
});
