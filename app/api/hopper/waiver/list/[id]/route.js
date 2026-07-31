export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const DRIVER_PIN = process.env.DRIVER_PIN;

export async function GET(req, { params }) {
  const { id } = await params;
  const pin = req.headers.get("x-driver-pin");
  const isDriver = pin === DRIVER_PIN;

  const { data: waivers, error } = await supabaseAdmin
    .from("hopper_waivers")
    .select("*")
    .eq("request_id", id)
    .order("guest_index", { ascending: true });

  if (error) {
    console.error("[waiver/list] error:", error.message);
    return NextResponse.json({ waivers: [] });
  }

  const safeWaivers = (waivers || []).map(w => {
    const minor_count = Array.isArray(w.minors) ? w.minors.length : 0;
    const covered = 1 + minor_count;
    if (!isDriver) {
      const { signature_data, ...safe } = w;
      return { ...safe, minor_count, covered };
    }
    return { ...w, minor_count, covered };
  });

  return NextResponse.json({ waivers: safeWaivers });
}


