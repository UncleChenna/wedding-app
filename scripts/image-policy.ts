import ts from "typescript";

type ImageNode = ts.JsxSelfClosingElement | ts.JsxOpeningElement;

function attributes(node: ImageNode) {
  return new Map(
    node.attributes.properties
      .filter(ts.isJsxAttribute)
      .map((attribute) => [attribute.name.getText(), attribute.initializer] as const),
  );
}

function literal(value: ts.JsxAttributeValue | undefined): string | undefined {
  if (!value) return undefined;
  if (ts.isStringLiteral(value)) return value.text;
  if (ts.isJsxExpression(value) && value.expression && ts.isStringLiteral(value.expression))
    return value.expression.text;
  return undefined;
}

function hasValue(value: ts.JsxAttributeValue | undefined): boolean {
  if (!value) return false;
  if (ts.isStringLiteral(value)) return value.text.trim().length > 0;
  if (!ts.isJsxExpression(value) || !value.expression) return false;
  const expression = value.expression;
  if (ts.isStringLiteral(expression)) return expression.text.trim().length > 0;
  if (ts.isNumericLiteral(expression)) return Number(expression.text) > 0;
  if (
    [ts.SyntaxKind.NullKeyword, ts.SyntaxKind.FalseKeyword, ts.SyntaxKind.TrueKeyword].includes(
      expression.kind,
    )
  )
    return false;
  return !(ts.isIdentifier(expression) && expression.text === "undefined");
}

function reservedFillParent(node: ImageNode): boolean {
  const parent = ts.isJsxOpeningElement(node) ? node.parent.parent : node.parent;
  if (!ts.isJsxElement(parent)) return false;
  const className = literal(attributes(parent.openingElement).get("className")) ?? "";
  return (
    /(?:^|\s)(?:relative|absolute|fixed)(?:\s|$)/.test(className) &&
    /(?:^|\s|:)aspect-(?:\[|video|square)/.test(className)
  );
}

/** Audit explicit next/image contracts. Dynamic prop values still require browser verification. */
export function imagePolicyProblems(source: string, rasterRenderer = false): string[] {
  const file = ts.createSourceFile(
    "image-policy.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const images = new Set<string>();
  const staticImages = new Set<string>();
  for (const statement of file.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier))
      continue;
    const name = statement.importClause?.name?.text;
    if (statement.moduleSpecifier.text === "next/image") {
      if (name) images.add(name);
      const bindings = statement.importClause?.namedBindings;
      if (bindings && ts.isNamespaceImport(bindings)) images.add(`${bindings.name.text}.default`);
      if (bindings && ts.isNamedImports(bindings)) {
        for (const item of bindings.elements) {
          if (item.propertyName?.text === "default") images.add(item.name.text);
        }
      }
    }
    if (!name) continue;
    if (/\.(?:png|jpe?g|webp|avif)$/i.test(statement.moduleSpecifier.text)) staticImages.add(name);
  }
  const problems: string[] = [];
  function visit(node: ts.Node) {
    if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
      const tag = node.tagName.getText(file);
      if (tag === "img" && !rasterRenderer) problems.push("raw <img> must use next/image");
      if (images.has(tag)) {
        const props = attributes(node);
        const sourceValue = props.get("src");
        const isStatic = Boolean(
          sourceValue &&
          ts.isJsxExpression(sourceValue) &&
          sourceValue.expression &&
          ts.isIdentifier(sourceValue.expression) &&
          staticImages.has(sourceValue.expression.text),
        );
        const fillValue = props.get("fill");
        const fills =
          props.has("fill") &&
          (!fillValue ||
            (ts.isJsxExpression(fillValue) &&
              fillValue.expression?.kind === ts.SyntaxKind.TrueKeyword));
        if (node.attributes.properties.some(ts.isJsxSpreadAttribute))
          problems.push(
            "image prop spread requires explicit review; declare image contracts directly",
          );
        if (!hasValue(props.get("sizes"))) problems.push("image requires nonempty sizes");
        if (!props.has("alt") || !props.get("alt"))
          problems.push("image requires explicit alt (empty is allowed for decorative images)");
        if (!isStatic && !fills && !(hasValue(props.get("width")) && hasValue(props.get("height"))))
          problems.push("image requires dimensions, a static import, or reserved fill");
        if (fills && !reservedFillParent(node))
          problems.push(
            "fill image requires a reserved positioned parent with an explicit aspect ratio",
          );
        if (literal(props.get("placeholder")) !== "blur")
          problems.push("photograph requires placeholder=blur");
        if (!isStatic && !hasValue(props.get("blurDataURL")))
          problems.push("dynamic photograph requires blurDataURL");
        if (props.has("unoptimized"))
          problems.push("unoptimized photographs require a separate reviewed delivery contract");
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return problems;
}
