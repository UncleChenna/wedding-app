import { describe, expect, it } from "vitest";
import { getActiveThemes } from "@/modules/theming/lib/registry";
import { orderDocument } from "../server/order-document";

describe("small ordering document", () => {
  it("renders an accessible table form without a framework bootstrap", () => {
    const html = orderDocument({
      themes: getActiveThemes(),
      script: "/order-assets/order-test.js",
      stylesheet: "/order-assets/order-test.css",
      selection: { kind: "form", value: "", notice: "" },
    });
    expect(html).toContain('action="/order"');
    expect(html).toContain('method="post"');
    expect(html).toContain('for="order-table"');
    expect(html).not.toContain("/_next/");
  });
  it("escapes table values and errors as text", () => {
    const html = orderDocument({
      themes: getActiveThemes(),
      script: "/order-assets/order-test.js",
      stylesheet: "/order-assets/order-test.css",
      selection: { kind: "form", value: '\"><script>alert(1)</script>', notice: "<img src=x>" },
    });
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;img src=x&gt;");
  });
});
