// Full snapshot — the finished document. Fetched once, when the job is
// done, rather than repeatedly while it runs: a 200-page job's snapshot
// is close to a megabyte of prose.
export const dynamic = "force-dynamic";

import { proxyToBackend } from "@/lib/rewrite/backendProxy";

const BACKEND_API_URL = process.env.BACKEND_API_URL;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToBackend(BACKEND_API_URL, `/rewrite-jobs/${id}`, {
    cache: "no-store",
  });
}
