// Proxies the backend's SSE stream straight through — App Router route
// handlers can return a ReadableStream body with no buffering, so this
// stays a live stream rather than waiting for the backend to finish.
export const dynamic = "force-dynamic";

const BACKEND_API_URL = process.env.BACKEND_API_URL;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!BACKEND_API_URL) {
    return Response.json(
      { detail: "BACKEND_API_URL is not configured" },
      { status: 500 }
    );
  }
  const { id } = await params;
  const backendRes = await fetch(`${BACKEND_API_URL}/rewrite-jobs/${id}/stream`);

  return new Response(backendRes.body, {
    status: backendRes.status,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
