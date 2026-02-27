import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const API_URL = process.env.API_URL || "http://localhost:8000";
const API_KEY = process.env.API_KEY;

/**
 * Server-side proxy to FastAPI backend.
 * Keeps API_KEY on the server — never exposed to the browser.
 *
 * Client calls:  /api/foundry/v1/curator/queue/...
 * Proxy calls:   API_URL/api/v1/curator/queue/...
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(request, await params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(request, await params);
}

async function proxy(
  request: NextRequest,
  { path }: { path: string[] }
) {
  // Auth check — require a valid Supabase session
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const backendPath = `/api/${path.join("/")}`;
  const url = new URL(backendPath, API_URL);

  // Forward query params
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const contentType = request.headers.get("content-type") || "";
  const isMultipart = contentType.includes("multipart/form-data");

  const headers: Record<string, string> = {};
  if (API_KEY) {
    headers["X-API-Key"] = API_KEY;
  }

  const fetchOpts: RequestInit = {
    method: request.method,
    headers,
  };

  if (request.method === "POST") {
    if (isMultipart) {
      // Forward multipart body as-is (for file uploads)
      const formData = await request.formData();
      fetchOpts.body = formData;
    } else {
      headers["Content-Type"] = "application/json";
      fetchOpts.body = await request.text();
    }
  } else {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url.toString(), fetchOpts);
  const data = await res.json().catch(() => ({}));

  return NextResponse.json(data, { status: res.status });
}
