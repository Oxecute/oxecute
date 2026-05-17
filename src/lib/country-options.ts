export type CountryOption = { code: string; name: string };

const FALLBACK: CountryOption[] = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "IN", name: "India" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "NL", name: "Netherlands" },
  { code: "SG", name: "Singapore" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "IE", name: "Ireland" },
  { code: "NZ", name: "New Zealand" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "CN", name: "China" },
  { code: "ZA", name: "South Africa" },
  { code: "NG", name: "Nigeria" },
  { code: "KE", name: "Kenya" },
  { code: "IL", name: "Israel" },
  { code: "CH", name: "Switzerland" },
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" },
  { code: "PT", name: "Portugal" },
  { code: "PL", name: "Poland" },
];

let cached: CountryOption[] | null = null;

/** Sorted list of countries for onboarding & forms (ISO name, English). */
export function getCountryOptions(): CountryOption[] {
  if (cached) return cached;
  try {
    const IntlExt = Intl as typeof Intl & {
      supportedValuesOf?: (key: string) => string[];
    };
    if (typeof IntlExt.supportedValuesOf === "function") {
      const codes = IntlExt.supportedValuesOf("region");
      const dn = new Intl.DisplayNames(["en"], { type: "region" });
      cached = codes
        .filter((c) => /^[A-Z]{2}$/.test(c) && c !== "ZZ")
        .map((code) => ({ code, name: dn.of(code) ?? code }))
        .sort((a, b) => a.name.localeCompare(b.name));
      return cached;
    }
  } catch {
    /* use fallback */
  }
  cached = [...FALLBACK].sort((a, b) => a.name.localeCompare(b.name));
  return cached;
}
