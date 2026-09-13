import { copyFileSync, existsSync, readdirSync } from 'node:fs';

const src = 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs';
const dest = 'public/pdf.worker.min.mjs';

if (!existsSync(src)) {
  const buildDir = 'node_modules/pdfjs-dist/build';
  const found = existsSync(buildDir) ? readdirSync(buildDir) : [];
  console.error(
    `copy-pdf-worker: expected worker file not found at ${src}.\n` +
      `Contents of ${buildDir}: ${found.join(', ') || '(missing)'}\n` +
      'pdfjs-dist likely changed its build output filename — update this script to match.'
  );
  process.exit(1);
}

copyFileSync(src, dest);
