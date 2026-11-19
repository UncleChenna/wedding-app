import Image from "next/image";
import front from "../assets/card/front.png";
import back from "../assets/card/details.png";
import { formatCardNumber, printedCard, type PrintedCardDetails } from "../lib/printed-card";

/** Original artwork is not recoloured by website themes. Text below is accessible at mobile sizes. */
export function PrintedInvitationCard({
  card,
  replyHref = "#reply",
  dressCode,
}: {
  card: PrintedCardDetails;
  replyHref?: string;
  dressCode?: string | null;
}) {
  return (
    <section aria-label="Your invitation card" className="mx-auto max-w-3xl">
      <div
        className="space-y-6"
        style={{ color: printedCard.ink, backgroundColor: printedCard.paper }}
      >
        <Image
          src={front}
          alt="Uchenna and Adaora, together with their families. Original floral invitation cover."
          unoptimized
          sizes="(min-width: 768px) 768px, 100vw"
          priority
          className="h-auto w-full"
        />
        <div className="relative" style={{ containerType: "inline-size" }}>
          <Image
            src={back}
            loading="eager"
            alt="Wedding ceremony and reception details; readable details follow below."
            unoptimized
            sizes="(min-width: 768px) 768px, 100vw"
            className="h-auto w-full"
          />
          <div
            aria-hidden="true"
            className="absolute"
            style={{
              left: "9%",
              top: "2.6%",
              width: "43%",
              height: "4%",
              backgroundColor: printedCard.paper,
              fontSize: "3.2cqw",
              letterSpacing: ".12em",
              paddingLeft: "1%",
            }}
          >
            {formatCardNumber(card.cardNumber)}
          </div>
          <div
            aria-hidden="true"
            className="absolute flex flex-col items-center justify-center text-center uppercase"
            style={{
              left: "36%",
              top: "84.6%",
              width: "51%",
              height: "6.4%",
              backgroundColor: printedCard.paper,
              fontSize: "1.45cqw",
              lineHeight: 1.35,
              letterSpacing: ".05em",
            }}
          >
            <span>
              This invitation admits up to {card.capacity}{" "}
              {card.capacity === 1 ? "guest" : "guests"}.
            </span>
            <span>Kindly RSVP online by {printedCard.replyBy}.</span>
            <span>Use your personal invitation to reserve your table.</span>
          </div>
        </div>
      </div>
      <div className="mt-8 space-y-6 text-left text-lg leading-relaxed">
        <p className="wrap-anywhere">
          For {card.guestName} · Card {formatCardNumber(card.cardNumber)}
        </p>
        <dl className="space-y-6">
          <div>
            <dt className="font-medium">The day</dt>
            <dd>{printedCard.date}</dd>
          </div>
          <div>
            <dt className="font-medium">Church wedding</dt>
            <dd>{printedCard.ceremony}</dd>
          </div>
          <div>
            <dt className="font-medium">Reception</dt>
            <dd>{printedCard.reception}</dd>
          </div>
        </dl>
        {dressCode && <p>Dress code: {dressCode}</p>}
        <nav aria-label="Wedding venue maps" className="flex flex-wrap gap-x-6 gap-y-2">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("St Paul’s Anglican Church, Apo Resettlement, Abuja")}`}
            rel="noreferrer"
            className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
          >
            View ceremony venue
          </a>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Fineworld Recreational Park Events Gardens Apo Resettlement Abuja")}`}
            rel="noreferrer"
            className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
          >
            View reception venue
          </a>
        </nav>
        <p>
          Invited party: up to {card.capacity} {card.capacity === 1 ? "guest" : "guests"}. Kindly
          reply by {printedCard.replyBy}.
        </p>
        <a
          href={replyHref}
          className="inline-flex min-h-11 min-w-11 items-center text-primary underline underline-offset-4"
        >
          RSVP online
        </a>
      </div>
    </section>
  );
}
