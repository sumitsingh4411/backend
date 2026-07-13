# DNS & Domains

Computers find each other using **IP addresses** (like `93.184.216.34`). Humans are hopeless at remembering numbers, so we use **domain names** (`example.com`). DNS is the system that translates one into the other.

> **DNS = the internet's phone book.** You know the name; DNS finds the number.

It's the very first thing that happens on *every* request — and when it breaks, everything looks broken in confusing ways. It's worth 10 minutes of your life.

## What actually happens on a lookup

You type `api.example.com`. Your computer needs an IP, so it asks a chain of servers — but it checks its **caches** first, because DNS is cached at *every* level:

```
1. Browser cache        "seen it in the last minute?"        → done
2. OS cache             "seen it recently?"                  → done
3. Your resolver        (your ISP / 1.1.1.1 / 8.8.8.8)       → probably done
        │  (a cache miss here, and only here, means real work:)
        ├──▶ ROOT servers        "who handles .com?"
        ├──▶ .com servers        "who handles example.com?"
        └──▶ example.com's       "what's the IP of api.example.com?"
             nameservers          → 93.184.216.34 ✅
```

The full journey takes tens of milliseconds — but **the vast majority of lookups never leave step 1 or 2.** Caching is the whole reason DNS is fast.

## TTL: the number that will confuse you one day

Every DNS answer comes with a **TTL** (time-to-live): *"you may cache this for N seconds."*

```
api.example.com.   300   IN   A   93.184.216.34
                    ▲
                    └── cache this for 300 seconds (5 minutes)
```

Once handed out, that answer is cached **all over the world** and you **cannot recall it**. It lives until its TTL expires.

### 🚨 The classic production incident

You migrate your server to a new IP and update the DNS record. Then:

- Some users hit the **new** server. ✅
- Some users hit the **old** server (dead, or serving stale data). ❌
- You cannot reproduce it. "It works for me!"

**Nothing is broken.** Those users' resolvers are holding a cached answer with a TTL that hasn't expired yet. If your TTL was 24 hours, **you are waiting 24 hours.**

> 🔑 **The pro move: lower the TTL *before* you migrate.**
>
> A day ahead, drop the TTL to 60 seconds. Wait for the old (long) TTL to expire everywhere, so the whole world is now caching for only 60s. *Then* switch the IP — and the change propagates in about a minute. Raise the TTL again afterwards.
>
> **You must plan this in advance.** Lowering the TTL at migration time is too late — the old, long TTL is already cached.

## The record types you'll actually use

| Record | Maps | Example |
|---|---|---|
| **A** | name → **IPv4** | `example.com → 93.184.216.34` |
| **AAAA** | name → **IPv6** | `example.com → 2606:2800:220:1::` |
| **CNAME** | name → **another name** | `www.example.com → example.com` |
| **MX** | where **email** goes | `example.com → mail.google.com` |
| **TXT** | arbitrary text | domain verification, SPF, DKIM |
| **NS** | who is **authoritative** | delegates the domain |

**A vs CNAME — the practical difference:**
- **A** points at an **IP**. If your server's IP changes, you must update it.
- **CNAME** points at a **name**. So `www.example.com → myapp.herokuapp.com` keeps working even when Heroku changes the underlying IP. **This is why hosting platforms always ask for a CNAME** — it lets them move your app without telling you.

⚠️ **The gotcha:** you can't put a CNAME on the **root/apex** domain (`example.com`, no `www.`) — the spec forbids it, because the apex also needs MX and NS records. Providers work around it with `ALIAS` / `ANAME` / "CNAME flattening" (Cloudflare, Route 53). If a tutorial's instructions "don't work" for your root domain, this is why.

## Subdomains are just records

```
example.com          → your marketing site
api.example.com      → your backend
app.example.com      → your frontend app
cdn.example.com      → your CDN
staging.example.com  → staging
```

Each is just another DNS record pointing wherever you like. **Subdomains cost nothing** — you own the whole namespace under your domain. This is how you split traffic across services without buying more domains.

## Debug it yourself

Genuinely useful when something's wrong:

```bash
# What IP does this resolve to?
dig api.example.com +short

# See the TTL (the number before "IN A")
dig example.com

# Bypass your ISP's cache — ask Cloudflare directly.
# If this differs from your normal result, YOU have a stale cache.
dig @1.1.1.1 example.com

# Trace the whole chain: root → .com → your nameservers
dig +trace example.com

# Flush your local DNS cache (macOS)
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

> 💡 **"It works on my machine" for a DNS change is almost always a caching difference, not a real bug.** `dig @1.1.1.1` is how you prove it.

## Why this matters to a backend dev

- **Deploying** = pointing an A or CNAME record at your server or load balancer.
- **DNS is your first failure point.** If DNS is down, your perfectly healthy server is unreachable. It's also a **DDoS target**.
- **DNS-based failover / load balancing** — return different IPs to send users to the nearest region.
- **Propagation is not instant.** Plan TTLs around migrations, or you'll be debugging ghosts.

## Key takeaways

- DNS resolves **human names → machine IPs**, and it's cached at **every** level (browser, OS, resolver) — which is why it's fast.
- **TTL** controls how long an answer is cached. **You cannot recall an answer you've already given out.**
- 🔑 **Lower the TTL *before* a migration** (a day ahead), switch, then raise it. Doing it at migration time is too late.
- **A** → IP, **CNAME** → another name (which is why hosts want a CNAME — they can change IPs freely). **CNAME can't go on the apex** — use ALIAS/ANAME.
- Debug with **`dig`**; a "works for me" DNS bug is nearly always a **stale cache**.
