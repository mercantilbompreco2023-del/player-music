import { Music2 } from "lucide-react";
import { cn } from "@/lib/utils";

const COVERS = ["cover-0", "cover-1", "cover-2", "cover-3", "cover-4", "cover-5"];
export function coverClass(seed: string) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) | 0;
  return COVERS[Math.abs(h) % COVERS.length];
}

export function Cover({ seed, className, iconClass }: { seed: string; className?: string; iconClass?: string }) {
  return (
    <div className={cn("flex shrink-0 items-center justify-center rounded-lg text-primary-foreground", coverClass(seed), className)} aria-hidden>
      <Music2 className={cn("h-1/3 w-1/3 opacity-80", iconClass)} />
    </div>
  );
}
