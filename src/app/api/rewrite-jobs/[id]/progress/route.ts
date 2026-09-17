// Counts only, for the client's poll loop while a rewrite runs. Carries
// no rewrite text, so polling it every couple of seconds stays cheap even
// for a several-hundred-page document.
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
  const res = await fetch(`${BACKEND_API_URL}/rewrite-jobs/${id}/progress`, {
    cache: "no-store",
  });
  return Response.json(await res.json(), { status: res.status });
}
