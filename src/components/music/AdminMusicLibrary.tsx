import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Music2, Plus, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminMusicLibrary() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const q = useQuery({ queryKey: ["admin-official-music"], queryFn: async () => {
    const { data, error } = await supabase.from("public_music").select("*").order("created_at", { ascending: false });
    if (error) throw error; return data;
  }});
  async function publish(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { toast.error("Escolha um arquivo de áudio."); return; }
    if (file.size > 100 * 1024 * 1024) { toast.error("O arquivo deve ter no máximo 100 MB."); return; }
    if (!title.trim() || !artist.trim()) { toast.error("Informe o nome da música e o artista."); return; }
    setBusy(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${crypto.randomUUID()}/${safeName}`;
    try {
      const upload = await supabase.storage.from("player-public-music").upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
      if (upload.error) throw upload.error;
      const inserted = await supabase.from("public_music").insert({ title: title.trim(), artist: artist.trim(), storage_path: path, mime_type: file.type || null, file_size: file.size, published: true });
      if (inserted.error) {
        await supabase.storage.from("player-public-music").remove([path]);
        throw inserted.error;
      }
      toast.success("Música publicada! Ela já está disponível para todos os usuários.");
      setTitle(""); setArtist(""); setFile(null); if (fileRef.current) fileRef.current.value = "";
      await qc.invalidateQueries({ queryKey: ["admin-official-music"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível publicar a música.");
    } finally { setBusy(false); }
  }
  async function remove(id: string, path: string, name: string) {
    if (!window.confirm(`Excluir "${name}" da biblioteca de todos os usuários?`)) return;
    const a = await supabase.from("public_music").delete().eq("id", id);
    if (a.error) { toast.error(a.error.message); return; }
    const b = await supabase.storage.from("player-public-music").remove([path]);
    if (b.error) toast.error("Registro removido, mas não foi possível apagar o arquivo: " + b.error.message);
    else toast.success("Música removida da biblioteca pública.");
    await qc.invalidateQueries({ queryKey: ["admin-official-music"] });
  }
  return <section className="space-y-4">
    <div className="rounded-2xl border-2 border-amber-500/60 bg-amber-500/10 p-4 shadow-md">
      <div className="mb-2 flex items-center gap-2 text-amber-700"><Music2 className="size-6" /><h2 className="text-lg font-extrabold">MÚSICAS OFICIAIS — PUBLICAÇÃO DO ADM</h2></div>
      <p className="mb-4 text-sm text-muted-foreground">Adicione aqui músicas próprias ou licenciadas. Depois de publicar, todos os usuários do aplicativo poderão ouvir e baixar para o aparelho, sem precisar fazer login.</p>
      <form onSubmit={publish} className="space-y-3">
        <div className="space-y-1"><Label htmlFor="official-title">Nome da música</Label><Input id="official-title" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Nome da música" maxLength={120}/></div>
        <div className="space-y-1"><Label htmlFor="official-artist">Artista</Label><Input id="official-artist" value={artist} onChange={e=>setArtist(e.target.value)} placeholder="Nome do artista" maxLength={120}/></div>
        <div className="space-y-1"><Label htmlFor="official-file">Arquivo de áudio (máx. 100 MB)</Label><Input id="official-file" ref={fileRef} type="file" accept="audio/*,.mp3,.m4a,.wav,.flac,.aac,.ogg" onChange={e=>setFile(e.target.files?.[0] ?? null)}/></div>
        {file && <p className="text-xs text-muted-foreground">Selecionado: {file.name}</p>}
        <Button type="submit" disabled={busy} className="w-full"><UploadCloud className="mr-2"/> {busy ? "Publicando…" : "PUBLICAR PARA TODOS OS USUÁRIOS"}</Button>
      </form>
    </div>
    <div className="space-y-2"><h3 className="font-bold">Músicas publicadas ({q.data?.length ?? 0})</h3>
      {q.isPending ? <p className="text-sm text-muted-foreground">Carregando…</p> : q.isError ? <p className="text-sm text-destructive">Não foi possível carregar o catálogo. Confira se a migração do banco foi aplicada.</p> : q.data.length === 0 ? <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Nenhuma música publicada ainda.</p> : q.data.map(t=><div key={t.id} className="flex items-center gap-3 rounded-xl border bg-card p-3"><Music2 className="size-5 shrink-0 text-primary"/><div className="min-w-0 flex-1"><p className="truncate font-semibold">{t.title}</p><p className="truncate text-xs text-muted-foreground">{t.artist} · {(t.file_size/1048576).toFixed(1)} MB</p></div><a href={supabase.storage.from("player-public-music").getPublicUrl(t.storage_path).data.publicUrl} download className="rounded-lg p-2" aria-label={`Baixar ${t.title}`}><Download className="size-4"/></a><Button variant="ghost" size="icon" onClick={()=>void remove(t.id,t.storage_path,t.title)} aria-label={`Excluir ${t.title}`}><Trash2 className="size-4 text-destructive"/></Button></div>)}
    </div>
  </section>;
}
