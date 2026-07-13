# Sessions & JWT

HTTP is stateless, so after login the client must **prove who it is on every request**. There are two dominant ways to do that.

## Option 1: Server-side sessions

1. User logs in.
2. Server creates a **session** (a random ID + user data) and **stores it** (in memory, Redis, or a DB).
3. Server sends the session ID in a cookie.
4. Every request: browser sends the cookie → server looks the session up.

```
Cookie: session=8f3a...   →   server: sessions[8f3a] = { userId: 7 }
```

- ✅ **Revocable instantly** — delete the session server-side and the user is logged out.
- ✅ The ID is opaque and tiny.
- ❌ Requires **server-side storage** and a lookup on every request (shared store needed across multiple servers).

## Option 2: JWT (JSON Web Token)

The server signs a token containing the user's claims and sends it to the client. The server stores **nothing** — it just verifies the signature on each request.

A JWT is three base64 parts: `header.payload.signature`

```
eyJhbGciOiJIUzI1NiJ9 . eyJzdWIiOiI3Iiwicm9sZSI6ImFkbWluIn0 . 3xR8_kQ...
     header                       payload                      signature
```

```json
// The payload (decoded) — just JSON claims
{ "sub": "7", "role": "admin", "exp": 1789000000 }
```

The **signature** is the magic: it's computed from the header + payload + a **secret only the server knows**. Change one character of the payload and the signature no longer matches → the token is rejected.

- ✅ **Stateless** — no lookup, scales across servers trivially.
- ❌ **Hard to revoke** — it's valid until it expires. (Mitigate with short expiry + refresh tokens.)

## Critical JWT facts people get wrong

- **Signed ≠ encrypted.** Anyone can *read* a JWT payload (it's just base64). **Never put secrets in it.**
- **Always verify the signature** server-side — never trust the payload alone.
- **Always set an expiry** (`exp`). A token that never expires is a permanent skeleton key.
- **Never accept `alg: none`** — a classic attack that skips verification.

```js
// JavaScript (jsonwebtoken)
const token = jwt.sign({ sub: user.id, role: user.role }, SECRET, { expiresIn: "15m" });
const claims = jwt.verify(token, SECRET);   // throws if tampered or expired
```

```python
# Python (PyJWT)
token = jwt.encode({"sub": user.id, "exp": exp}, SECRET, algorithm="HS256")
claims = jwt.decode(token, SECRET, algorithms=["HS256"])
```

```go
// Go (golang-jwt)
tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
signed, _ := tok.SignedString([]byte(secret))
```

```java
// Java (jjwt)
String jws = Jwts.builder().subject(userId).signWith(key).compact();
Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(jws).getPayload();
```

## The refresh-token pattern

Best of both worlds:
- A short-lived **access token** (~15 min) — used on every request, stateless.
- A long-lived **refresh token** — stored server-side, used only to mint new access tokens, and **revocable**.

## Which should you use?

| Sessions | JWT |
|---|---|
| Easy revocation | Easy scaling |
| Classic web apps | APIs, mobile, microservices |
| Needs shared store | Needs short expiry + refresh |

**Sessions are a perfectly good, often *safer*, default.** JWTs are not automatically more "modern" — choose for the trade-off you need.

## Key takeaways

- **Sessions**: server stores state, cookie holds an opaque ID → instantly revocable.
- **JWT**: signed, self-contained claims → stateless and scalable, but hard to revoke.
- JWTs are **readable** — signed, not encrypted. No secrets inside. Always set `exp` and verify the signature.
- Use short access tokens + revocable refresh tokens for the best of both.
