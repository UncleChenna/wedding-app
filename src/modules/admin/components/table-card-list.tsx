import { QrCode } from "@/modules/shared/components/ui/qr-code";
import type { TableCard, TableCardWifi } from "../lib/table-cards";

/** The printable cards (TICKET-094): table number, the shared order QR and the venue Wi-Fi. */
export function TableCardList({
  cards,
  orderUrl,
  wifi,
}: {
  cards: TableCard[];
  orderUrl: string;
  wifi: TableCardWifi | null;
}) {
  return (
    <ul className="table-cards grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-6">
      {cards.map((card) => (
        <li
          key={card.number}
          className="table-card flex flex-col items-center gap-4 rounded-lg border border-border bg-surface p-6 text-center text-foreground"
        >
          <h2 className="flex flex-col items-center">
            <span className="text-sm tracking-[0.12em] uppercase">Table</span>{" "}
            <span className="font-display text-6xl leading-none">{card.number}</span>
          </h2>
          {card.name ? <p className="font-display text-2xl">{card.name}</p> : null}
          <QrCode
            value={orderUrl}
            label={`Scan to order food and drinks at table ${card.number}`}
            className="table-card-qr max-w-48"
          />
          <p className="text-base">
            Scan to order food and drinks, then choose table {card.number}.
          </p>
          {wifi ? (
            <dl className="table-card-wifi grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-left text-base">
              <dt className="text-sm tracking-[0.12em] uppercase">Wi-Fi</dt>
              <dd className="font-medium [overflow-wrap:anywhere]">{wifi.name}</dd>
              {wifi.password ? (
                <>
                  <dt className="text-sm tracking-[0.12em] uppercase">Password</dt>
                  <dd className="font-medium [overflow-wrap:anywhere]">{wifi.password}</dd>
                </>
              ) : null}
            </dl>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
