# Personal Device Lab v0.2.1 — evidence-aware report comparison

This release fixes interpretation issues encountered when comparing authorized Android/Windows browser reports. No user report, fingerprint, IP address or visitor ID is added to this public repository.

- Compare union of report IDs, marking missing tests as **not run**, not failure.
- Distinguish same, different, not tested, redacted and unverified states; redacted IP must never count as a match.
- Viewport changes are annotated as potentially caused by browser toolbars or window state, not evidence of a different physical device.
- Synthetic storage readbacks returning false now report FAIL, whereas exceptions remain UNKNOWN.
- Stale asynchronous Web Audio and Client Hints callbacks cannot overwrite newer reports.
- Clarify that WebGL and UA are browser-provided values, not certified hardware.

Production deployment is gated on reproducible build CI and independent HTTPS smoke. Android native UID, Binder, sandbox and system integrity remain UNKNOWN. Private reports are stored only in the isolated seven-day KV namespace.
