export interface SearchableGuest {
  invitationId: string;
  name: string;
  names: readonly string[];
}
export interface GuestNameMatch {
  invitationId: string;
  name: string;
  matchedName: string;
}

function normalized(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** One insertion/deletion/substitution, bounded by the short query and name tokens. */
function oneEdit(left: string, right: string): boolean {
  if (Math.abs(left.length - right.length) > 1) return false;
  let i = 0,
    j = 0,
    edits = 0;
  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (left.length <= right.length) j++;
    if (left.length >= right.length) i++;
  }
  return edits + Number(i < left.length || j < right.length) <= 1;
}

/** No directory-on-empty behavior; returns a minimal projection, never complete cache rows. */
export function searchGuestNames<T extends SearchableGuest>(
  rows: readonly T[],
  query: string,
): { matches: GuestNameMatch[]; hasMore: boolean } {
  const clean = normalized(query);
  if (query.length > 200 || /[\p{Cc}\p{Cf}]/u.test(query) || clean.length < 2)
    return { matches: [], hasMore: false };
  const tokens = clean.split(" ");
  const matches: { match: GuestNameMatch; rank: number }[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.invitationId)) continue;
    let best: { name: string; rank: number } | undefined;
    for (const name of [...row.names, row.name]) {
      const words = normalized(name).split(" ");
      let rank = 0;
      for (const token of tokens) {
        if (words.includes(token)) continue;
        if (words.some((word) => word.startsWith(token))) {
          rank += 1;
          continue;
        }
        if (token.length >= 4 && words.some((word) => word.length >= 4 && oneEdit(token, word))) {
          rank += 2;
          continue;
        }
        rank = Infinity;
        break;
      }
      if (Number.isFinite(rank) && (!best || rank < best.rank)) best = { name, rank };
    }
    if (best) {
      seen.add(row.invitationId);
      matches.push({
        rank: best.rank,
        match: { invitationId: row.invitationId, name: row.name, matchedName: best.name },
      });
    }
  }
  matches.sort(
    (a, b) =>
      a.rank - b.rank ||
      a.match.name.localeCompare(b.match.name) ||
      a.match.invitationId.localeCompare(b.match.invitationId),
  );
  return { matches: matches.slice(0, 10).map(({ match }) => match), hasMore: matches.length > 10 };
}
