import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req, { params }) {
  const { token } = await params;
  if (!token || token === "undefined") {
    return new Response("<h2>Invalid waiver link. Please use the link from your SMS.</h2>", {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    const base = path.join(process.cwd(), "app", "waiver", "[token]");
    const files = [
      "prime-adult.html",
      "prime-minor-1.html",
      "prime-minor-2.html",
      "prime-minor-3.html",
      "prime-minor-4.html",
      "prime-form.html",
      "prime-script-1.html",
      "prime-script-2.html",
    ];
    const parts = await Promise.all(files.map((name) => readFile(path.join(base, name), "utf8")));
    return new Response(parts.join(""), {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (error) {
    console.error("[staging-waiver] unable to load Prime 2026 waiver", error);
    return new Response("<h2>Staging waiver is temporarily unavailable.</h2>", {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}
