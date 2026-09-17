import type { Metadata } from "next";
import { Geist, Geist_Mono, Literata } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Reading typography for the rewritten-text reader specifically — a
// serif designed for long-form/e-book reading, so switching from the
// original PDF into the plain-language rewrite still feels like reading
// a book, not switching into an app panel. The rest of the UI (chrome,
// toolbar, buttons) keeps Geist Sans.
const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Grasp",
  description:
    "Grasp rewrites technical books and financial documents — like earnings statements — so a reader with no background in the subject can understand them, without changing what they say.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${literata.variable} h-full antialiased`}
    >
      <body className="h-dvh flex flex-col">{children}</body>
    </html>
  );
}
