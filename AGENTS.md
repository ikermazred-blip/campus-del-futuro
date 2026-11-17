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

- 3D campus lives in `src/campus/`: pure data/maths (`assistants.ts`, `layout.ts`, `facade.ts`, `camera.ts`) import neither React nor three.js; scene components in `scene/` only draw them. Why: rules stay testable and the scene can change without touching data.
- The three.js scene (`CampusCanvas.tsx`) is loaded only via `React.lazy` inside `<ClientOnly>` from `CampusView.tsx`, which owns WebGL detection, the slow-load notice, error boundary and retry. Why: the route stays server-rendered and never loads forever.
- Scene art is procedural (canvas textures, no remote HDR/fonts/GLBs at runtime). Why: no third-party fetch can blank the scene.
- Assistant links navigate in the same tab via `openAssistant` (location.assign) — never `window.open` or iframes. Why: browser Back must return to the campus; covered by `src/campus/assistants.test.ts`.
- Selected building is kept in the `?edificio=` search param (replace navigation). Why: Back from an assistant restores the same view.
- Dev-only hook: `window.__campus = { scene, camera, gl }` for headless checks; `[data-scene-ready]` marks the first fully compiled frame.
