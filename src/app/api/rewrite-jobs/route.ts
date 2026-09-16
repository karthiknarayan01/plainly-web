// Thin proxy so BACKEND_API_URL (plainly-api's real Cloud Run URL) never
// reaches the browser — the client only ever calls this same-origin route.
const BACKEND_API_URL = process.env.BACKEND_API_URL;

export async function POST(request: Request) {
  if (!BACKEND_API_URL) {
    return Response.json(
      { detail: "BACKEND_API_URL is not configured" },
      { status: 500 }
    );
  }
  const body = await request.text();
  const res = await fetch(`${BACKEND_API_URL}/rewrite-jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const responseBody = await res.text();
  return new Response(responseBody, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
