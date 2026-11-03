import "server-only";
import { resolve } from "node:path";
import {
  Document,
  Font,
  Page,
  Path,
  Rect,
  Svg,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { PassView } from "@/modules/checkin/lib/pass-eligibility";
import type { EventSettings } from "@/modules/shared/lib/event-settings";
import { qrMatrix, qrPathData, qrViewBoxSize } from "@/modules/shared/lib/qr";
import type { Theme } from "@/modules/theming/lib/schema";
import { FONT_KEYS } from "@/modules/theming/lib/schema";
import { ceremonyLabel, eventDateLabel } from "../lib/event-summary";
import { invitationSiteCopy } from "../lib/copy";

// Static instances are generated from the same pinned sources as the web fonts.
for (const key of FONT_KEYS) {
  Font.register({
    family: key,
    src: resolve(process.cwd(), "src/modules/invitations/fonts", key + ".ttf"),
  });
}

export type InvitationPdfInput = {
  details: EventSettings;
  theme: Theme;
  pass: PassView;
  passUrl: string;
};

/** The input contains only a read-only entry credential, never the invitation editing token. */
export async function renderInvitationPdf({ details, theme, pass, passUrl }: InvitationPdfInput) {
  const matrix = qrMatrix(passUrl);
  const side = qrViewBoxSize(matrix);
  const name = pass.names.join(" & ") || pass.householdName || "Our dear guest";
  return renderToBuffer(
    <Document
      title="Your wedding invitation"
      subject={`Theme: ${theme.id}; display: ${theme.fonts.display}; body: ${theme.fonts.body}; colours: ${theme.colors.background}, ${theme.colors.foreground}, ${theme.colors.primary}, ${theme.colors["qr-ink"]}, ${theme.colors["qr-paper"]}`}
      author={details.coupleNames.join(" & ")}
      language="en-GB"
    >
      <Page
        size="A5"
        style={{
          padding: 30,
          backgroundColor: theme.colors.background,
          color: theme.colors.foreground,
          fontFamily: theme.fonts.body,
          fontSize: 12,
          lineHeight: 1.5,
        }}
      >
        <Text style={{ color: theme.colors.primary, fontSize: 10, letterSpacing: 1.2 }}>
          THE CELEBRATION
        </Text>
        <Text
          style={{ fontFamily: theme.fonts.display, fontSize: 32, lineHeight: 1.1, marginTop: 12 }}
        >
          {details.coupleNames.join(" & ")}
        </Text>
        <Text style={{ marginTop: 12 }}>{invitationSiteCopy.subline}</Text>
        <View style={{ marginTop: 18 }}>
          <Text>{eventDateLabel(details.eventDate)}</Text>
          <Text>{ceremonyLabel(details.ceremonyTime, details.timeZone)}</Text>
          <Text>{details.venue ?? "Venue to follow"}</Text>
          <Text>Dress code: {details.dressCode ?? "To follow"}</Text>
        </View>
        <View style={{ marginTop: 18 }}>
          <Text style={{ color: theme.colors.primary, fontSize: 10, letterSpacing: 1.2 }}>
            YOUR ENTRY PASS
          </Text>
          <Text
            style={{ fontFamily: theme.fonts.display, fontSize: 22, lineHeight: 1.2, marginTop: 8 }}
          >
            {name}
          </Text>
          <View wrap={false}>
            <Text style={{ marginTop: 8 }}>{invitationSiteCopy.qrPass}</Text>
            <Svg
              width={144}
              height={144}
              viewBox={`0 0 ${side} ${side}`}
              style={{ marginTop: 12, alignSelf: "center" }}
            >
              <Rect x={0} y={0} width={side} height={side} fill={theme.colors["qr-paper"]} />
              <Path d={qrPathData(matrix)} fill={theme.colors["qr-ink"]} />
            </Svg>
            <Text style={{ marginTop: 8, textAlign: "center" }}>
              Admits {pass.partySize} {pass.partySize === 1 ? "guest" : "guests"} · Table{" "}
              {pass.tableNumber ?? "to follow"}
            </Text>
          </View>
        </View>
      </Page>
    </Document>,
  );
}
