import { describe, expect, it } from "vitest";
import { buildBackup, mergeBackup } from "@/lib/music/backup";
import { defaultPrefs } from "@/lib/music/storage";
import type { Track } from "@/lib/music/types";

const track = (over: Partial<Track>): Track => ({
  id: "local-abc", title: "Forró de sábado", artist: "Adevaldo", url: "blob:secret", source: "local",
  fingerprint: "abc", path: "MinhaPasta/forro.mp3", folderName: "MinhaPasta", ...over,
});

describe("backup da lista na conta", () => {
  it("não guarda URL de reprodução nem caminho de storage", () => {
    const payload = buildBackup([track({})], defaultPrefs);
    const json = JSON.stringify(payload);
    expect(json).not.toContain("blob:secret");
    expect(payload.tracks[0]).not.toHaveProperty("url");
    expect(payload.tracks[0]).not.toHaveProperty("storagePath");
  });

  it("ignora faixas de demonstração", () => {
    const payload = buildBackup([track({}), track({ id: "demo-1", source: "demo", fingerprint: undefined })], defaultPrefs);
    expect(payload.tracks).toHaveLength(1);
  });

  it("guarda playlists e favoritos por impressão digital", () => {
    const prefs = { ...defaultPrefs, favorites: ["local-abc"], playlists: [{ id: "p1", name: "Festa", trackIds: ["local-abc"], createdAt: 5 }] };
    const payload = buildBackup([track({})], prefs);
    expect(payload.favorites).toEqual(["abc"]);
    expect(payload.playlists[0]?.trackIds).toEqual(["abc"]);
  });

  it("restaura a pasta da música que já tem áudio no aparelho", () => {
    const payload = buildBackup([track({})], defaultPrefs);
    const noPasta = track({ id: "cloud-abc", source: "cloud", folderName: undefined, path: undefined, url: "https://x/y" });
    const r = mergeBackup(payload, [noPasta], defaultPrefs);
    expect(r.folderInfo).toEqual([{ id: "cloud-abc", folderName: "MinhaPasta", path: "MinhaPasta/forro.mp3" }]);
    expect(r.missing).toEqual([]);
  });

  it("avisa quando a faixa não tem áudio neste aparelho", () => {
    const payload = buildBackup([track({})], defaultPrefs);
    const r = mergeBackup(payload, [], defaultPrefs);
    expect(r.missing).toEqual(["Forró de sábado"]);
    expect(r.folderInfo).toEqual([]);
  });

  it("não cria playlist vazia nem repete a que já existe", () => {
    const prefs = { ...defaultPrefs, playlists: [{ id: "p1", name: "Festa", trackIds: ["cloud-abc"], createdAt: 5 }] };
    const payload = buildBackup([track({})], prefs);
    const live = track({ id: "cloud-abc", source: "cloud", url: "https://x/y" });
    const r = mergeBackup(payload, [live], prefs);
    expect(r.playlists).toHaveLength(1);
    expect(r.playlists[0]?.trackIds).toEqual(["cloud-abc"]);
    expect(r.favorites).toEqual([]);
  });

  it("traz de volta favoritos que sumiram do aparelho", () => {
    const prefs = { ...defaultPrefs, favorites: ["local-abc"] };
    const payload = buildBackup([track({})], prefs);
    const live = track({ id: "cloud-abc", source: "cloud", url: "https://x/y" });
    expect(mergeBackup(payload, [live], defaultPrefs).favorites).toEqual(["cloud-abc"]);
  });

  it("não repete a mesma música quando ela existe local e na nuvem", () => {
    const fingerprint = "abcdef0123456789abcdef0123456789abcdef0123456789";
    const importada = track({ id: "local-x", fingerprint, folderName: "MinhaPasta", path: "MinhaPasta/forro.mp3" });
    const copia = track({ id: `cloud-${fingerprint}`, fingerprint, source: "cloud", folderName: undefined, path: undefined });
    const payload = buildBackup([importada, copia], defaultPrefs);
    expect(payload.tracks).toHaveLength(1);
    expect(payload.tracks[0]?.folderName).toBe("MinhaPasta");
  });

  it("liga a faixa da conta ao áudio que voltou pela nuvem pelo nome do arquivo", () => {
    const fingerprint = "abcdef0123456789abcdef0123456789abcdef0123456789";
    const importada = track({ id: "local-x", fingerprint, folderName: "MeuForró", path: "MeuForró/faixa1.wav", title: "faixa1" });
    const payload = buildBackup([importada], defaultPrefs);
    // Aparelho novo: o áudio voltou pela nuvem sem metadados, só com o nome do arquivo.
    const voltou = track({ id: `cloud-${payload.tracks[0]?.fingerprint}.wav`, title: "faixa1", source: "cloud", url: "https://x/y.wav", fingerprint: undefined, folderName: undefined, path: undefined });
    const r = mergeBackup(payload, [voltou], defaultPrefs);
    expect(r.missing).toEqual([]);
    expect(r.folderInfo).toEqual([{ id: voltou.id, folderName: "MeuForró", path: "MeuForró/faixa1.wav" }]);
  });
});
