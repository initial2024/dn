# Deployment / rollback

## Actual deployment (2026-10-29)
- Cloudflare connected account: `个人i`, account ID `a440d52410a88bb658b59b48ac10e7fd`.
- Zone: `feiling.ccwu.cc`, zone ID `943ece486639848f8efabb9ce041a27f` (active).
- Custom Domain: `device.feiling.ccwu.cc`, domain ID `b259152d85f4d8afc17095b7bcb7d6a667b6bcee`.
- Target Worker: `personal-device-lab`. Cloudflare Custom Domain PUT returned success and created only the new managed proxied DNS record. Prior apex/read bindings stayed unchanged in read-back.
- Standalone Worker module source: `worker.mjs` committed to this repository.
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
- Read `https://device.feiling.ccwu.cc/api/health` in an independent browser: require HTTP 200 and `version:0.1.0`.
- Test `/api/observe` with the user's explicit approval and distinguish server edge observations from browser claims.
- Capture real Android and Windows results with timestamps, report IDs and provenance; no default report persistence.
- Native UID, filesystem/Binder restrictions, Play Integrity and DSH WebView isolation remain UNKNOWN until native evidence.
- Current external verification from the assistant's execution sandbox failed DNS lookup; do not report HTTP or browser tests as PASS.
