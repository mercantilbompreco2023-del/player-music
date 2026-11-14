<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Track visuals are device-only IndexedDB blobs; videos remain muted and follow the shared audio clock to prevent competing sound sources.
- Account audio uploads retain the local blob and stable track ID; merge remote listings by fingerprint/path to avoid duplicate library entries.
- Keep the legacy `/index` address as a redirect to `/`, so older app links never show a missing page.
- Home playback controls use HomePlayer and the shared player context; artwork is illustrative, while artists and playlists derive only from the user's library.
- All playback state lives in `src/lib/music/player-context.tsx` (single HTMLAudioElement + Media Session); pages only call its actions — keeps one audio source of truth.
- Pure queue/search helpers live in `src/lib/music/queue.ts` with tests in `src/test/music-queue.test.ts`.
- Track sources go through the `CatalogProvider` interface (`src/lib/music/catalog.ts`); only original CC0 demo tracks and user files are allowed, never commercial/DRM content.
- Imported audio blobs persist in IndexedDB, prefs/favorites/playlists in localStorage (device-only, private by design).
- Home cards live in `app_cards` and route only by `function_key` via `src/lib/cards.ts`, so renaming/reordering can never change a card's destination.
- Admin authorization is enforced by RLS + `has_role` (roles in `user_roles`); audit rows are written only by DB triggers. UI hiding is cosmetic. First admin is granted via SQL by the project owner, never by code or fixed passwords.
- Folder/file imports go through `importItems` + `src/lib/music/import.ts`; duplicates are detected by content fingerprint (size + SHA-256 of head/tail), and each track is saved atomically so cancelling never leaves partial records.
- Android APK wraps the published URL via Capacitor (`capacitor.config.ts`, `android-shell/`); SSR app has no static webDir.
- Native Android playback: JS player mirrors state to `MediaPlayback` plugin (`src/lib/music/native-media.ts`) -> foreground `MediaPlaybackService`; audio itself still plays in the WebView.
- Background playback preference is hydrated before native media registration; disabling or unmounting stops the service without replacing the shared audio player.
- APK folder import uses native `FolderPicker` plugin (SAF tree, `src/lib/music/native-folder.ts`) because Android WebView ignores webkitdirectory; files are read one at a time to limit memory.
- Saved folder cards derive from persisted track folder metadata through `src/lib/music/folders.ts`; legacy relative paths remain supported without requesting device access again.
- Artist folders use the pure grouping helper in `src/lib/music/folders.ts`; selected folders include their kind so identical artist and physical folder names cannot mix track lists.
- Folder playback uses the shared player's explicit ordered/shuffle mode, so queue creation and shuffle preference change together without stale toggles.
- Android folder grants use persisted read-only SAF permissions and local grant checks; imported audio remains an IndexedDB copy, independent of later grant revocation.
- Library CSV exports contain metadata only and never expose playback URLs, tokens, or audio blobs.
- Android CSV export uses ACTION_CREATE_DOCUMENT through LibraryExport; browser download links are not reliable in WebView.
- Android signing keys stay outside the repository and source archives; verify APK certificates before claiming update compatibility.
- AI playlist selection runs in an authenticated server function with validated metadata only; verify IDs against the provided library and require explicit saving of the preview.
- Account library backup (`public.library_backups`, `src/lib/music/backup*.ts`) stores metadata only — never playback URLs or audio blobs; restored folders are re-attached through localStorage folder hints so they survive reloads, and audio itself still comes from cloud copies or a fresh import.
