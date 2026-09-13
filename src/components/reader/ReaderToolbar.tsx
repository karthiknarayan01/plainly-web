import { Button } from "@/components/ui/Button";

interface ReaderToolbarProps {
  title: string;
  currentPage: number;
  pageCount: number;
  onClose: () => void;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
}

const ZOOM_STEP = 0.15;
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 2.2;

export function ReaderToolbar({
  title,
  currentPage,
  pageCount,
  onClose,
  zoom,
  onZoomChange,
}: ReaderToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <Button variant="ghost" onClick={onClose} className="px-2">
          ← Back
        </Button>
        <span className="text-sm text-foreground truncate" title={title}>
          {title}
        </span>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        {onZoomChange && zoom !== undefined && (
          <div className="hidden sm:flex items-center gap-1 font-mono text-xs text-foreground-muted">
            <button
              className="px-2 py-1 hover:text-foreground disabled:opacity-40"
              onClick={() => onZoomChange(Math.max(MIN_ZOOM, zoom - ZOOM_STEP))}
              disabled={zoom <= MIN_ZOOM}
              aria-label="Zoom out"
            >
              −
            </button>
            <span className="w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button
              className="px-2 py-1 hover:text-foreground disabled:opacity-40"
              onClick={() => onZoomChange(Math.min(MAX_ZOOM, zoom + ZOOM_STEP))}
              disabled={zoom >= MAX_ZOOM}
              aria-label="Zoom in"
            >
              +
            </button>
          </div>
        )}
        <span className="font-mono text-xs text-foreground-subtle whitespace-nowrap">
          {currentPage + 1} / {pageCount}
        </span>
      </div>
    </div>
  );
}
