# HTTP & HTTPS

**HTTP** (HyperText Transfer Protocol) is the language browsers and servers use to talk. Every time you load a page or call an API, you're speaking HTTP. As a backend dev, this is your native tongue.

## The shape of HTTP

HTTP is a simple text-based **request → response** protocol:

```http
GET /products/42 HTTP/1.1
Host: shop.example.com
Accept: application/json
```

The server answers:

```http
HTTP/1.1 200 OK
Content-Type: application/json

{ "id": 42, "name": "Keyboard", "price": 79 }
```

That's it — a request with a method + path + headers, and a response with a status + headers + body. Everything else builds on this.

## Key properties

- **Stateless** — each request is independent and self-contained.
- **Text-based** (in HTTP/1.1) — human-readable, easy to debug.
- **Extensible** — headers let you add metadata without changing the protocol.

## HTTP vs HTTPS

**HTTPS is HTTP wrapped in TLS encryption.** Without it, anyone between the client and server (coffee-shop wifi, your ISP) can read or modify the traffic.

| | HTTP | HTTPS |
|---|---|---|
| Port | 80 | 443 |
| Encrypted | ❌ | ✅ (TLS) |
| Tamper-proof | ❌ | ✅ |
| Trust | none | certificate-verified |

HTTPS gives you three things: **confidentiality** (nobody can read it), **integrity** (nobody can change it), and **authenticity** (you're really talking to the right server, proven by a certificate).

## The rule today

**Always use HTTPS.** It's free (Let's Encrypt), fast, and required for many modern browser features. Serving login or payment over plain HTTP is a serious bug.

## Key takeaways

- HTTP = the request/response language of the web.
- A request = method + path + headers (+ body); a response = status + headers + body.
- HTTP is stateless.
- HTTPS = HTTP + TLS: encrypted, tamper-proof, authenticated. Always use it.
