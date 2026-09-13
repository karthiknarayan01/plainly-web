import { NextResponse } from "next/server";
import { buildMockRewrite } from "@/lib/rewrite/mockRewrite";
import type {
  RewriteErrorBody,
  RewriteRequestBody,
  RewriteResponseBody,
} from "@/lib/rewrite/types";

const MIN_DELAY_MS = 1200;
const MAX_DELAY_MS = 2700;
const SIMULATED_FAILURE_RATE = 0.05;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isValidBody(value: unknown): value is RewriteRequestBody {
  if (typeof value !== "object" || value === null) return false;
  const body = value as Record<string, unknown>;
  return (
    typeof body.fileName === "string" &&
    typeof body.pageCount === "number" &&
    typeof body.fileSizeBytes === "number"
  );
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  if (!isValidBody(json)) {
    return NextResponse.json<RewriteErrorBody>(
      { status: "error", message: "Invalid request body" },
      { status: 400 }
    );
  }

  await delay(MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS));

  if (Math.random() < SIMULATED_FAILURE_RATE) {
    return NextResponse.json<RewriteErrorBody>(
      { status: "error", message: "Mock rewrite service unavailable — try again." },
      { status: 503 }
    );
  }

  return NextResponse.json<RewriteResponseBody>(buildMockRewrite(json));
}
