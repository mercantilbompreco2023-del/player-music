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
- All playback state lives in `src/lib/music/player-context.tsx` (single HTMLAudioElement + Media Session); pages only call its actions — keeps one audio source of truth.
- Pure queue/search helpers live in `src/lib/music/queue.ts` with tests in `src/test/music-queue.test.ts`.
- Track sources go through the `CatalogProvider` interface (`src/lib/music/catalog.ts`); only original CC0 demo tracks and user files are allowed, never commercial/DRM content.
- Imported audio blobs persist in IndexedDB, prefs/favorites/playlists in localStorage (device-only, private by design).
- Home cards live in `app_cards` and route only by `function_key` via `src/lib/cards.ts`, so renaming/reordering can never change a card's destination.
- Admin authorization is enforced by RLS + `has_role` (roles in `user_roles`); audit rows are written only by DB triggers. UI hiding is cosmetic. First admin is granted via SQL by the project owner, never by code or fixed passwords.
- Folder/file imports go through `importItems` + `src/lib/music/import.ts`; duplicates are detected by content fingerprint (size + SHA-256 of head/tail), and each track is saved atomically so cancelling never leaves partial records.
