import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Film, FolderPlus, Play, Search, Trash2, Video } from "lucide-react";

type VideoCategory = "Clipes" | "Shows" | "Curtos";
type SavedVideo = { id: string; name: string; category: VideoCategory; createdAt: number; blob: Blob };
type VideoEntry = Omit<SavedVideo, "blob"> & { url: string };

const DB_NAME = "delicia-coxis-video-library";
const STORE = "videos";
const FILTERS = ["Todos", "Clipes", "Shows", "Curtos"] as const;

function openVideoDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function readVideos(): Promise<SavedVideo[]> {
  const db = await openVideoDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    request.onsuccess = () => { db.close(); resolve(request.result as SavedVideo[]); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}
async function writeVideo(video: SavedVideo): Promise<void> {
  const db = await openVideoDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readwrite").objectStore(STORE).put(video);
    request.onsuccess = () => { db.close(); resolve(); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}
async function deleteVideo(id: string): Promise<void> {
  const db = await openVideoDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readwrite").objectStore(STORE).delete(id);
    request.onsuccess = () => { db.close(); resolve(); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export const Route = createFileRoute("/videos")({
  head: () => ({ meta: [{ title: "Vídeos — Delícia Coxi’s Music & Video" }, { name: "description", content: "Sua biblioteca pessoal de clipes, shows e vídeos." }] }),
  component: VideosPage,
});

function VideosPage() {
  const [videos, setVideos] = useState<VideoEntry[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [categoryForImport, setCategoryForImport] = useState<VideoCategory>("Clipes");
  const [message, setMessage] = useState("");
  useEffect(() => {
    let alive = true;
    let loadedUrls: string[] = [];
    readVideos().then(items => {
      if (!alive) return;
      const entries = items.sort((a,b)=>b.createdAt-a.createdAt).map(({blob,...item})=>({...item,url:URL.createObjectURL(blob)}));
      loadedUrls = entries.map(item=>item.url);
      setVideos(entries);
      setSelectedId(entries[0]?.id ?? null);
    }).catch(()=>setMessage("Não foi possível abrir a biblioteca de vídeos neste navegador."));
    return () => { alive=false; loadedUrls.forEach(url=>URL.revokeObjectURL(url)); };
    // Load once on mount; blob URLs are released when the page unmounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const visible = useMemo(() => videos.filter(v => (filter==="Todos" || v.category===filter) && v.name.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"))), [videos,filter,query]);
  const selected = videos.find(v=>v.id===selectedId) ?? visible[0] ?? null;

  async function importFiles(files: FileList | null) {
    if (!files?.length) return;
    setMessage("");
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("video/")) continue;
      const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${file.name}`;
      const record: SavedVideo = { id, name:file.name.replace(/\\.[^.]+$/, ""), category:categoryForImport, createdAt:Date.now(), blob:file };
      try {
        await writeVideo(record);
        const entry: VideoEntry = {...record,url:URL.createObjectURL(file)};
        setVideos(current=>[entry,...current]);
        setSelectedId(id);
      } catch {
        setMessage("O armazenamento do navegador não aceitou este vídeo. Tente um arquivo menor.");
      }
    }
  }
  async function removeVideo(id: string) {
    const item=videos.find(v=>v.id===id);
    try {
      await deleteVideo(id);
      if(item) URL.revokeObjectURL(item.url);
      setVideos(current=>current.filter(v=>v.id!==id));
      if(selectedId===id) setSelectedId(videos.find(v=>v.id!==id)?.id ?? null);
    } catch { setMessage("Não foi possível remover o vídeo."); }
  }
  async function changeCategory(id: string, category: VideoCategory) {
    const item=videos.find(v=>v.id===id); if(!item) return;
    try {
      const response=await fetch(item.url); const blob=await response.blob();
      await writeVideo({id:item.id,name:item.name,category,createdAt:item.createdAt,blob});
      setVideos(current=>current.map(v=>v.id===id?{...v,category}:v));
    } catch { setMessage("Não foi possível salvar a categoria."); }
  }

  return <div className="video-hub mx-auto min-h-[calc(100dvh-8rem)] max-w-5xl space-y-5 pb-8">
    <header className="flex items-center justify-between gap-3">
      <Link to="/" aria-label="Voltar ao início" className="rounded-full border border-emerald-400/30 p-2 text-emerald-300"><ArrowLeft className="size-5"/></Link>
      <div className="flex items-center gap-2"><span className="text-red-400"><Video className="size-7"/></span><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-400">Delícia Coxi’s</p><h1 className="text-2xl font-black">Vídeos</h1></div></div>
      <label className="cursor-pointer rounded-full border border-emerald-400/40 bg-emerald-400/10 p-2 text-emerald-300" title="Importar vídeos"><FolderPlus className="size-5"/><input className="sr-only" type="file" accept="video/*" multiple onChange={e=>{void importFiles(e.target.files);e.currentTarget.value="";}}/></label>
    </header>

    <section className="video-neon-panel rounded-3xl p-3 sm:p-5">
      <div className="mb-3 flex items-center gap-2 rounded-full border border-emerald-400/35 bg-black/50 px-4 py-3">
        <Search className="size-5 text-emerald-300"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar vídeos da sua biblioteca..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/45"/>
      </div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(item=><button key={item} className="video-filter" aria-pressed={filter===item} onClick={()=>setFilter(item)}>{item}</button>)}
      </div>
    </section>

    {selected ? <section className="video-neon-panel overflow-hidden rounded-3xl p-3 sm:p-5">
      <video key={selected.id} src={selected.url} controls playsInline className="aspect-video w-full rounded-2xl bg-black" />
      <div className="mt-3 flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate text-lg font-extrabold">{selected.name}</h2><p className="text-xs text-emerald-300/80">Salvo neste aparelho · {selected.category}</p></div><button onClick={()=>void removeVideo(selected.id)} aria-label="Excluir vídeo" className="rounded-full border border-red-400/25 p-2 text-red-300"><Trash2 className="size-4"/></button></div>
    </section> : <section className="video-neon-panel flex min-h-52 flex-col items-center justify-center rounded-3xl p-6 text-center">
      <Film className="mb-3 size-12 text-emerald-400"/><h2 className="text-lg font-extrabold">Sua biblioteca de vídeos</h2><p className="mt-1 max-w-sm text-sm text-white/60">Importe clipes, shows ou vídeos do seu aparelho. Eles ficam salvos neste dispositivo.</p>
      <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-emerald-400 px-5 py-3 text-sm font-black text-black"><FolderPlus className="size-4"/> Importar vídeos<input className="sr-only" type="file" accept="video/*" multiple onChange={e=>{void importFiles(e.target.files);e.currentTarget.value="";}}/></label>
    </section>}

    <section className="space-y-3">
      <div className="flex items-center justify-between"><h2 className="text-lg font-extrabold">Minha coleção <span className="text-sm text-emerald-300">({visible.length})</span></h2><label className="text-xs text-white/65">Importar como <select value={categoryForImport} onChange={e=>setCategoryForImport(e.target.value as VideoCategory)} className="ml-1 rounded-lg border border-emerald-400/25 bg-[#08120b] px-2 py-1 text-white"><option>Clipes</option><option>Shows</option><option>Curtos</option></select></label></div>
      <div className="space-y-2">
        {visible.map(item=><article key={item.id} className="video-item flex items-center gap-3 p-2">
          <button onClick={()=>setSelectedId(item.id)} className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-black text-emerald-300"><video src={item.url} muted preload="metadata" className="size-full object-cover"/><span className="absolute bottom-1 right-1 rounded bg-black/80 p-1"><Play className="size-3 fill-current"/></span></button>
          <button onClick={()=>setSelectedId(item.id)} className="min-w-0 flex-1 text-left"><h3 className="line-clamp-2 text-sm font-bold">{item.name}</h3><p className="mt-1 text-xs text-white/55">Vídeo local · {item.category}</p></button>
          <select aria-label="Categoria do vídeo" value={item.category} onChange={e=>void changeCategory(item.id,e.target.value as VideoCategory)} className="max-w-[5.5rem] rounded-lg border border-emerald-400/25 bg-[#08120b] px-1.5 py-2 text-[10px] text-white"><option>Clipes</option><option>Shows</option><option>Curtos</option></select>
          <button onClick={()=>void removeVideo(item.id)} aria-label={`Excluir ${item.name}`} className="p-2 text-white/45 hover:text-red-300"><Trash2 className="size-4"/></button>
        </article>)}
        {!visible.length && videos.length>0 && <p className="rounded-2xl border border-dashed border-emerald-400/25 p-5 text-center text-sm text-white/55">Nenhum vídeo nesta categoria ou busca.</p>}
      </div>
    </section>
    {message && <p role="status" className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">{message}</p>}
    <p className="text-center text-[11px] text-white/40">Os vídeos importados ficam no armazenamento deste navegador/aplicativo. Não são enviados para a nuvem.</p>
  </div>;
}
