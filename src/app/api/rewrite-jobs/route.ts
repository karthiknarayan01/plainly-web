// Thin proxy so BACKEND_API_URL (plainly-api's real Cloud Run URL) never
// reaches the browser — the client only ever calls this same-origin route.
import { proxyToBackend } from "@/lib/rewrite/backendProxy";

const BACKEND_API_URL = process.env.BACKEND_API_URL;

export async function POST(request: Request) {
  const body = await request.text();
  return proxyToBackend(BACKEND_API_URL, "/rewrite-jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
