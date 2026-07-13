# Headers & Cookies

If the body is the *payload*, **headers** are the *metadata* — key/value lines that describe the request or response. Cookies are a special header that gives stateless HTTP a memory.

## Headers you'll meet daily

**Request headers:**
- `Content-Type: application/json` — what format the body is in.
- `Accept: application/json` — what format you want back.
- `Authorization: Bearer <token>` — proof of identity.
- `User-Agent` — what client is calling.

**Response headers:**
- `Content-Type` — the format of the response body.
- `Cache-Control: max-age=3600` — how long clients may cache this.
- `Set-Cookie` — asks the browser to store a cookie.
- `Location` — where to go (redirects, newly created resources).

## Cookies: HTTP's memory

HTTP is stateless, so how do you stay logged in? The server sends a cookie once; the browser stores it and **automatically re-sends it on every matching request.**

```http
# Server → browser (once)
Set-Cookie: session=abc123; HttpOnly; Secure; SameSite=Lax

# Browser → server (every request after)
Cookie: session=abc123
```

## Cookie flags = security

The flags are not optional decoration — they're your defense:

- **HttpOnly** — JavaScript can't read it → protects against XSS token theft.
- **Secure** — only sent over HTTPS → can't leak on plain HTTP.
- **SameSite** — restricts cross-site sending → helps prevent CSRF.
- **Max-Age / Expires** — when it dies.

## Reading and setting in code

```js
// JavaScript (Express)
app.get("/me", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  res.cookie("session", "abc123", { httpOnly: true, secure: true, sameSite: "lax" });
  res.json({ token });
});
```

```python
# Python (FastAPI)
@app.get("/me")
def me(authorization: str | None = Header(default=None)):
    resp = JSONResponse({"ok": True})
    resp.set_cookie("session", "abc123", httponly=True, secure=True, samesite="lax")
    return resp
```

```go
// Go
token := r.Header.Get("Authorization")
http.SetCookie(w, &http.Cookie{Name: "session", Value: "abc123", HttpOnly: true, Secure: true})
```

```java
// Java (Spring)
ResponseCookie c = ResponseCookie.from("session", "abc123")
    .httpOnly(true).secure(true).sameSite("Lax").build();
```

## Key takeaways

- Headers carry **metadata**: content type, auth, caching, cookies.
- Cookies let stateless HTTP "remember" you — the browser resends them automatically.
- Always set **HttpOnly + Secure + SameSite** on session cookies.
- `Content-Type`/`Accept` negotiate the data format both ways.
