export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const { token } = await params;
  if (!token || token === "undefined") {
    return new Response("<h2>Invalid waiver link. Please use the link from your SMS.</h2>", {
      headers: { "Content-Type": "text/html" },
      status: 400,
    });
  }
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const dest = `https://waiver.citytourguide.app/sign/${token}${qs ? "?" + qs : ""}`;
  return Response.redirect(dest, 302);
}
