"use client";

import dynamic from "next/dynamic";

// AppShell (transitively) imports pdf.js, which must never evaluate on the
// server — ssr:false here, not just inside the reader components, is what
// actually guarantees that.
const AppShell = dynamic(
  () => import("@/components/app/AppShell").then((mod) => mod.AppShell),
  { ssr: false }
);

export default function Home() {
  return <AppShell />;
}
