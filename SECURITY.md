# Security and privacy scope

This is a self-controlled observation and isolation verification lab, not a tool to deceive other websites, evade identity checks or forge device integrity results.

- Public site has no login or persistent server report database.
- It does not intentionally store complete IPs or persistent browser fingerprints in application logic. Cloudflare edge infrastructure may maintain operational metadata independently.
- Never upload sensitive files or secrets; synthetic upload endpoint ignores content and reports aggregate byte counts.
- Queries reporting full exit IP require explicit user action. The IP is a proxy/VPN/NAT exit as observed by Cloudflare, not a verified physical location.
- Importing arbitrary report JSON is untrusted data. Compare only after validating schema/size.
- No native platform or OS-isolation claims before native instrumentation and authorized local tests.
- Report misuse or a privacy regression by opening an issue without attaching real fingerprints, IP addresses, API keys, or private data.
