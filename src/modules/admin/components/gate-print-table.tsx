import type { GatePrintRow } from "@/modules/checkin/lib/gate-print";
import styles from "./gate-print.module.css";
export function GatePrintTable({ rows }: { rows: readonly GatePrintRow[] }) {
  return (
    <table className={styles.table}>
      <caption className="sr-only">Confirmed invitations and admission totals</caption>
      <thead>
        <tr>
          <th scope="col">Guests</th>
          <th scope="col">Party</th>
          <th scope="col">Table</th>
          <th scope="col">Admitted</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>
              <ul>
                {row.names.map((name, index) => (
                  <li key={index}>{name}</li>
                ))}
              </ul>
              {row.householdName && !row.names.includes(row.householdName) ? (
                <p className="mt-2">{row.householdName}</p>
              ) : null}
            </td>
            <td>{row.partySize ?? "Check reply"}</td>
            <td>{row.tableNumber ?? "Not seated"}</td>
            <td>
              <p>{row.admittedPeople} so far</p>
              {row.partySize === null ? (
                <p>Confirm allowance before admission.</p>
              ) : (
                <>
                  <div aria-hidden="true">
                    {row.marks.map((checked, index) => (
                      <span key={index} className={styles.box}>
                        {checked ? "✓" : ""}
                      </span>
                    ))}
                  </div>
                  <p>{row.remaining} remaining</p>
                  {row.marks.length === 0 && row.partySize > 0 ? <p>New total: _____</p> : null}
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
