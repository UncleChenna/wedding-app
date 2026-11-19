export const guestPhoneCountries = [
  { code: "NG", label: "Nigeria", dial: "234", trunk: true },
  { code: "GB", label: "United Kingdom", dial: "44", trunk: true },
  { code: "US", label: "United States / Canada", dial: "1", trunk: false },
  { code: "GH", label: "Ghana", dial: "233", trunk: true },
  { code: "ZA", label: "South Africa", dial: "27", trunk: true },
  { code: "KE", label: "Kenya", dial: "254", trunk: true },
  { code: "IE", label: "Ireland", dial: "353", trunk: true },
  { code: "FR", label: "France", dial: "33", trunk: true },
  { code: "DE", label: "Germany", dial: "49", trunk: true },
  { code: "NL", label: "Netherlands", dial: "31", trunk: true },
  { code: "IT", label: "Italy", dial: "39", trunk: false },
  { code: "ES", label: "Spain", dial: "34", trunk: false },
  { code: "AE", label: "United Arab Emirates", dial: "971", trunk: true },
  { code: "IN", label: "India", dial: "91", trunk: true },
  { code: "AU", label: "Australia", dial: "61", trunk: true },
  { code: "NZ", label: "New Zealand", dial: "64", trunk: true },
] as const;

export function splitGuestPhone(value: string) {
  const international = value.trim().replace(/^00/, "+");
  if (!international) return { country: "NG", number: "" };
  const country = [...guestPhoneCountries]
    .sort((a, b) => b.dial.length - a.dial.length)
    .find((c) => international.startsWith("+" + c.dial));
  if (country)
    return { country: country.code, number: international.slice(country.dial.length + 1).trim() };
  return { country: international.startsWith("+") ? "OTHER" : "NG", number: international };
}

export function joinGuestPhone(countryCode: string, number: string) {
  const value = number.trim();
  if (!value) return "";
  // Pasted international numbers already carry their country code.
  if (value.startsWith("+") || value.startsWith("00")) return value.replace(/^00/, "+");
  const country = guestPhoneCountries.find((c) => c.code === countryCode);
  if (!country) return value.startsWith("+") ? value : "+" + value;
  const national = country.trunk ? value.replace(/^\(?0\)?[ .-]?/, "") : value;
  return "+" + country.dial + national;
}
