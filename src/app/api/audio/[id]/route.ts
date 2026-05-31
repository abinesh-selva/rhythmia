import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const db = getServiceClient();
  if (!db) return new NextResponse("Service unavailable", { status: 503 });

  const { data } = await db
    .from("tracks")
    .select("audio_url, is_active")
    .eq("id", id)
    .single();

  if (!data?.audio_url || data.is_active === false) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Forward Range header so the browser can seek (partial content)
  const range = req.headers.get("range");
  const upstreamHeaders: Record<string, string> = {};
  if (range) upstreamHeaders["Range"] = range;

  const upstream = await fetch(data.audio_url, { headers: upstreamHeaders });

  const responseHeaders = new Headers();
  const passThrough = ["Content-Type", "Content-Length", "Content-Range", "Accept-Ranges"];
  for (const h of passThrough) {
    const v = upstream.headers.get(h);
    if (v) responseHeaders.set(h, v);
  }
  // Cache on the client for 1 h; no public CDN caching (private audio)
  responseHeaders.set("Cache-Control", "private, max-age=3600");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
