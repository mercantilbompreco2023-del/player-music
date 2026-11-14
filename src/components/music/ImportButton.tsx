import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/lib/music/player-context";

export function ImportButton({ variant = "default" }: { variant?: "default" | "secondary" }) {
  const ref = useRef<HTMLInputElement>(null);
  const { importFiles } = usePlayer();
  const [busy, setBusy] = useState(false);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="audio/*,.mp3,.m4a,.aac,.ogg,.opus,.wav,.flac"
        multiple
        className="hidden"
        aria-label="Escolher arquivos de áudio"
        onChange={async (e) => {
          if (e.target.files?.length) {
            setBusy(true);
            await importFiles(e.target.files);
            setBusy(false);
          }
          e.target.value = "";
        }}
      />
      <Button variant={variant} className="rounded-full" disabled={busy} onClick={() => ref.current?.click()}>
        {busy ? <Loader2 className="animate-spin" /> : <Upload />}
        Importar músicas
      </Button>
    </>
  );
}
