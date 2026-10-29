# Security and privacy scope

This is a self-controlled observation and isolation verification lab, not a tool to deceive other websites, evade identity checks or forge device integrity results.

- Public site has no login or persistent server report database.
- It does not intentionally store complete IPs or persistent browser fingerprints in application logic. Cloudflare edge infrastructure may maintain operational metadata independently.
- Never upload sensitive files or secrets; synthetic upload endpoint ignores content and reports aggregate byte counts.
- Queries reporting full exit IP require explicit user action. The IP is a proxy/VPN/NAT exit as observed by Cloudflare, not a verified physical location.
- Importing arbitrary report JSON is untrusted data. Compare only after validating schema/size.
- No native platform or OS-isolation claims before native instrumentation and authorized local tests.
- Report misuse or a privacy regression by opening an issue without attaching real fingerprints, IP addresses, API keys, or private data.

## Opt-in browser-local visitor ID (v0.2.0)

This feature is **off by default** on new browsers. When enabled, it generates one 128-bit random string using `crypto.getRandomValues` and stores it only in this origin's localStorage, not in cookies, HTTP headers, URLs or server logs. Reports may embed the value upon export, which makes manually shared files linkable by recipients. Disable or reset via the UI to scrub the ID from the site's saved report history. Browser data copies, resets and private browsing can change or duplicate IDs; never interpret as verified hardware identity.
