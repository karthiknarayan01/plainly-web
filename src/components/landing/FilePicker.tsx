"use client";

import { useRef, useState, type DragEvent } from "react";
import { Card } from "@/components/ui/Card";
import { readLocalFile } from "@/lib/fileAccess/readLocalFile";

interface FilePickerProps {
  onFilePicked: (file: File, arrayBuffer: ArrayBuffer) => void;
}

export function FilePicker({ onFilePicked }: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("That doesn't look like a PDF. Try a .pdf file.");
      return;
    }
    setError(null);
    const picked = await readLocalFile(file);
    onFilePicked(picked.file, picked.arrayBuffer);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    void handleFile(e.dataTransfer.files[0]);
  }

  return (
    <div className="mx-auto max-w-2xl w-full">
      <Card
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`cursor-pointer border-dashed p-10 text-center transition-colors duration-150 ${
          isDragOver ? "border-accent bg-background-elevated" : "hover:border-border-strong"
        }`}
      >
        <p className="font-mono text-xs uppercase tracking-wider text-foreground-muted mb-2">
          Select a document
        </p>
        <p className="text-foreground mb-1">Drop a PDF here, or click to browse</p>
        <p className="text-foreground-subtle text-sm">
          Stays on your device — nothing uploads yet
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
      </Card>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </div>
  );
}
