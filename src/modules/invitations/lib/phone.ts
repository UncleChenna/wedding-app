export type PhoneResult =
  { ok: true; phone: string } | { ok: false; error: { code: "INVALID_PHONE"; message: string } };

function invalidPhone(): PhoneResult {
  return {
    ok: false,
    error: {
      code: "INVALID_PHONE",
      message: "Enter a full phone number, including the country code for numbers outside the UK.",
    },
  };
}

/**
 * Normalise ordinary contact numbers for sharing. UK is the only default country.
 * Checks structure, not allocation, ownership, reachability or WhatsApp membership.
 * International contact numbers must contain 7–15 digits; shorter service codes
 * and extensions are not supported. Non-UK national formats need a country code.
 */
export function normalisePhone(input: unknown): PhoneResult {
  if (typeof input !== "string" || input.length > 200 || /[\r\n\t]/.test(input)) {
    return invalidPhone();
  }

  const presented = input.trim();
  // Parentheses must enclose digits, without nesting. Never silently strip letters,
  // extensions, embedded plus signs or arbitrary punctuation into a different number.
  if (!/^\+?(?:[0-9 .\u00a0-]|\([0-9]+\))+$/.test(presented)) {
    return invalidPhone();
  }

  const withoutOptionalTrunk = presented.replace(/^(\+44|0044)[ \u00a0]*\(0\)/, "$1");
  const compact = withoutOptionalTrunk.replace(/[ .\u00a0()\-]/g, "");
  let digits: string;
  if (compact.startsWith("+")) {
    digits = compact.slice(1);
  } else if (compact.startsWith("00")) {
    digits = compact.slice(2);
  } else if (compact.startsWith("0")) {
    digits = "44" + compact.slice(1);
  } else if (compact.startsWith("44")) {
    digits = compact;
  } else {
    return invalidPhone();
  }

  if (!/^[1-9][0-9]{6,14}$/.test(digits)) return invalidPhone();

  if (digits.startsWith("44")) {
    const national = digits.slice(2);
    // Ordinary UK numbers have ten national digits; some geographic numbers
    // beginning 1 have nine. A trunk zero after +44 is never significant.
    if (!/^(?:[1-9][0-9]{9}|1[0-9]{8})$/.test(national)) return invalidPhone();
  }

  return { ok: true, phone: "+" + digits };
}
