export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
export async function GET(req, { params }) {
  const { id } = await params;
  const { data, error } = await supabaseAdmin.from("hopper_requests").select("*").eq("id", id).single();
  if (error||!data) return NextResponse.json({ error:"Not found" },{status:404});
  const { count } = await supabaseAdmin.from("hopper_waivers").select("*",{count:"exact",head:true}).eq("request_id", id).not("signed_at","is",null);
  return NextResponse.json({ ...data, waivers_signed: count||0 });
}