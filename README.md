# Campus del Futuro

Build SCHOOL AI WORLD as a polished Spanish interactive 3D realistic school campus web app, not a static mockup. Use Three.js / React Three Fiber: elevated isometric camera, realistic modern school buildings with detailed facades/windows/doors/roofs, landscaped courtyard, paved paths, trees, benches, lawns, warm daylight, believable shadows, premium architectural visualization style (not cartoon, not floating island). Six distinct clickable buildings with large legible Spanish signage, hover highlights, smooth camera movement, orbit and zoom. Header with SCHOOL AI WORLD and “Selecciona un edificio para entrar”. On click show accessible detail panel with full name, description and “Abrir asistente”. Also provide a responsive list of all assistants for mobile/accessibility. Clicking “Abrir asistente” must navigate in SAME TAB (target _self / location.assign) so browser Back returns to campus; do not iframe Gemini. Spanish UI, responsive, accessible. Never abbreviate names. Avoid endless loading; add WebGL fallback/error and retry.

Use exactly these six assistants and URLs:
1 Profesor particular — “Explicaciones paso a paso y ayuda con tus asignaturas.” — https://gemini.google.com/gem/1XOeUy-EK4DbAuO9wESBDb1ZIEEmaip_5?usp=sharing
2 Planificador de estudios y tareas — “Organiza tus horarios, deberes y sesiones de estudio.” — https://gemini.google.com/gem/1Oic5JUevA-1TPOph29PjX0_vOHZlSqmL?usp=sharing
3 Preparador de exámenes — “Repasa contenidos y practica para preparar tus exámenes.” — https://gemini.google.com/gem/1hqcZy3CGT4C3aBysWqFUNRQkrLze5OwY?usp=sharing
4 Entrenador de exposiciones orales — “Practica presentaciones, expresión oral y comunicación.” — https://gemini.google.com/gem/1hZNLTOxBkgsG4z2IS29rTc-yVjqW1pOQ?usp=sharing
5 Asistente de trabajos y proyectos — “Prepara trabajos, investigaciones y proyectos escolares.” — https://gemini.google.com/gem/1SlMak_FI8iy1HVK8muV7roVL4-etviGu?usp=sharing
6 Orientador académico y profesional — “Explora opciones académicas y planifica tu futuro profesional.” — https://gemini.google.com/gem/1dyQEwZtwqQLtGeDoNDFJpmAL3cgO62FH?usp=sharing
Deliver a working preview.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ba480816-d080-4b45-a097-00ece1723f7e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
