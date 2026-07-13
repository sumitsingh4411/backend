# OWASP Top 10

The **OWASP Top 10** is the industry's list of the most critical web security risks. You don't need to memorize the list — you need to recognize these patterns in your own code. Here are the ones that bite backend devs hardest.

## 1. Injection (SQL, NoSQL, command)

Untrusted input is concatenated into a query and becomes **code**.

```js
// ❌ VULNERABLE — input becomes SQL
db.query(`SELECT * FROM users WHERE email = '${email}'`);
// email = "' OR '1'='1"  →  returns every user
```

**Fix: parameterized queries.** The driver sends code and data separately, so input can never become SQL.

```js
// ✅ SAFE
db.query("SELECT * FROM users WHERE email = $1", [email]);
```

## 2. Broken Access Control (the #1 risk today)

Forgetting to check *this* user may touch *this* resource.

```js
// ❌ Any logged-in user can read anyone's order (IDOR)
app.get("/orders/:id", requireAuth, async (req, res) => {
  res.json(await db.orders.find(req.params.id));
});

// ✅ Verify ownership
const order = await db.orders.find(req.params.id);
if (order.userId !== req.user.id) return res.status(403).end();
```

This class — **IDOR** (Insecure Direct Object Reference) — is the most common real-world breach. Check ownership on **every** protected resource.

## 3. Cryptographic Failures

Plaintext passwords, no HTTPS, secrets in git, weak/fast hashes. → Use TLS everywhere, argon2/bcrypt, and a secrets manager.

## 4. XSS (Cross-Site Scripting)

Untrusted input rendered as HTML, letting an attacker run JS in another user's browser (and steal their token).

- **Escape output** (modern frameworks like React do by default — don't defeat it with `dangerouslySetInnerHTML`).
- Set **`HttpOnly`** on session cookies so stolen JS can't read them.
- Add a **Content-Security-Policy** header.

## 5. CSRF (Cross-Site Request Forgery)

A malicious site makes the victim's browser send an authenticated request to *your* site (cookies ride along automatically).

- Use **`SameSite=Lax/Strict`** cookies (this alone stops most CSRF).
- Use **anti-CSRF tokens** for state-changing forms.
- Note: token-in-header auth (not cookies) is naturally immune.

## 6. Security Misconfiguration

Default credentials, debug mode on in production, verbose stack traces leaked to users, permissive CORS (`*`), open cloud buckets. → Harden defaults; never leak internals in error responses.

## 7. Vulnerable Dependencies

Your code is fine; a library you use isn't. → Run `npm audit` / Dependabot / Snyk. Patch promptly. Most breaches come through known, unpatched CVEs.

## 8. Identification & Authentication Failures

No rate limiting on login, weak session handling, tokens that never expire. → Rate-limit, expire tokens, offer MFA.

## 9. Insecure Design

The bug is in the *design*, not the code — e.g. a password-reset flow that leaks whether an account exists, or trusting a client-sent price. → Threat-model features before building them.

## 10. Insufficient Logging & Monitoring

You were breached in March and found out in September. → Log auth events and failures, alert on anomalies (see *Observability*).

## The mental model

Almost all of it reduces to two habits:

> **1. Never trust input.** Validate and parameterize everything from the outside.
> **2. Always check authorization.** On every request, for every resource, server-side.

## Key takeaways

- **Injection** → parameterized queries, always.
- **Broken access control / IDOR** is the most common breach — verify ownership server-side.
- **XSS** → escape output + HttpOnly + CSP. **CSRF** → SameSite cookies + tokens.
- Patch dependencies, don't leak errors, log security events.
