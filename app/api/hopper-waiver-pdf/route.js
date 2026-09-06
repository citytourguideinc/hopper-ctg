export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { supabaseAdmin } from "@/lib/supabase";

const BUCKET = "hopper-waivers";

function clean(v, fallback = "unknown") {
  const s = String(v || "").trim();
  const safe = s.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return safe || fallback;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { token, ride_date, start_time, print_name, pdf_base64, request_id } = body;

    if (!token || !ride_date || !start_time || !pdf_base64) {
      return Response.json({ success: false, error: "Missing PDF storage fields" }, { status: 400 });
    }

    const base64 = String(pdf_base64).replace(/^data:application\/pdf;base64,/, "");
    const bytes = Buffer.from(base64, "base64");
    if (!bytes.length) {
      return Response.json({ success: false, error: "Empty PDF" }, { status: 400 });
    }

    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    if (!buckets?.some((b) => b.name === BUCKET)) {
      const { error: createError } = await supabaseAdmin.storage.createBucket(BUCKET, {
        public: false,
        fileSizeLimit: 10 * 1024 * 1024,
        allowedMimeTypes: ["application/pdf"],
      });
      if (createError && !String(createError.message || "").toLowerCase().includes("already")) {
        throw createError;
      }
    }

    const rideFolder = clean(ride_date);
    const timeFolder = clean(start_time.replace(":", "-"));
    const groupFolder = clean(request_id, "walkup");
    const person = clean(print_name, "participant");
    const filename = `${person}-${clean(token)}.pdf`;
    const path = `rides/${rideFolder}/${timeFolder}/${groupFolder}/${filename}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, bytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    return Response.json({ success: true, bucket: BUCKET, path });
  } catch (e) {
    console.error("[hopper-waiver-pdf]", e?.message || e);
    return Response.json({ success: false, error: e?.message || "Unable to store signed PDF" }, { status: 500 });
  }
}
