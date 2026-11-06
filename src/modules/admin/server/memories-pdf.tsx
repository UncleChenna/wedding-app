import "server-only";
import { resolve } from "node:path";
import { Document, Font, Page, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { FONT_KEYS, type Theme } from "@/modules/theming/lib/schema";
import { parseMemories } from "../lib/memories";

// Use the same pinned local static font instances as the invitation PDF.
for (const key of FONT_KEYS) {
  Font.register({
    family: key,
    src: resolve(process.cwd(), "src/modules/invitations/fonts", `${key}.ttf`),
  });
}

/** Internal renderer; the download boundary must authorize the admin before querying aggregates. */
export async function renderMemoriesPdf(input: unknown, theme: Theme) {
  const data = parseMemories(input);
  const totals = [
    ["Invited households", data.invitations],
    ["Accepted invitations", data.repliedYes],
    ["Declined invitations", data.repliedNo],
    ["Expected guests", data.attending],
    ["Recorded admissions", data.admissions],
  ] as const;
  return renderToBuffer(
    <Document title="Our celebration in numbers" language="en-GB">
      <Page
        size="A4"
        wrap
        style={{
          padding: 42,
          paddingBottom: 58,
          backgroundColor: theme.colors.background,
          color: theme.colors.foreground,
          fontFamily: theme.fonts.body,
          fontSize: 12,
          lineHeight: 1.6,
        }}
      >
        <Text style={{ fontFamily: theme.fonts.display, fontSize: 30, marginBottom: 20 }}>
          Our celebration in numbers
        </Text>
        <Text style={{ marginBottom: 24 }}>A little keepsake of the day we shared.</Text>
        {totals.map(([label, count]) => (
          <View key={label} wrap={false} style={{ flexDirection: "row", marginBottom: 10 }}>
            <Text style={{ flexGrow: 1 }}>{label}</Text>
            <Text>{count}</Text>
          </View>
        ))}
        <Text
          minPresenceAhead={60}
          style={{
            fontFamily: theme.fonts.display,
            fontSize: 24,
            marginTop: 24,
            marginBottom: 12,
          }}
        >
          At the table
        </Text>
        {data.menu.length === 0 ? (
          <Text>No menu orders were recorded.</Text>
        ) : (
          data.menu.map((item, index) => (
            <View key={index} wrap={false} style={{ marginBottom: 14 }}>
              <Text>{item.name}</Text>
              <Text>
                {item.ordered} ordered · {item.served} served
              </Text>
            </View>
          ))
        )}
        <View
          fixed
          style={{
            position: "absolute",
            bottom: 24,
            left: 42,
            right: 42,
            height: 16,
          }}
          render={(page) => {
            // The layout supplies the total only on its final pagination pass.
            const total = "totalPages" in page ? page.totalPages : undefined;
            return (
              <Text style={{ fontSize: 10, lineHeight: 1.2, textAlign: "center" }}>
                {typeof total === "number"
                  ? `${page.pageNumber} / ${total}`
                  : String(page.pageNumber)}
              </Text>
            );
          }}
        />
      </Page>
    </Document>,
  );
}
