/** Hostnames that bypass strict HTML/PDF content-type rules (brief §9). */
export const ALLOWED_PLATFORM_HOSTS = new Set(
  [
    "github.com",
    "gitlab.com",
    "linear.app",
    "notion.so",
    "figma.com",
    "loom.com",
    "vercel.app",
    "railway.app",
    "render.com",
    "replit.com",
    "supabase.com",
    "firebase.google.com",
    "webflow.io",
    "framer.com",
    "framer.website",
    "mailchimp.com",
    "beehiiv.com",
    "loops.so",
    "convertkit.com",
    "buffer.com",
    "typefully.com",
    "later.com",
    "hootsuite.com",
    "typeform.com",
    "tally.so",
    "calendly.com",
    "savvycal.com",
    "cal.com",
    "producthunt.com",
    "apollo.io",
    "hubspot.com",
    "pipedrive.com",
    "attio.com",
    "close.com",
    "airtable.com",
    "ashbyhq.com",
    "greenhouse.io",
    "lever.co",
    "angellist.com",
    "wellfound.com",
    "x.com",
    "twitter.com",
    "linkedin.com",
    "medium.com",
    "substack.com",
    "dribbble.com",
    "behance.net",
    "gumroad.com",
    "lemonsqueezy.com",
    "paddle.com",
    "razorpay.com",
    "stripe.com",
  ].map((h) => h.toLowerCase()),
);

function hostnameOf(raw: string): string | null {
  try {
    const u = new URL(raw);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function isAllowedPlatform(host: string): boolean {
  if (ALLOWED_PLATFORM_HOSTS.has(host)) return true;
  for (const h of Array.from(ALLOWED_PLATFORM_HOSTS)) {
    if (host === h || host.endsWith(`.${h}`)) return true;
  }
  return false;
}

function contentTypeOk(ct: string | null, host: string): boolean {
  if (!ct) return isAllowedPlatform(host);
  const c = ct.toLowerCase();
  if (isAllowedPlatform(host)) return true;
  return (
    c.includes("text/html") ||
    c.includes("application/xhtml+xml") ||
    c.includes("application/pdf") ||
    c.startsWith("image/") ||
    c.startsWith("video/")
  );
}

export type UrlValidationResult = {
  ok: boolean;
  httpStatus?: number;
  contentType?: string | null;
  bodySize?: number;
  failureReason?: string;
};

export async function validateProofUrl(
  rawUrl: string,
  timeoutMs: number = 5000,
): Promise<UrlValidationResult> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, failureReason: "Invalid URL." };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, failureReason: "URL must be http or https." };
  }

  const host = hostnameOf(rawUrl);
  if (!host) return { ok: false, failureReason: "Invalid URL." };

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const head = await fetch(rawUrl, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(t);
    const status = head.status;
    if (status < 200 || status >= 400) {
      return {
        ok: false,
        httpStatus: status,
        failureReason: `URL returned HTTP ${status}.`,
      };
    }
    const ct = head.headers.get("content-type");
    if (!contentTypeOk(ct, host)) {
      return {
        ok: false,
        httpStatus: status,
        contentType: ct,
        failureReason: "Content type not accepted for this URL.",
      };
    }
    const len = head.headers.get("content-length");
    if (len) {
      const n = parseInt(len, 10);
      if (!Number.isNaN(n) && n <= 1024) {
        return {
          ok: false,
          httpStatus: status,
          contentType: ct,
          bodySize: n,
          failureReason: "Response too small to be valid proof (must exceed 1KB).",
        };
      }
      if (!Number.isNaN(n) && n > 1024) {
        return {
          ok: true,
          httpStatus: status,
          contentType: ct,
          bodySize: n,
        };
      }
    }

    const getCtrl = new AbortController();
    const gt = setTimeout(() => getCtrl.abort(), timeoutMs);
    const partial = await fetch(rawUrl, {
      method: "GET",
      redirect: "follow",
      signal: getCtrl.signal,
      headers: { Range: "bytes=0-4095" },
    });
    clearTimeout(gt);
    const buf = await partial.arrayBuffer();
    const size = buf.byteLength;
    if (size <= 1024) {
      return {
        ok: false,
        httpStatus: partial.status,
        contentType: partial.headers.get("content-type"),
        bodySize: size,
        failureReason: "Could not verify response body larger than 1KB.",
      };
    }
    return {
      ok: true,
      httpStatus: partial.status,
      contentType: partial.headers.get("content-type"),
      bodySize: size,
    };
  } catch (e) {
    clearTimeout(t);
    const msg = e instanceof Error ? e.message : "Request failed";
    return { ok: false, failureReason: msg.includes("abort") ? "Validation timed out." : msg };
  }
}
