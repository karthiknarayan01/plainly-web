// Full snapshot — the finished document. Fetched once, when the job is
// done, rather than repeatedly while it runs: a 200-page job's snapshot
// is close to a megabyte of prose.
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
  const res = await fetch(`${BACKEND_API_URL}/rewrite-jobs/${id}`, {
    cache: "no-store",
  });
  return Response.json(await res.json(), { status: res.status });
}
