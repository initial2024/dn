# Personal Device Lab — private report intake

**Upload site:** https://personal-device-lab-intake.automice2095.workers.dev/

This is a completely separate Cloudflare Worker from the production detector at https://device.feiling.ccwu.cc/. No existing DNS zone, Worker or report history is modified by the intake deployment.

## Deployment
- Dedicated Cloudflare connected account: `个人i` (`a440d52410a88bb658b59b48ac10e7fd`).
- Worker script: `personal-device-lab-intake`, hosted on `automice2095.workers.dev`.
- KV namespace: `personal-device-lab-private-intake-ttl7d` (`257d517cd8a5454d8d6b0ea352eee940`), binding `INTAKE_KV`.
- Invite token is never committed to GitHub or exposed by the Worker; it is supplied separately in the URL **fragment**. Browsers do not send URL fragments in ordinary HTTP requests.
- Invite records are stored as `permit:<sha256(ticket)>` and expire after **48 hours**. The ticket is a bearer capability; do not publish/share it.
- Uploads are stored as `report:<sha256(ticket)>:android-v1`, `...:android-v2`, `...:windows`, with a per-upload **604800 second (7 day) KV TTL**.
- Only the user-initiated POST endpoint can write reports. There is **no HTTP endpoint that returns report bodies to website visitors**, even with a ticket. Readback is via the Cloudflare account administrator's API only.
- Duplicate uploads to the same slot replace its earlier value and reset its seven-day TTL.

## Data handling
- JSON up to 500 KB, image or PDF up to 2 MB. All file types are accepted only after file extension/content checks.
- JSON must match `schema:personal-device-lab/...` and have an `items` array of <=600 entries.
- Complete apparent exit IP fields always redacted; visitor identifier fields removed by default unless the user explicitly opts in. **No visual redaction is possible for screenshots/PDFs**, so users must inspect these before uploading.
- Filename, request IP and User-Agent are not saved by the application itself. Cloudflare may independently retain operational edge logs, outside this Worker's explicit persistence.
- Files may contain other identifying metadata in screenshots or free-text fields not handled by the JSON scrubber. Do not assume that every possible personal detail has been removed.

## User workflow
1. Use the private URL provided separately in chat (not the base URL alone).
2. Choose Android first-version, Android second-version or Windows slot; select the corresponding file and click Upload. Each slot can be updated.
3. Select **View received categories** on the upload page. This status endpoint returns only category labels.
4. Tell ChatGPT that all required slots are uploaded. The assistant may read the saved reports through the user's authorized Cloudflare connector; it must not confuse uploaded user-supplied reports with attestation or native Android evidence.

## Testing, status and risks
- `node --test tests/intake.test.mjs` checks authorization, privacy redaction, blob size and content validation, 7-day storage TTL, and absence of a public report download route.
- `node intake/smoke.mjs` checks live HTTPS page, health, denied anonymous read and rejected invalid requests. It does not use or expose the real invite token.
- GitHub Actions run `source-and-unit`, `public-http-smoke`, and `private-intake-smoke` without deploying code.
- The internal invite token and individual submitted data are not allowed in source, GitHub Actions logs, issues, pull requests or release assets.
- No claim is made that uploaded browser data proves Android UID/Binder/file security isolation.

## Administration
Using the authenticated Cloudflare API, list only keys with the `report:` prefix in the dedicated KV namespace, retrieve the expected three records, check schema/size/date, and compare their measured values with status and provenance. Do not return or publish the entire raw files in GitHub. Revoke an invite by deleting its corresponding `permit:` key; explicitly delete matching `report:` keys for early deletion. Normal cleanup is automatic TTL expiration.

**Do not expose this upload site as a general public file-sharing service.**
