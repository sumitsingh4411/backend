# Secrets Management & TLS

Two things that protect your system's *keys* and its *conversations*.

---

# Part 1: Secrets Management

A **secret** is anything that grants access: database passwords, API keys, JWT signing keys, TLS private keys, OAuth client secrets.

## The cardinal sin: committing a secret

```js
// ❌ This is now permanent, public, and being scanned by bots right now
const stripe = new Stripe("sk_live_51H8xY2KZ...");
```

Bots continuously scrape GitHub for committed keys. Real-world time-to-exploit for a leaked AWS key is often **minutes** — attackers spin up crypto miners on your account and hand you a five-figure bill.

### 🚨 "I deleted it in the next commit" does not help

**Git history is permanent.** The secret is still in the repo's objects. It's in every clone, every fork, and probably already in a scraper's database.

> **The ONLY fix is to ROTATE the secret.** Revoke it at the provider and issue a new one. Rewriting history (`git filter-repo`, BFG) is worth doing to clean up — but do it *after* rotating, and never *instead* of rotating.

Assume any secret that has ever touched a commit is **burned**.

## Where secrets should live

**Level 1 — Environment variables** (the baseline)

```bash
# .env — LOCAL ONLY, and .env must be in .gitignore
DATABASE_URL=postgres://localhost/app_dev
JWT_SECRET=dev-only-not-real
```

```js
const secret = process.env.JWT_SECRET;
if (!secret) throw new Error("JWT_SECRET is required");   // fail fast at boot
```

Good enough for small projects. But env vars are visible to anyone who can read the process, they're often dumped into logs and crash reports, and they don't rotate.

**Level 2 — A secrets manager** (production)

AWS Secrets Manager, HashiCorp Vault, Google Secret Manager, Doppler, or your platform's encrypted variables.

You get what env vars can't give you:
- **Encryption at rest** and access control (which service may read which secret)
- **Audit logs** — who read this secret, and when
- **Rotation** — change the DB password automatically every 30 days
- **Versioning** — roll back a bad rotation

```js
// Fetch at boot, cache in memory — don't hit the API on every request
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const res = await client.send(new GetSecretValueCommand({ SecretId: "prod/db" }));
const { password } = JSON.parse(res.SecretString);
```

## The rules

- **Never commit secrets.** Add a scanner (`gitleaks`, GitHub secret scanning) to CI so it's *impossible*.
- **Never log them.** Redact by default — logs get shipped to third parties.
- **Never send them to the frontend.** Anything in the browser is public. (`NEXT_PUBLIC_*` and `VITE_*` prefixed vars are **baked into the JS bundle** — never put a real secret there.)
- **Different secrets per environment.** A leaked staging key must not open production.
- **Least privilege** — a read-only service gets a read-only DB user.
- **Rotate regularly**, and **immediately** on any suspicion.

---

# Part 2: TLS — how HTTPS actually works

TLS gives you three guarantees:

1. **Confidentiality** — nobody can read the traffic.
2. **Integrity** — nobody can modify it undetected.
3. **Authenticity** — you're really talking to `bank.com`, not an impostor.

That third one is the interesting part, and it's what certificates are for.

## The handshake (simplified)

```
1. Client → "Hello. I support TLS 1.3, these ciphers."

2. Server → "Hello. Here's my CERTIFICATE."
              (contains: domain name + public key + a CA's signature)

3. Client verifies the certificate:
     ✔ Is it signed by a Certificate Authority I trust?
     ✔ Does the domain match the one I typed?
     ✔ Is it still within its validity dates? Not revoked?

4. Both derive a shared SESSION KEY (via Diffie-Hellman —
   the key is never actually transmitted).

5. All further traffic is encrypted symmetrically (fast).
```

**Asymmetric crypto (slow) is used only to agree on a key. Symmetric crypto (fast) does the actual work.** That's the core design.

## Why certificates stop impersonation

Anyone can generate a key pair and claim to be `bank.com`. What they *cannot* do is get a **trusted Certificate Authority** to sign a certificate for a domain they don't control.

Your OS/browser ships with a list of ~150 trusted CAs. The CA verifies you own the domain (e.g. by asking you to serve a specific file), then signs your cert. That signature is the whole chain of trust.

> Without CAs, HTTPS would encrypt your conversation — **with an attacker.** Encryption without authentication is worthless.

## Getting a certificate (free, automatic)

```bash
# Certbot + Let's Encrypt — free, 90-day certs, auto-renewing
sudo certbot --nginx -d example.com -d www.example.com
```

Or use **Caddy**, which obtains and renews certificates **automatically with zero config**. In 2026 there is no excuse for plain HTTP.

## Configure it properly

- **TLS 1.2 minimum; prefer 1.3.** Disable SSLv3, TLS 1.0/1.1 — they're broken.
- **HSTS** — tell browsers to *never* use HTTP for your domain again:
  ```http
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  ```
  This kills SSL-stripping attacks (where an attacker downgrades the user to HTTP).
- **Redirect all HTTP → HTTPS.**
- **Automate renewal** and **alert on expiry**. An expired certificate is a full outage — and it happens to big companies embarrassingly often.
- **Test it:** run your domain through SSL Labs and aim for an A.

## mTLS (mutual TLS) — for service-to-service

Normal TLS: the *client* verifies the *server*. **mTLS: they verify each other** — the client also presents a certificate.

This is how zero-trust internal networks work: `service-a` can prove it's really `service-a`, so `service-b` can refuse everyone else. Service meshes (Istio, Linkerd) turn this on automatically for all internal traffic.

## Key takeaways

- **Never commit a secret.** Git history is permanent — the only real fix is to **rotate** it. Add a scanner to CI.
- Env vars are the baseline; a **secrets manager** adds encryption, access control, audit logs, and rotation.
- Never log secrets, never ship them to the frontend (`VITE_*`/`NEXT_PUBLIC_*` are public!), use least privilege, separate per environment.
- **TLS** = confidentiality + integrity + **authenticity**. The **certificate** (signed by a trusted CA) is what stops impersonation — encryption without authentication is worthless.
- Use **Let's Encrypt/Caddy** (free, automatic), enforce **TLS 1.2+**, enable **HSTS**, and never let a cert expire. **mTLS** secures service-to-service.
