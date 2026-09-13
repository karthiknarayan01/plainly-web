import type {
  RewriteErrorBody,
  RewriteRequestBody,
  RewriteResponseBody,
} from "./types";

export async function requestRewrite(
  body: RewriteRequestBody
): Promise<RewriteResponseBody> {
  const res = await fetch("/api/rewrite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok) {
    const errorBody = json as RewriteErrorBody;
    throw new Error(errorBody.message || "Rewrite request failed");
  }
  return json as RewriteResponseBody;
}
