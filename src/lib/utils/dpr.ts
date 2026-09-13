const MAX_DPR = 2;

export function getCappedDpr(): number {
  if (typeof window === "undefined") return 1;
  return Math.min(window.devicePixelRatio || 1, MAX_DPR);
}
