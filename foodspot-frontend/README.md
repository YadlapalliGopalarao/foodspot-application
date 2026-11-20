# FoodSpot — Windows frontend

A Vue 3 food ordering application using Composition API (`<script setup>`), Pinia, Vue Router, Axios and plain CSS. This archive contains one project only, intended for your current Windows Node.js 24.21.0 / npm 12.1.0 installation. No WSL, CDN, Docker, backend or database setup is required to use demo mode.

## Start in Windows Command Prompt (CMD)

Extract into a new folder; do not merge with earlier FoodSpot projects or copy old `node_modules` or lockfiles. Open the inner `foodspot-frontend` folder in VS Code. Use the terminal in the folder containing `package.json`.

```cmd
npm run doctor
npm install --package-lock-only --ignore-scripts --no-audit
npm audit
```

The second command resolves dependencies without installing them or running installation scripts. If the audit reports high or critical vulnerabilities, stop and review the report before continuing. Do not run `npm audit fix --force` or approve all installation scripts. If the audit is acceptable, run:

```cmd
npm ci
npm run verify
npm run dev
```

Open http://127.0.0.1:5173 in your Windows browser. Use this same address each time because demo data is stored per browser origin. Save a source file, then refresh the browser. Press Ctrl+C to stop the server.

For production output and local preview:

```cmd
npm run build
npm run preview
```

Open http://127.0.0.1:4173. Preview and development use different ports and therefore separate browser storage. The `dist/` folder is static output for a future production web server. The preview server itself is not intended for production. Commit the generated package-lock.json to source control.

## Why this project uses a different build tool

Your previous Vite project loaded a native Rollup binary blocked by Windows Application Control, and npm 12 blocked native esbuild's installation script. This edition uses `esbuild-wasm` and Vue's SFC compiler rather than Vite, native esbuild, Rollup or Rolldown. Vue Router 4.6.5 is selected to limit build-tool dependencies. The custom bundler supports the JavaScript script-setup SFCs, inline templates and global CSS in this project. It rebuilds on changes but has no Vite hot-module replacement. No global npm configuration or Windows security policy changes are required by this project. If a security policy blocks any code, stop and consult your administrator; do not disable the policy.

If npm shows an unexpected blocked install script, review `npm install-scripts ls` and the package details. Do not approve it automatically. If any command fails, retain the folder and paste the full error. You do not need to reinstall Node or delete other projects.

## Demo features

Register using a fictional email (learner@example.invalid) and made-up password of at least 8 characters. Browse and search foods, add to cart, place orders, view notifications, cancel orders, and log out and log in again to see earlier orders. Admin food CRUD is intentionally available to everyone in demo mode. Demo accounts and order data are held in browser storage; this is not real authentication. Cart resets on refresh. Never use real passwords or personal data.

## Future Laravel API integration

Copy `.env.example` to `.env`, configure the API URLs and set `VITE_DEMO=false` once the backend exists, then restart or rebuild. Four Axios clients, separate Pinia stores and the proposed request/response contract in `docs/API-CONTRACT.md` are included. Real bearer tokens are held in memory until a production session strategy is implemented. Laravel, RDS and deployment are not included.

## Verification and limitations

The authoring environment has Node 22.16.0 (Linux), not your Windows environment. It cannot resolve registry.npmjs.org (EAI_AGAIN), so exact resolved dependencies, audit, SFC compilation, production build and browser runtime could not be checked. No fabricated lockfile, node_modules or build output is shipped. All JavaScript syntax checks and three standalone demo logic tests were executed. This alternative is designed to avoid the specific native binary failure, not guaranteed to be vulnerability-free or compatible with every Windows policy.
