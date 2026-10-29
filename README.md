# Personal Device Lab · 真实设备环境实验室

**Site:** https://device.feiling.ccwu.cc/  
**Source:** https://github.com/initial2024/dn  
**Cloudflare Worker:** `personal-device-lab` · Version `0.2.0`

Independent, privacy-conscious browser and network observation site for real Android phones, Windows browsers, Android WebView, and explicitly authorized test environments. No third-party fingerprint SDK, cross-site tracker or app-side server database. v0.2.0 adds optional browser-local pseudonymous IDs, only after explicit opt-in.

## Features
- Real browser-reported properties, WebGL, display, touch, browser feature support and synthetic storage probes.
- Cloudflare edge observation of request headers, apparent exit IP protocol, HTTP/TLS versions where supported, and optional full exit IP **only with explicit user choice**.
- Own-backend synthetic Fetch, file upload, chunk streaming and WebSocket echo.
- Optional 128-bit browser-local random visitor ID (opt-in, reset/revoke supported, never sent to server); same ID in two reports **does not prove** the same physical device.
- Browser-local JSON report export/import, human-readable comparison, print/PDF and optional user-controlled local history.
- Explicit `PASS` / `FAIL` / `UNKNOWN` semantics. Browser JavaScript **cannot attest** genuine hardware or Android sandbox isolation.

## Repository source (editable)
- `src/index.html` — complete, editable responsive browser UI.
- `src/worker.mjs` — complete, editable Cloudflare Worker source.
- `scripts/embed-html.mjs` — generate build-time HTML module.
- `scripts/make-bundle.mjs` — generate self-contained Worker module.
- `worker.mjs` — frozen self-contained v0.2.0 module **actually uploaded** on 2026-10-29.
- `tests/` — local behavior and reproducibility tests.
- `docs/DEPLOYMENT.md` — account isolation, rollback and verification rules.
- `docs/DSH_NATIVE_DIAGNOSTIC_SPEC.md` — *planned only*, native diagnostic bridge contract.
- `schema/` — machine-readable report schema.

## Build & tests
Requires Node.js 22+.

```bash
npm test
npm run dev
```

`npm test` validates live backend behavior in Node and rebuilds the self-contained module; the rebuilt artifact must be **byte-for-byte identical** to the frozen `worker.mjs`. CI runs tests on every push/PR, without deployment credentials.

`npm run restore:source` can reconstruct the original editable source from the frozen Worker as a recovery operation; it **overwrites** `src/index.html` and `src/worker.mjs`. Do not run it during ordinary development or after editing those files.

## Production and security boundary
Domain `device.feiling.ccwu.cc` was attached through the Cloudflare API to account `个人i` (account ID `a440d52410a88bb658b59b48ac10e7fd`), Worker `personal-device-lab`. Pre/post API checks confirmed the old root/read domain bindings were unchanged. CI success certifies only tests; actual Android/Windows/DSH testing remains separately evidence-gated.

Do not use this site to bypass third-party anti-fraud measures or impersonate an officially attested device. DSH native UID/Binder/file permissions and Android device integrity remain `UNKNOWN` until independently authorized native proofs are collected.

## v0.2.0 visitor ID controls

Enable only by checking the privacy option. The browser generates a random 128-bit localStorage ID, shows a masked suffix, and includes the full ID in explicitly exported JSON reports. Disabling scrubs the identifier from locally saved reports; resetting rotates it. No identity request header, cookie, tracking SDK or server-side visitor database was added. A repeated ID demonstrates shared/copied browser storage, **not** physical-device authenticity or DSH isolation.
