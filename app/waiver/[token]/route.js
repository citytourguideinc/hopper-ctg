import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STAGING_HOST = "staging-waiver.citytourguide.com";

export async function GET(req, { params }) {
  const { token } = await params;

  if (!token || token === "undefined") {
    return new Response("<h2>Invalid waiver link. Please use the link from your SMS.</h2>", {
      headers: { "Content-Type": "text/html; charset=utf-8" },
      status: 400,
    });
  }

  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "")
    .split(":")[0]
    .toLowerCase();

  // Staging renders the in-repo waiver implementation for end-to-end testing.
  // Production remains unchanged and continues to the existing live waiver service.
  if (host === STAGING_HOST) {
    try {
      const templatePath = path.join(
        process.cwd(),
        "app",
        "waiver",
        "[token]",
        "template.html"
      );
      const html = await readFile(templatePath, "utf8");

      return new Response(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store, max-age=0",
          "X-Robots-Tag": "noindex, nofollow",
        },
      });
    } catch (error) {
      console.error("[waiver/staging] unable to load template", error);
      return new Response("<h2>Staging waiver is temporarily unavailable.</h2>", {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
  }

  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const dest = `https://waiver.citytourguide.app/sign/${token}${qs ? "?" + qs : ""}`;
  return Response.redirect(dest, 302);
}
