# Personal Device Lab

Independent browser and controlled-server environment tests for **Android, Windows, DSH WebView and authorized emulators**.

- **Live custom domain**: https://device.feiling.ccwu.cc/
- **Cloudflare Worker**: `personal-device-lab`
- **Cloudflare account**: dedicated connected `个人i` account; zone `feiling.ccwu.cc`.
- **Browser tests**: platform, viewport, WebGL, browser feature support, browser-local synthetic storage.
- **Server tests**: own Cloudflare edge request headers/observable TLS and protocol, synthetic uploads, fetch, streaming and optional WebSocket echo.
- **Privacy**: no third-party trackers, no application database, no persistent server-side fingerprint. Cloudflare platform logging may still exist separately.
- **Limits**: Web browser results cannot establish genuine Android hardware, iOS identity, OS sandbox/UID or integrity attestation.

## Source layout
- `worker.mjs` — self-contained deployed module, with the tested HTML bundled into the module.
- `tests/` — Node.js regression tests for the module's HTTP behavior.
- `docs/` — deployment/recovery and the proposed native DSH bridge contract.
- `schema/` — versioned report data format.

The standalone module is the actual source artifact deployed at Cloudflare on 2026-10-29. The complete editable source tree (original `src/index.html`, `src/worker.mjs`, build helpers) is also included in the downloadable versioned release ZIP provided in the project conversation. Do not assume the single-file module is easy to maintain as-is: before further feature work, restore and commit the editable HTML source.

## Status
- Cloudflare custom domain and managed DNS record: **API-confirmed**.
- Existing root `feiling.ccwu.cc` and `read.feiling.ccwu.cc` bindings: **unchanged** during pre/post checks.
- Node.js local regression suite: **12/12 PASS**, does **not** certify real-device behavior.
- Real external HTTP read, Android, Windows and DSH native isolation: **UNKNOWN** until tested and evidence recorded.
- Do not report `PASS` for attestation/UID/network/file isolation based only on JavaScript-visible attributes.

## Boundaries
No modifications to Temp Mail, English reader, InternalBeyond, or any third-party endpoint. All testing uses synthetic records only. User must explicitly start tests; no background fingerprint persistence.
