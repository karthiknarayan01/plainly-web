// Counts only, for the client's poll loop while a rewrite runs. Carries
// no rewrite text, so polling it every couple of seconds stays cheap even
// for a several-hundred-page document.
export const dynamic = "force-dynamic";

import { proxyToBackend } from "@/lib/rewrite/backendProxy";

const BACKEND_API_URL = process.env.BACKEND_API_URL;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyToBackend(BACKEND_API_URL, `/rewrite-jobs/${id}/progress`, {
    cache: "no-store",
  });
}
