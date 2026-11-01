const PUBLIC_NAMES = new Set([
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
]);
function property(node) {
  if (!node.computed && node.property.type === "Identifier") return node.property.name;
  if (node.computed && node.property.type === "Literal") return node.property.value;
  return null;
}
function isProcess(node) {
  return (
    (node.type === "Identifier" && node.name === "process") ||
    (node.type === "MemberExpression" &&
      node.object.type === "Identifier" &&
      node.object.name === "globalThis" &&
      property(node) === "process")
  );
}
export const environmentBoundary = {
  meta: {
    type: "problem",
    schema: [],
    messages: {
      boundary:
        "Read private environment values only in a server-only module. Public reads must use an approved literal NEXT_PUBLIC name; do not alias process or its environment.",
    },
  },
  create(context) {
    const path = context.filename.replaceAll(String.fromCharCode(92), "/");
    let privateAccess = false;
    const report = (node) => context.report({ node, messageId: "boundary" });
    return {
      Program(node) {
        const client = node.body.some(
          (n) => n.type === "ExpressionStatement" && n.directive === "use client",
        );
        const poisoned = node.body.some(
          (n) => n.type === "ImportDeclaration" && n.source.value === "server-only",
        );
        privateAccess = !client && (poisoned || path.endsWith("/src/instrumentation.ts"));
      },
      ImportDeclaration(node) {
        if (!privateAccess && ["process", "node:process"].includes(node.source.value)) report(node);
      },
      Identifier(node) {
        if (node.name !== "process" || privateAccess) return;
        const parent = node.parent;
        if (
          parent.type === "MemberExpression" &&
          parent.object === node &&
          property(parent) === "env"
        )
          return;
        if (parent.type === "UnaryExpression" && parent.operator === "typeof") return;
        if (parent.type === "MemberExpression" && parent.property === node && !parent.computed)
          return;
        report(node);
      },
      CallExpression(node) {
        if (
          !privateAccess &&
          node.callee.type === "Identifier" &&
          node.callee.name === "require" &&
          node.arguments[0]?.type === "Literal" &&
          ["process", "node:process"].includes(node.arguments[0].value)
        )
          report(node);
      },
      MemberExpression(node) {
        if (!privateAccess && property(node) === "process" && !isProcess(node)) report(node);
        if (property(node) !== "env" || !isProcess(node.object)) return;
        const access = node.parent;
        const name =
          access.type === "MemberExpression" && access.object === node ? property(access) : null;
        if (
          typeof name === "string" &&
          name.startsWith("NEXT_PUBLIC_") &&
          !PUBLIC_NAMES.has(name)
        ) {
          report(node);
          return;
        }
        if (privateAccess) return;
        if (PUBLIC_NAMES.has(name) || name === "NODE_ENV") return;
        if (name === "LOG_LEVEL" && path.endsWith("/src/modules/shared/lib/logger.ts")) return;
        report(node);
      },
    };
  },
};
