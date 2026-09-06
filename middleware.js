import { NextResponse } from "next/server";

export function middleware(request) {
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  const pathname = request.nextUrl.pathname;

  if (host === "tip.citytourguide.app" && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/tour-tip";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
