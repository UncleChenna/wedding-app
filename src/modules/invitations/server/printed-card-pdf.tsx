import "server-only";
import { resolve } from "node:path";
import {
  Document,
  Font,
  Image as PdfImage,
  Link,
  Page,
  Path,
  Rect,
  Svg,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { qrMatrix, qrPathData, qrViewBoxSize } from "@/modules/shared/lib/qr";
import { formatCardNumber, printedCard, type PrintedCardDetails } from "../lib/printed-card";

Font.register({
  family: "CardBody",
  src: resolve(process.cwd(), "src/modules/invitations/fonts/Inter.ttf"),
});
const width = 419.25;
const height = 590.3;
const asset = (name: string) => resolve(process.cwd(), "src/modules/invitations/assets/card", name);

/** RSVP card contains a private editing link. It is never used as an admission credential. */
export async function renderPrintedCard(card: PrintedCardDetails & { rsvpUrl: string }) {
  const url = new URL(card.rsvpUrl);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    !/^\/i\/[A-Za-z0-9_-]{22,}$/.test(url.pathname) ||
    url.username ||
    url.password
  )
    throw new Error("Invalid invitation destination");
  const matrix = qrMatrix(url.href);
  const side = qrViewBoxSize(matrix);
  const page = {
    backgroundColor: printedCard.paper,
    color: printedCard.ink,
    fontFamily: "CardBody",
  };
  return renderToBuffer(
    <Document
      title={`Invitation card ${formatCardNumber(card.cardNumber)}`}
      author={printedCard.names}
      language="en-GB"
    >
      <Page size={[width, height]} style={page}>
        <PdfImage src={asset("front.png")} style={{ width, height }} />
      </Page>
      <Page size={[width, height]} style={page}>
        <PdfImage src={asset("details.png")} style={{ width, height }} />
        <View
          style={{
            position: "absolute",
            left: width * 0.09,
            top: height * 0.026,
            width: width * 0.43,
            height: height * 0.04,
            backgroundColor: printedCard.paper,
            paddingLeft: 3,
          }}
        >
          <Text style={{ fontSize: 13.4, letterSpacing: 1.2 }}>
            {formatCardNumber(card.cardNumber)}
          </Text>
        </View>
        <View
          style={{
            position: "absolute",
            left: width * 0.36,
            top: height * 0.846,
            width: width * 0.51,
            height: height * 0.064,
            backgroundColor: printedCard.paper,
            justifyContent: "center",
            textAlign: "center",
            fontSize: 6.2,
            lineHeight: 1.4,
          }}
        >
          <Text>
            THIS INVITATION ADMITS UP TO {card.capacity} {card.capacity === 1 ? "GUEST" : "GUESTS"}.
          </Text>
          <Text>KINDLY RSVP ONLINE BY 17 DECEMBER 2026.</Text>
          <Link src={url.href} style={{ color: printedCard.ink }}>
            CLICK TO RSVP OR SCAN THE CODE ON THE NEXT PAGE.
          </Link>
        </View>
      </Page>
      <Page size={[width, height]} style={{ ...page, padding: 28, fontSize: 11, lineHeight: 1.5 }}>
        <Text style={{ fontSize: 20 }}>Your reply</Text>
        <Text style={{ marginTop: 16 }}>{card.guestName}</Text>
        <Text>
          Card {formatCardNumber(card.cardNumber)} · Up to {card.capacity}{" "}
          {card.capacity === 1 ? "guest" : "guests"}
        </Text>
        <Text style={{ marginTop: 16 }}>Kindly reply by {printedCard.replyBy}.</Text>
        <Text style={{ marginTop: 8 }}>Scan to open your personal invitation and RSVP.</Text>
        <Svg
          width={160}
          height={160}
          viewBox={`0 0 ${side} ${side}`}
          style={{ alignSelf: "center", marginTop: 18 }}
        >
          <Rect x={0} y={0} width={side} height={side} fill={printedCard.paper} />
          <Path d={qrPathData(matrix)} fill={printedCard.qrInk} />
        </Svg>
        <Link src={url.href} style={{ marginTop: 16, textAlign: "center", color: printedCard.ink }}>
          Open your invitation and RSVP
        </Link>
        <Text style={{ marginTop: 12, fontSize: 9 }}>
          Keep this personal link private. This is your RSVP code, not your entry pass. Your entry
          pass is available after you confirm attendance.
        </Text>
      </Page>
    </Document>,
  );
}
