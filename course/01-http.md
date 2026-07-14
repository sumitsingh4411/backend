<div align="center">

<sub>[← BackendPath](../README.md)</sub>

# 🌐 Part 1 · HTTP

**Requests, responses, methods, status codes, cookies.**

<sub>`3 min read`</sub>

</div>

---

### In this part

- [1.1 A request and a response, in full](#11-a-request-and-a-response-in-full)
- [1.2 The methods, and the property that matters](#12-the-methods-and-the-property-that-matters)
- [1.3 Status codes that mean something](#13-status-codes-that-mean-something)
- [1.4 Cookies, and the flags that are free security](#14-cookies-and-the-flags-that-are-free-security)
- [1.5 HTTP/1.1 vs 2 vs 3 (the 30-second version)](#15-http11-vs-2-vs-3-the-30-second-version)

---

## 1.1 A request and a response, in full

```http
GET /api/users/42 HTTP/1.1          ← method, path, version
Host: api.example.com               ← which site (one IP hosts many)
Authorization: Bearer eyJhbGci...   ← who I am
Accept: application/json            ← what I can understand
User-Agent: Mozilla/5.0 ...
```

```http
HTTP/1.1 200 OK                     ← status line ← THE MOST IMPORTANT LINE
Content-Type: application/json      ← what I'm sending back
Cache-Control: max-age=60           ← how long you may reuse this
Set-Cookie: session=abc; HttpOnly   ← remember this and send it back

{"id": 42, "name": "Ada"}           ← the body
```

## 1.2 The methods, and the property that matters

| Method | Safe? | **Idempotent?** | Means |
|---|:--|:--|---|
| `GET` | ✅ | ✅ | Read. Never changes anything. |
| `PUT` | ❌ | ✅ | Replace the whole resource. |
| `PATCH` | ❌ | usually | Change some fields. |
| `DELETE` | ❌ | ✅ | Gone. Deleting twice is still gone. |
| `POST` | ❌ | **❌ NO** | Create / do. **The dangerous one.** |

> **Idempotent = doing it twice has the same effect as doing it once.**
>
> This is not trivia. Networks are flaky, so clients **retry**. A retried `GET` is harmless. A retried `POST /payments` **charges the card twice**. Everything except POST is naturally safe to repeat — POST needs help, and that help is called an [idempotency key](03-apis.md#33--idempotency-keys--how-you-stop-double-charges).

## 1.3 Status codes that mean something

| Code | Say it when |
|---|---|
| `200 OK` | It worked, here's the body |
| `201 Created` | You made something (return it + a `Location` header) |
| `202 Accepted` | Queued — it'll happen later |
| `204 No Content` | It worked, nothing to send back |
| `400 Bad Request` | Malformed / invalid input |
| `401 Unauthorized` | **I don't know who you are** (really: *unauthenticated*) |
| `403 Forbidden` | **I know who you are, and no** |
| `404 Not Found` | No such thing — also the right way to *hide* a thing |
| `409 Conflict` | Clashes with current state (duplicate, version mismatch) |
| `422 Unprocessable` | Syntax fine, meaning wrong (email already taken) |
| `429 Too Many Requests` | Rate limited — **always** add `Retry-After` |
| `500 Internal` | We broke. Never leak the stack trace. |
| `503 Unavailable` | Overloaded / down |

> ### 🚨 `200 OK { "error": true }` is the worst thing you can do
>
> Every client, proxy, retry policy, monitor and alert in the world reads **the status code**. Lie in it and none of them work: your error rate shows 0%, your dashboards are green, your users are stuck, and nobody gets paged.
>
> **The status line is part of your API.** It is not decoration.

## 1.4 Cookies, and the flags that are free security

The server says `Set-Cookie: session=abc`. The browser sends it back on **every** subsequent request. That's how a stateless protocol remembers you.

| Flag | What it buys you |
|---|---|
| `HttpOnly` | JavaScript **can't read it** → an XSS bug can't steal the session |
| `Secure` | Sent only over HTTPS → never leaks in plaintext |
| `SameSite=Lax` | Not sent on cross-site requests → blocks most CSRF |

> **Put your auth token in an `HttpOnly` cookie, not `localStorage`.** Anything in `localStorage` is readable by any script on the page — one XSS, or one compromised npm package, and the token walks out the door.

## 1.5 HTTP/1.1 vs 2 vs 3 (the 30-second version)

- **HTTP/1.1** — one request at a time per connection. Slow things block fast things (head-of-line blocking).
- **HTTP/2** — many requests **multiplexed** over one connection. Binary, header compression. Big win.
- **HTTP/3** — same, but over **QUIC (UDP)** instead of TCP, so a single lost packet doesn't stall every stream. Better on flaky mobile networks.

You rarely choose this. Your load balancer does. Just know *why* it got faster.

---

<div align="center">

[← 🌱 Part 0 · Foundations](00-foundations.md) · [**Contents**](../README.md#contents) · [🖥️ Part 2 · Servers & concurrency →](02-servers-and-concurrency.md)

<sub><a href="#top">↑ back to top</a></sub>

</div>
