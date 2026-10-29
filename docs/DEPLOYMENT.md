# Deployment / rollback

## Actual deployment (2026-10-29)
- Cloudflare connected account: `个人i`, account ID `a440d52410a88bb658b59b48ac10e7fd`.
- Zone: `feiling.ccwu.cc`, zone ID `943ece486639848f8efabb9ce041a27f` (active).
- Custom Domain: `device.feiling.ccwu.cc`, domain ID `b259152d85f4d8afc17095b7bcb7d6a667b6bcee`.
- Target Worker: `personal-device-lab`. Cloudflare Custom Domain PUT returned success and created only the new managed proxied DNS record. Prior apex/read bindings stayed unchanged in read-back.
- Standalone Worker module source: `worker.mjs` committed to this repository (current v0.2.0).
- Configuration / TLS ID assignment: verified through Cloudflare API, **not proof that real Android or desktop browser can reach the site**.

## Developer workflow
1. `npm test`: restore editable HTML and Worker source from committed self-contained Worker, and execute Node tests.
2. Make local changes to generated `src/index.html` or `src/worker.mjs`. The **editable HTML** is restored deterministically from the deployed module.
3. Before deploying changes: rerun unit tests, test locally in a real browser and compare against the Cloudflare staging endpoint. Avoid writing additional production bindings by default.
4. Never sync to a different Cloudflare account; do not use a generic default credential if multiple accounts are configured.
5. GitHub Actions is CI **only**. No deploy secrets or auto-deploy triggers have been added.

## Rollback
- To detach the new site, first verify that the domain ID above still belongs to `device.feiling.ccwu.cc` with service `personal-device-lab`. Delete only this Worker Custom Domain; Cloudflare will handle the managed DNS association. Do not delete or change the apex/read domain bindings.
- To roll back Worker code, redeploy a previously audited standalone `worker.mjs` from commit history after validation; verify the exact account and worker name before running.
- There is no KV/D1/R2 data to migrate or roll back. Client-side local reports can remain on user devices until explicitly cleared.

## Verification required after publication
- Read `https://device.feiling.ccwu.cc/api/health` in an independent browser: require HTTP 200 and `version:0.2.0`.
- Test `/api/observe` with the user's explicit approval and distinguish server edge observations from browser claims.
- Capture real Android and Windows results with timestamps, report IDs and provenance; no default report persistence.
- Native UID, filesystem/Binder restrictions, Play Integrity and DSH WebView isolation remain UNKNOWN until native evidence.
- Current external verification from the assistant's execution sandbox failed DNS lookup; do not report HTTP or browser tests as PASS.

## v0.2.0 verified release (2026-10-29)

- Isolated Cloudflare Worker upload: `personal-device-lab` only; account/zone/domain unchanged.
- GitHub PR: https://github.com/initial2024/dn/pull/1 (merged as `ca9cac8eb1f2b4ee127defcd40ba18db3356e1ca`).
- Source artifact blob SHA: `3e3e41da8140fd41217d5d31406d4ab94b8f137f`.
- Cloudflare API readback: Worker source contains `VERSION='0.2.0'`; pre-existing apex and reader DNS/domain associations unchanged.
- GitHub Actions: https://github.com/initial2024/dn/actions/runs/40850380542 — source/unit 26/26 PASS; external HTTPS smoke `HTTP_SMOKE=PASS HTTPS_HOST=device.feiling.ccwu.cc HEALTH_VERSION=0.2.0 HTML_LENGTH=29605`. This confirms HTTP response and published HTML presence, not real-device browser compatibility.
- Optional visitor ID is random 128-bit localStorage-only and enabled solely by user action. No API endpoint or server persistence is used for visitor identity. Exported JSON can contain the identifier if enabled. Disabling removes locally saved associations.
- **Still UNKNOWN:** real Android and Windows interactive acceptance, DSH isolated UID, native Binder/FD/file/network sandbox, WebView profile separation, platform attestation.
- Rollback to v0.1.0: retrieve reviewed previous standalone `worker.mjs` from main commit `36158612b72f365313861667800936b703862457` and redeploy **only** to `personal-device-lab` after validating source and scope. Do not change custom-domain/DNS bindings.
