<div align="center">

<sub>[← BackendPath](../README.md)</sub>

# 🔐 Part 5 · Security

**Auth, passwords, JWT, OAuth, and the bugs that cause real breaches.**

<sub>`5 min read`</sub>

</div>

---

### In this part

- [5.1 The two questions, on every request](#51-the-two-questions-on-every-request)
- [5.2 The three rules everything else follows from](#52-the-three-rules-everything-else-follows-from)
- [5.3 Passwords — hash, never encrypt](#53-passwords--hash-never-encrypt)
- [5.4 Sessions vs JWT — the trade-off nobody tells you](#54-sessions-vs-jwt--the-trade-off-nobody-tells-you)
- [5.5 OAuth / "Sign in with Google", decoded](#55-oauth--sign-in-with-google-decoded)
- [5.6 Injection — untrusted data becoming code](#56-injection--untrusted-data-becoming-code)
- [5.7 The rest of the roll-call](#57-the-rest-of-the-roll-call)
- [5.8 🚨 Secrets — the trap everyone falls into once](#58--secrets--the-trap-everyone-falls-into-once)

---

## 5.1 The two questions, on every request

- **Authentication (AuthN)** — *who are you?* Answered **once**, at the door.
- **Authorization (AuthZ)** — *are you allowed to do this?* Checked on **every** action, for **this specific** resource.

> ### 🚨 The #1 web vulnerability is an authorization bug
>
> **Broken access control** tops the OWASP list. It is almost always this:
>
> ```js
> // ❌ You checked that they're logged in. You didn't check that it's THEIRS.
> app.get("/orders/:id", requireLogin, async (req, res) => {
>   const order = await db.orders.find(req.params.id);
>   res.json(order);          // user 42 just typed /orders/43 and read someone else's invoice
> });
>
> // ✅ Scope the query itself. Put the check IN the query.
> const order = await db.orders.findOne({
>   id: req.params.id,
>   user_id: req.user.id,     // ← the whole fix
> });
> ```
>
> This is called **IDOR**, and it is *everywhere*.

## 5.2 The three rules everything else follows from

1. **Never trust input.** Every byte from a client is hostile until validated. Validate against an **allowlist** of what's permitted, not a blocklist of what's banned — you cannot enumerate every bad input.
2. **Least privilege.** Every user, token and DB account gets the *minimum* access it needs. When something is compromised, this decides whether it's an incident or a catastrophe.
3. **Defense in depth.** No single control is trusted to hold.

## 5.3 Passwords — hash, never encrypt

> **Encryption is reversible. That is exactly what you don't want.** If *you* can decrypt a password, so can whoever steals your key. You must never be *able* to recover a password.

| Algorithm | Verdict |
|---|---|
| **Argon2id** | ✅ best choice today (memory-hard) |
| **bcrypt** | ✅ fine, battle-tested |
| `SHA-256`, `MD5` | ❌ **built for speed = built for cracking** |

Why slow ones? A GPU tries **billions** of fast hashes per second. A memory-hard function tuned to ~100ms makes mass cracking economically hopeless.

**Modern rules (NIST 800-63B):**
- ✅ Require **length**, not gibberish. A passphrase beats `P@ss1!`.
- ❌ **Drop composition rules.** "1 upper, 1 symbol" just produces `Password1!` on every site.
- ✅ **Check against breached lists** (Have I Been Pwned). This blocks more real attacks than any complexity rule.
- ❌ **No forced 90-day rotation.** It trains people to write passwords down and increment a digit.

## 5.4 Sessions vs JWT — the trade-off nobody tells you

| | **Server sessions** | **JWT (stateless)** |
|---|---|---|
| How | random id in a cookie; data in Redis | a signed token the server verifies with no lookup |
| **Revoke** | ✅ **instant** — delete the row | ❌ **you cannot un-issue it.** Valid until it expires. |
| Cost | one Redis lookup per request (trivial) | none |
| Verdict | **the safe default** | great for scale, but "logout" and "ban this user" become genuinely hard |

**If you use JWT, use the two-token pattern:** a short-lived **access token** (5–15 min, stateless) + a long-lived **refresh token** that *is* stored server-side and *can* be revoked.

**JWT footguns:** never accept `alg: none`; never let the client choose the algorithm (the RS256→HS256 attack); the payload is **only base64 — anyone can read it**, so it is not secret.

## 5.5 OAuth / "Sign in with Google", decoded

1. Your app redirects to Google with `client_id`, `scope`, `redirect_uri`, **`state`**, and a PKCE challenge.
2. The user logs in **at Google**. Your app **never sees the password**.
3. Google redirects back with a short-lived, single-use **authorization code**.
4. Your **server** exchanges that code (+ client secret + PKCE verifier) for tokens.
5. You get an **id token** (who they are) → you create a session.

**Non-negotiable:** the `state` parameter (that's your CSRF protection for the callback), and **exact-match** the `redirect_uri` against an allowlist. Loose matching there is the classic account takeover.

## 5.6 Injection — untrusted data becoming code

```js
// ❌ The data becomes SQL.
db.query("SELECT * FROM users WHERE email = '" + email + "'");
//  email = "' OR '1'='1' --"   → returns EVERY user. Or drops your table.

// ✅ Parameterised. The value can NEVER cross into the query grammar.
db.query("SELECT * FROM users WHERE email = $1", [email]);
```

> **Parameterised queries fix SQL injection *completely*** — not "mostly", completely. The same idea applies anywhere untrusted data meets an interpreter: shell commands, `eval`, LDAP, XPath. **Never build any of them by string concatenation.**

## 5.7 The rest of the roll-call

| Attack | In one line | Defence |
|---|---|---|
| **XSS** | attacker's script runs on your page | escape on output; sanitize HTML; **CSP** as the safety net |
| **CSRF** | another site makes the browser POST **as the logged-in user** | `SameSite` cookies + CSRF token |
| **SSRF** | you fetch a user-supplied URL → they point it at `169.254.169.254` and steal your **cloud credentials** | allowlist hosts; block internal IP ranges |
| **Mass assignment** | client sends `{is_admin: true}` and your ORM saves it | explicitly pick allowed fields |
| **Path traversal** | filename `../../etc/passwd` | resolve the path, confirm it's still inside the root |

*(SSRF is how the Capital One breach happened.)*

## 5.8 🚨 Secrets — the trap everyone falls into once

> You commit an API key, notice, and remove it in the next commit.
>
> **That does nothing.** It's still in the git history, on every clone, in every fork, in GitHub's cache — **forever**. Bots scrape public commits for keys within *seconds*.
>
> **The only fix is to rotate the key. Immediately.** The commit is a lost cause; the live credential is what matters.

Secrets come from the **environment** or a secret manager — never from source, never from a committed `.env`. Add `.env` to `.gitignore` on line one of a new project. **Never log secrets, tokens, or PII** — a logged token is a leaked token.

---

<div align="center">

[← 🗄️ Part 4 · Databases](04-databases.md) · [**Contents**](../README.md#contents) · [🔁 Part 6 · Caching & queues →](06-caching-and-queues.md)

<sub><a href="#top">↑ back to top</a></sub>

</div>
