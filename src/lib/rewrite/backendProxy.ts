/**
 * Shared body for every Next.js route that proxies to BACKEND_API_URL
 * (plainly-api's Cloud Run URL, kept server-side so it never reaches the
 * browser).
 *
 * None of the three routes wrapped their backend `fetch` in a try/catch.
 * When the backend is genuinely unreachable — Cloud Run down, a cold
 * start that times out, a DNS blip — `fetch` doesn't return a bad status,
 * it THROWS, and an uncaught throw inside a route handler becomes Next's
 * own generic 500 error page: no `detail` field, nothing the client's
 * `res.json()` can parse, nothing a reader should ever see. The 402
 * credits path only works because create/progress/snapshot all return
 * clean JSON; an unreachable backend was the one failure mode that
 * bypassed that entirely.
 *
 * Also guards the JSON parse itself: a Cloud Run infrastructure error
 * (502/503/504) can come back as an HTML or plain-text page rather than
 * JSON, which would otherwise throw inside `res.json()` — a second,
 * separate way to reach the same uncaught crash.
 */
export async function proxyToBackend(
  backendApiUrl: string | undefined,
  path: string,
  init?: RequestInit
): Promise<Response> {
  if (!backendApiUrl) {
    return Response.json(
      { detail: "BACKEND_API_URL is not configured" },
      { status: 500 }
    );
  }

  let res: globalThis.Response;
  try {
    res = await fetch(`${backendApiUrl}${path}`, init);
  } catch {
    // Network-level failure reaching our own backend — not a status code
    // to relay, since there is no response. 502: this route is acting as
    // a gateway, and its upstream didn't answer.
    return Response.json(
      { detail: "Couldn't reach the server. Please try again shortly." },
      { status: 502 }
    );
  }

  const raw = await res.text();
  try {
    JSON.parse(raw || "{}");
  } catch {
    // The backend responded, but not with JSON — an infra-level error
    // page rather than anything services/api/main.py wrote.
    return Response.json(
      { detail: "The server sent back something unexpected. Please try again shortly." },
      { status: 502 }
    );
  }
  return new Response(raw || "{}", {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
