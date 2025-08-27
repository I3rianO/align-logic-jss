export type Scope = { companyId: string; siteId: string };

export function getScopeFromCookies(): Scope {
  const get = (k: string) =>
    document.cookie
      .split(";")
      .map(v => v.trim())
      .find(v => v.startsWith(k + "="))
      ?.split("=")[1] ?? "";

  // Fall back to UPS/JACFL during wiring so pages still render.
  const companyId = decodeURIComponent(get("companyId") || "UPS");
  const siteId    = decodeURIComponent(get("siteId")    || "JACFL");

  return { companyId, siteId };
}
