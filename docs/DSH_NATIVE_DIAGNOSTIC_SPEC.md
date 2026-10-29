# Proposed DSH native isolation diagnostic contract (not implemented)

All native tests require a separate build/authorization and must not be simulated by JavaScript.

## Safety
- Explicit user action starts an isolated run; no background device scanning.
- Generate synthetic random challenge files/credentials in the app's own private diagnostic directory only.
- Never access real private user files, passwords, SMS, API keys, other app private storage or external network hosts.
- No third-party uploads. Diagnostic evidence stays local unless the user grants explicit per-report export approval.
- No WebView Javascript bridge may arbitrarily read files or execute shell commands.

## Android properties to test
- `Process.myUid()` observed in host and android:isolatedProcess Service, also PID and package context.
- A synthetic host-private challenge: isolated Service must fail unauthorized read; report no access with errno/exception evidence.
- A synthetic token broker with one-time consume, expiry, revoke, target binding, and restart invalidation.
- Binder permissions and file-descriptor transfers: use explicit negative tests with synthetic handles and authorization boundaries.
- Network deny test: only controlled loopback or own lab endpoint, never arbitrary third-party IPs.
- WebView profile/storage isolation: only on-device synthetic cookies and IndexedDB values across independently configured profiles.
- System integrity: UNKNOWN unless an authorized official Android integrity API provides cryptographically verifiable signed output. Server must validate proofs; no synthetic "PASS".
- Compatibility user-agent/device mode is a front-end behavior mode, not a platform identity change.

## Evidence record
```json
{
  "schema": "personal-device-lab/native-v1",
  "testId": "random-ephemeral-value",
  "requestedAt": "ISO-8601 timestamp",
  "component": "host|isolated-service|webview",
  "case": "host-private-challenge-read",
  "observed": {"uid": null, "canRead": null},
  "source": "Android platform API",
  "status": "UNKNOWN",
  "limitations": "No native build/evidence submitted"
}
```

Only `PASS`, `FAIL`, or `UNKNOWN` are permitted. Report UNKNOWN when test preconditions or permission boundaries are uncertain; never label browser-visible mock data as native evidence.
