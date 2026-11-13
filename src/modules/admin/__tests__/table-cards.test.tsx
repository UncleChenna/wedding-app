// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import jsQR from "jsqr";
import { describe, expect, it } from "vitest";
import { TableCardList } from "../components/table-card-list";
import { buildTableCards, orderUrl, wifiDetails } from "../lib/table-cards";

const SITE = "https://uchenna-and-adaora.example.com";

describe("buildTableCards", () => {
  it("makes one card per table, in table-number order", () => {
    const cards = buildTableCards([
      { number: 12, name: null },
      { number: 1, name: "Family" },
      { number: 3, name: "  " },
    ]);
    expect(cards.map((card) => card.number)).toEqual([1, 3, 12]);
    expect(cards.map((card) => card.name)).toEqual(["Family", null, null]);
  });

  it("makes no cards when there are no tables", () => {
    expect(buildTableCards([])).toEqual([]);
  });
});

describe("orderUrl", () => {
  it("points at the shared /order page on the site", () => {
    expect(orderUrl(SITE)).toBe(`${SITE}/order`);
    expect(orderUrl(`${SITE}/`)).toBe(`${SITE}/order`);
  });
});

describe("wifiDetails", () => {
  it("needs a network name before printing anything", () => {
    expect(wifiDetails({ wifiName: null, wifiPassword: "wedding-guests" })).toBeNull();
    expect(wifiDetails({ wifiName: "Venue Guest", wifiPassword: null })).toEqual({
      name: "Venue Guest",
      password: null,
    });
  });
});

/** Rasterise the rendered SVG's own geometry, 4px per module, as a printed card would show it. */
function decodeRenderedQr(svg: SVGElement) {
  const side = Number(svg.getAttribute("viewBox")?.split(" ")[2]);
  const scale = 4;
  const dark = new Set(
    [...(svg.querySelector("path")?.getAttribute("d") ?? "").matchAll(/M(\d+) (\d+)/g)].map(
      (m) => `${m[1]},${m[2]}`,
    ),
  );
  const width = side * scale;
  const pixels = new Uint8ClampedArray(width * width * 4);
  for (let y = 0; y < width; y++) {
    for (let x = 0; x < width; x++) {
      const value = dark.has(`${Math.floor(x / scale)},${Math.floor(y / scale)}`) ? 0 : 255;
      pixels.set([value, value, value, 255], (y * width + x) * 4);
    }
  }
  return jsQR(pixels, width, width, { inversionAttempts: "dontInvert" })?.data;
}

describe("TableCardList", () => {
  const cards = buildTableCards([
    { number: 2, name: null },
    { number: 1, name: "Family" },
  ]);

  it("prints every table's number and the Wi-Fi details", () => {
    render(
      <TableCardList
        cards={cards}
        orderUrl={orderUrl(SITE)}
        wifi={{ name: "Venue Guest", password: "wedding 2026" }}
      />,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getAllByRole("heading").map((h) => h.textContent)).toEqual([
      "Table 1",
      "Table 2",
    ]);
    expect(screen.getByText("Family")).toBeVisible();
    expect(screen.getAllByText("Venue Guest")).toHaveLength(2);
    expect(screen.getAllByText("wedding 2026")).toHaveLength(2);
  });

  it("puts a QR on each card that decodes to the /order page", () => {
    render(<TableCardList cards={cards} orderUrl={orderUrl(SITE)} wifi={null} />);
    const codes = screen.getAllByRole("img", { name: /scan to order/i });
    expect(codes).toHaveLength(2);
    for (const code of codes) {
      expect(decodeRenderedQr(code as unknown as SVGElement)).toBe(`${SITE}/order`);
    }
  });

  it("leaves the Wi-Fi section off when it isn't set", () => {
    render(<TableCardList cards={cards} orderUrl={orderUrl(SITE)} wifi={null} />);
    expect(screen.queryByText(/wi-fi/i)).toBeNull();
  });
});
